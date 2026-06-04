import { db } from "./client"
import type { LoggedSet } from "./schema"
import { getSchedule } from "./schedule"
import { listExercises } from "./exercises"
import { getSessionSets } from "./sessions"
import { listPrograms, listWorkoutTypes } from "./programs"

export interface ExerciseHistoryPoint {
  sessionId: string
  date: number
  maxWeight: number
  totalVolume: number
  sets: number
}

export async function getExerciseHistory(
  exerciseName: string,
  fromDate?: number,
  toDate?: number,
): Promise<ExerciseHistoryPoint[]> {
  const allSets = (
    await db.loggedSets.where("exerciseName").equals(exerciseName).toArray()
  ).filter((s) => s.deletedAt == null)
  const sessions = (await db.sessions.toArray()).filter(
    (s) => s.deletedAt == null,
  )
  const sessionById = new Map(sessions.map((s) => [s.id, s]))

  const grouped = new Map<string, LoggedSet[]>()
  for (const set of allSets) {
    const arr = grouped.get(set.sessionId) ?? []
    arr.push(set)
    grouped.set(set.sessionId, arr)
  }

  const points: ExerciseHistoryPoint[] = []
  for (const [sessionId, sets] of grouped) {
    const session = sessionById.get(sessionId)
    if (!session) continue
    if (fromDate && session.date < fromDate) continue
    if (toDate && session.date > toDate) continue
    points.push({
      sessionId,
      date: session.date,
      maxWeight: Math.max(...sets.map((s) => s.weight)),
      totalVolume: sets.reduce((sum, s) => sum + s.weight * s.reps, 0),
      sets: sets.length,
    })
  }
  return points.sort((a, b) => a.date - b.date)
}

export interface ExerciseSessionEntry {
  sessionId: string
  date: number
  sets: LoggedSet[]
}

export async function getExerciseSessionHistory(
  exerciseName: string,
): Promise<ExerciseSessionEntry[]> {
  const allSets = (
    await db.loggedSets.where("exerciseName").equals(exerciseName).toArray()
  ).filter((s) => s.deletedAt == null)
  const sessions = (await db.sessions.toArray()).filter(
    (s) => s.deletedAt == null,
  )
  const sessionById = new Map(sessions.map((s) => [s.id, s]))

  const bySession = new Map<string, LoggedSet[]>()
  for (const s of allSets) {
    const arr = bySession.get(s.sessionId) ?? []
    arr.push(s)
    bySession.set(s.sessionId, arr)
  }

  const entries: ExerciseSessionEntry[] = []
  for (const [sessionId, sets] of bySession) {
    const session = sessionById.get(sessionId)
    if (!session) continue
    entries.push({
      sessionId,
      date: session.date,
      sets: sets.sort((a, b) => a.setNumber - b.setNumber),
    })
  }
  return entries.sort((a, b) => b.date - a.date)
}

export async function getPersonalRecord(
  exerciseName: string,
): Promise<number | null> {
  const sets = (
    await db.loggedSets.where("exerciseName").equals(exerciseName).toArray()
  ).filter((s) => s.deletedAt == null)
  if (sets.length === 0) return null
  return Math.max(...sets.map((s) => s.weight))
}

export interface WorkoutExerciseProgress {
  exerciseName: string
  firstWeight: number
  latestWeight: number
  firstDate: number
  latestDate: number
}

export interface ExerciseProgressSummary {
  pr: number | null
  latestWeight: number | null
  previousWeight: number | null
  deltaWeight: number | null
  deltaPercent: number | null
  latestLoad: number | null
  previousLoad: number | null
  loadDelta: number | null
  loadDeltaPercent: number | null
}

export interface WorkoutProgressSummaryRow extends WorkoutExerciseProgress {
  deltaWeight: number
  deltaPercent: number | null
}

export interface WorkoutProgressSummary {
  sessionCount: number
  progressExerciseCount: number
  biggestGain: WorkoutProgressSummaryRow | null
  rows: WorkoutProgressSummaryRow[]
}

function percentChange(first: number, latest: number): number | null {
  if (first === 0) return null
  return ((latest - first) / first) * 100
}

export function summarizeExerciseProgress(
  history: ExerciseHistoryPoint[],
  pr: number | null,
): ExerciseProgressSummary {
  const sorted = [...history].sort((a, b) => a.date - b.date)
  const latest = sorted.at(-1)
  const previous = sorted.at(-2)

  return {
    pr,
    latestWeight: latest?.maxWeight ?? null,
    previousWeight: previous?.maxWeight ?? null,
    deltaWeight:
      latest && previous ? latest.maxWeight - previous.maxWeight : null,
    deltaPercent:
      latest && previous
        ? percentChange(previous.maxWeight, latest.maxWeight)
        : null,
    latestLoad: latest?.totalVolume ?? null,
    previousLoad: previous?.totalVolume ?? null,
    loadDelta:
      latest && previous ? latest.totalVolume - previous.totalVolume : null,
    loadDeltaPercent:
      latest && previous
        ? percentChange(previous.totalVolume, latest.totalVolume)
        : null,
  }
}

export function summarizeWorkoutProgress(
  progress: WorkoutExerciseProgress[],
  sessionDates: number[],
): WorkoutProgressSummary {
  const rows = progress.map((p) => ({
    ...p,
    deltaWeight: p.latestWeight - p.firstWeight,
    deltaPercent: percentChange(p.firstWeight, p.latestWeight),
  }))
  const biggestGain =
    rows.length > 0
      ? [...rows].sort((a, b) => b.deltaWeight - a.deltaWeight)[0]
      : null

  return {
    sessionCount: sessionDates.length,
    progressExerciseCount: rows.length,
    biggestGain,
    rows,
  }
}

export async function getWorkoutProgress(
  workoutTypeId: string,
  exerciseNames: string[],
): Promise<WorkoutExerciseProgress[]> {
  if (exerciseNames.length === 0) return []

  const sessions = (
    await db.sessions.where("workoutTypeId").equals(workoutTypeId).sortBy("date")
  ).filter((s) => s.deletedAt == null)
  const sessionIds = new Set(sessions.map((s) => s.id))
  const sessionDateById = new Map(sessions.map((s) => [s.id, s.date]))
  const setsByExercise = new Map<string, LoggedSet[]>()
  const sets = (
    await db.loggedSets.where("exerciseName").anyOf(exerciseNames).toArray()
  ).filter((s) => sessionIds.has(s.sessionId) && s.deletedAt == null)

  for (const set of sets) {
    const group = setsByExercise.get(set.exerciseName) ?? []
    group.push(set)
    setsByExercise.set(set.exerciseName, group)
  }

  const results: WorkoutExerciseProgress[] = []
  for (const name of exerciseNames) {
    const exerciseSets = setsByExercise.get(name) ?? []

    if (exerciseSets.length === 0) continue

    const byDate = new Map<number, number>()
    for (const s of exerciseSets) {
      const d = sessionDateById.get(s.sessionId)!
      byDate.set(d, Math.max(byDate.get(d) ?? 0, s.weight))
    }
    const sorted = [...byDate.entries()].sort((a, b) => a[0] - b[0])
    results.push({
      exerciseName: name,
      firstDate: sorted[0][0],
      firstWeight: sorted[0][1],
      latestDate: sorted[sorted.length - 1][0],
      latestWeight: sorted[sorted.length - 1][1],
    })
  }
  return results
}

export interface WeekStat {
  weekStart: number
  count: number
}

export function mondayOf(ts: number): number {
  const d = new Date(ts)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export async function getSessionsByWeek(): Promise<WeekStat[]> {
  const sessions = (await db.sessions.toArray()).filter(
    (s) => s.deletedAt == null,
  )
  const counts = new Map<number, number>()
  for (const s of sessions) {
    const week = mondayOf(s.date)
    counts.set(week, (counts.get(week) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([weekStart, count]) => ({ weekStart, count }))
    .sort((a, b) => a.weekStart - b.weekStart)
}

export async function getSessionDatesForWorkoutType(
  workoutTypeId: string,
): Promise<number[]> {
  const sessions = (
    await db.sessions.where("workoutTypeId").equals(workoutTypeId).toArray()
  ).filter((s) => s.deletedAt == null)
  return sessions.map((s) => s.date).sort((a, b) => a - b)
}

// --- Streak + Week Strip ---

const DAY_MS = 86_400_000

function startOfDay(ts = Date.now()): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export type DayState = "done" | "partial" | "missed" | "rest" | "future" | "today"

export interface DayCompletion {
  date: number
  dayOfWeek: number
  state: DayState
  workoutTypeId: string | null
  workoutName?: string
  totalSets: number
  exerciseCount: number
  completedExercises: number
}

async function computeDayState(date: number): Promise<DayCompletion> {
  const dayOfWeek = new Date(date).getDay()
  const todayMs = startOfDay()
  const isToday = date === todayMs

  if (date > todayMs) {
    return { date, dayOfWeek, state: "future", workoutTypeId: null, totalSets: 0, exerciseCount: 0, completedExercises: 0 }
  }

  const schedule = await getSchedule()
  const workoutTypeId = schedule.find(e => e.dayOfWeek === dayOfWeek)?.workoutTypeId ?? null

  if (workoutTypeId == null) {
    return { date, dayOfWeek, state: "rest", workoutTypeId: null, totalSets: 0, exerciseCount: 0, completedExercises: 0 }
  }

  const programs = await listPrograms()
  let workoutName: string | undefined
  if (programs[0]) {
    const types = await listWorkoutTypes(programs[0].id)
    workoutName = types.find(t => t.id === workoutTypeId)?.name
  }

  const exercises = await listExercises(workoutTypeId)
  const exerciseCount = exercises.length

  const session = await db.sessions
    .where("date")
    .equals(date)
    .and(s => s.workoutTypeId === workoutTypeId && s.deletedAt == null)
    .first()

  if (!session || exerciseCount === 0) {
    return { date, dayOfWeek, state: isToday ? "today" : "missed", workoutTypeId, workoutName, totalSets: 0, exerciseCount, completedExercises: 0 }
  }

  const allSets = await getSessionSets(session.id)
  const totalSets = allSets.length

  let completedExercises = 0
  for (const ex of exercises) {
    const logged = allSets.filter(s => s.exerciseName === ex.name).length
    if (logged >= ex.targetSets) completedExercises++
  }

  let state: DayState
  if (completedExercises === exerciseCount) {
    state = "done"
  } else if (totalSets > 0) {
    state = isToday ? "today" : "partial"
  } else {
    state = isToday ? "today" : "missed"
  }

  return { date, dayOfWeek, state, workoutTypeId, workoutName, totalSets, exerciseCount, completedExercises }
}

export async function getWeekCompletions(weekStartMs: number): Promise<DayCompletion[]> {
  const results: DayCompletion[] = []
  for (let i = 0; i < 7; i++) {
    results.push(await computeDayState(weekStartMs + i * DAY_MS))
  }
  return results
}

export async function getCurrentStreak(): Promise<number> {
  let cursor = startOfDay()
  let count = 0
  for (let i = 0; i < 365; i++) {
    const c = await computeDayState(cursor)
    if (c.state === "done") {
      count++
    } else if (c.state === "rest") {
      // neutral — skip
    } else if (c.state === "today") {
      // day still in progress, don't break streak
    } else {
      break
    }
    cursor -= DAY_MS
  }
  return count
}
