import { db } from "./client"
import type { WorkoutSession, LoggedSet } from "./schema"
import { uid } from "@/lib/id"
import { enqueue } from "./sync"

function startOfDay(ts = Date.now()): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export async function startSession(workoutTypeId: string): Promise<WorkoutSession> {
  const now = Date.now()
  const session: WorkoutSession = {
    id: uid(),
    date: startOfDay(),
    workoutTypeId,
    updatedAt: now,
  }
  await db.sessions.add(session)
  await enqueue("upsert", "sessions", session.id, session)
  return session
}

export async function getOrStartTodaysSession(
  workoutTypeId: string,
): Promise<WorkoutSession> {
  const today = startOfDay()
  const existing = await db.sessions
    .where("date")
    .equals(today)
    .and((s) => s.workoutTypeId === workoutTypeId && s.deletedAt == null)
    .first()
  if (existing) return existing
  return startSession(workoutTypeId)
}

export async function logSet(
  sessionId: string,
  exerciseName: string,
  weight: number,
  reps: number,
  setNumber: number,
): Promise<LoggedSet> {
  const now = Date.now()
  const set: LoggedSet = {
    id: uid(),
    sessionId,
    exerciseName,
    weight,
    reps,
    setNumber,
    loggedAt: now,
    updatedAt: now,
  }
  await db.loggedSets.add(set)
  await enqueue("upsert", "loggedSets", set.id, set)
  return set
}

export async function getSessionSets(sessionId: string): Promise<LoggedSet[]> {
  const rows = await db.loggedSets
    .where("sessionId")
    .equals(sessionId)
    .sortBy("setNumber")
  return rows.filter((s) => s.deletedAt == null)
}

export async function getSessionSetsForExercise(
  sessionId: string,
  exerciseName: string,
): Promise<LoggedSet[]> {
  const sets = await db.loggedSets
    .where("sessionId")
    .equals(sessionId)
    .toArray()
  return sets
    .filter((s) => s.exerciseName === exerciseName && s.deletedAt == null)
    .sort((a, b) => a.setNumber - b.setNumber)
}

export async function getLastSetsForExercise(
  exerciseName: string,
  excludeSessionId: string,
): Promise<LoggedSet[]> {
  const allSets = await db.loggedSets
    .where("exerciseName")
    .equals(exerciseName)
    .toArray()
  const otherSessionSets = allSets.filter(
    (s) => s.sessionId !== excludeSessionId && s.deletedAt == null,
  )
  if (otherSessionSets.length === 0) return []
  const lastSessionId = otherSessionSets
    .slice()
    .sort((a, b) => b.loggedAt - a.loggedAt)[0].sessionId
  return otherSessionSets
    .filter((s) => s.sessionId === lastSessionId)
    .sort((a, b) => a.setNumber - b.setNumber)
}

export async function updateSet(
  id: string,
  patch: Partial<Pick<LoggedSet, "weight" | "reps">>,
): Promise<void> {
  await db.loggedSets.update(id, { ...patch, updatedAt: Date.now() })
  const row = await db.loggedSets.get(id)
  if (row) await enqueue("upsert", "loggedSets", id, row)
}

export async function deleteSet(id: string): Promise<void> {
  const now = Date.now()
  await db.loggedSets.update(id, { deletedAt: now, updatedAt: now })
  await enqueue("delete", "loggedSets", id, null)
}
