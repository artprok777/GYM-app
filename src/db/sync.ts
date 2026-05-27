import { db } from "./client"
import { supabase, USER_ID, cloudEnabled } from "./supabase"
import type { ScheduleEntry, SyncQueueEntry, SyncTable } from "./schema"
import { uid } from "@/lib/id"

const LAST_PULLED_KEY = "gym-tracker:last_pulled_at"
const BOOTSTRAP_KEY = "gym-tracker:has_synced_once"
const PUSH_INTERVAL_MS = 5000
const MAX_BATCH = 50

type Row = { id?: string; dayOfWeek?: number; updatedAt: number; deletedAt?: number }

const TABLE_TO_REMOTE: Record<SyncTable, string> = {
  programs: "programs",
  workoutTypes: "workout_types",
  schedule: "schedule",
  exercises: "exercises",
  sessions: "sessions",
  loggedSets: "logged_sets",
}

const REMOTE_TO_LOCAL: Record<string, SyncTable> = Object.fromEntries(
  Object.entries(TABLE_TO_REMOTE).map(([k, v]) => [v, k as SyncTable]),
) as Record<string, SyncTable>

export async function enqueue(
  op: "upsert" | "delete",
  table: SyncTable,
  recordId: string,
  payload: unknown,
): Promise<void> {
  if (!cloudEnabled) return
  const entry: SyncQueueEntry = {
    id: uid(),
    op,
    table,
    recordId,
    payload,
    createdAt: Date.now(),
    attempts: 0,
  }
  await db.syncQueue.add(entry)
}

function camelToSnake(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    const snake = k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase())
    out[snake] = v
  }
  return out
}

function snakeToCamel(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    out[camel] = v
  }
  return out
}

function toRemotePayload(table: SyncTable, payload: unknown): Record<string, unknown> {
  const snake = camelToSnake(payload as Record<string, unknown>)
  snake.user_id = USER_ID
  if (snake.updated_at != null) {
    snake.updated_at = new Date(snake.updated_at as number).toISOString()
  }
  if (snake.deleted_at != null) {
    snake.deleted_at = new Date(snake.deleted_at as number).toISOString()
  }
  if (table === "schedule") {
    delete snake.id // schedule has composite PK
  }
  return snake
}

function fromRemoteRow(table: SyncTable, row: Record<string, unknown>): Row {
  const camel = snakeToCamel(row)
  if (camel.updatedAt != null) {
    camel.updatedAt = new Date(camel.updatedAt as string).getTime()
  }
  if (camel.deletedAt != null) {
    camel.deletedAt = new Date(camel.deletedAt as string).getTime()
  }
  delete camel.userId
  if (table === "schedule") {
    camel.id = undefined
  }
  return camel as unknown as Row
}

async function applyRemoteRow(table: SyncTable, row: Row): Promise<void> {
  const tbl = db.table(table)
  if (table === "schedule") {
    const dow = (row as ScheduleEntry).dayOfWeek
    if (row.deletedAt != null) {
      await tbl.delete(dow)
      return
    }
    const local = (await tbl.get(dow)) as ScheduleEntry | undefined
    if (!local || (local.updatedAt ?? 0) < row.updatedAt) {
      await tbl.put(row)
    }
    return
  }
  const id = row.id!
  if (row.deletedAt != null) {
    await tbl.delete(id)
    return
  }
  const local = (await tbl.get(id)) as Row | undefined
  if (!local || (local.updatedAt ?? 0) < row.updatedAt) {
    await tbl.put(row)
  }
}

async function pushEntry(entry: SyncQueueEntry): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured")
  const remoteTable = TABLE_TO_REMOTE[entry.table]
  if (entry.op === "upsert") {
    const payload = toRemotePayload(entry.table, entry.payload)
    const onConflict =
      entry.table === "schedule" ? "user_id,day_of_week" : "id"
    const { error } = await supabase
      .from(remoteTable)
      .upsert(payload, { onConflict })
    if (error) throw error
  } else {
    if (entry.table === "schedule") {
      const dow = parseInt(entry.recordId, 10)
      const { error } = await supabase
        .from(remoteTable)
        .update({ deleted_at: new Date().toISOString() })
        .eq("user_id", USER_ID)
        .eq("day_of_week", dow)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from(remoteTable)
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", entry.recordId)
      if (error) throw error
    }
  }
}

let pushInFlight = false

export async function pushQueue(): Promise<void> {
  if (!cloudEnabled || !navigator.onLine || pushInFlight) return
  pushInFlight = true
  try {
    const now = Date.now()
    const pending = await db.syncQueue
      .filter((e) => {
        if (e.syncedAt != null) return false
        const backoff = Math.min(60_000, 1000 * Math.pow(4, e.attempts))
        return now - (e.createdAt + backoff * Math.max(0, e.attempts)) >= 0
      })
      .limit(MAX_BATCH)
      .toArray()
    for (const entry of pending) {
      try {
        await pushEntry(entry)
        await db.syncQueue.update(entry.id, { syncedAt: Date.now() })
      } catch (err) {
        await db.syncQueue.update(entry.id, {
          attempts: entry.attempts + 1,
          lastError: err instanceof Error ? err.message : String(err),
        })
      }
    }
  } finally {
    pushInFlight = false
  }
}

export async function pullChanges(): Promise<void> {
  if (!cloudEnabled || !supabase || !navigator.onLine) return
  const since = localStorage.getItem(LAST_PULLED_KEY) ?? "1970-01-01T00:00:00Z"
  const startedAt = new Date().toISOString()
  for (const local of Object.keys(TABLE_TO_REMOTE) as SyncTable[]) {
    const remote = TABLE_TO_REMOTE[local]
    const { data, error } = await supabase
      .from(remote)
      .select("*")
      .eq("user_id", USER_ID)
      .gt("updated_at", since)
    if (error) {
      console.error("[sync] pull error", remote, error)
      continue
    }
    for (const row of data ?? []) {
      await applyRemoteRow(local, fromRemoteRow(local, row))
    }
  }
  localStorage.setItem(LAST_PULLED_KEY, startedAt)
}

async function bootstrapInitialUpload(): Promise<void> {
  if (!cloudEnabled) return
  if (localStorage.getItem(BOOTSTRAP_KEY)) return
  const now = Date.now()
  const tables: SyncTable[] = [
    "programs",
    "workoutTypes",
    "schedule",
    "exercises",
    "sessions",
    "loggedSets",
  ]
  for (const t of tables) {
    const rows = await db.table(t).toArray()
    for (const row of rows) {
      if (row.updatedAt == null) {
        row.updatedAt = now
        await db.table(t).put(row)
      }
      const recordId =
        t === "schedule" ? String(row.dayOfWeek) : (row.id as string)
      await enqueue("upsert", t, recordId, row)
    }
  }
  localStorage.setItem(BOOTSTRAP_KEY, String(Date.now()))
}

export async function bootstrap(): Promise<void> {
  if (!cloudEnabled) return
  await bootstrapInitialUpload()
  await pullChanges()
  await pushQueue()
}

export function startSync(): () => void {
  if (!cloudEnabled || !supabase) return () => {}

  const intervalId = setInterval(() => {
    pushQueue()
  }, PUSH_INTERVAL_MS)

  const onOnline = () => {
    pushQueue()
    pullChanges()
  }
  window.addEventListener("online", onOnline)

  const sb = supabase
  const channel = sb.channel("gym-sync")
  for (const remote of Object.keys(REMOTE_TO_LOCAL)) {
    // realtime event signature is loosely typed in v2
    ;(channel as unknown as {
      on: (
        event: string,
        filter: unknown,
        handler: (payload: {
          new?: Record<string, unknown>
          old?: Record<string, unknown>
        }) => void,
      ) => void
    }).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: remote,
        filter: `user_id=eq.${USER_ID}`,
      },
      (payload) => {
        const local = REMOTE_TO_LOCAL[remote]
        const row = payload.new ?? payload.old
        if (!row) return
        applyRemoteRow(local, fromRemoteRow(local, row)).catch((e) =>
          console.error("[sync] realtime apply error", e),
        )
      },
    )
  }
  channel.subscribe()

  return () => {
    clearInterval(intervalId)
    window.removeEventListener("online", onOnline)
    sb.removeChannel(channel)
  }
}

export type { SyncQueueEntry } from "./schema"
