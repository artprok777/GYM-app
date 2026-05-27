import { db } from "./client"
import type { LoggedSet } from "./schema"

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

export async function getWorkoutProgress(
  workoutTypeId: string,
  exerciseNames: string[],
): Promise<WorkoutExerciseProgress[]> {
  const sessions = (
    await db.sessions.where("workoutTypeId").equals(workoutTypeId).sortBy("date")
  ).filter((s) => s.deletedAt == null)
  const sessionIds = new Set(sessions.map((s) => s.id))
  const sessionDateById = new Map(sessions.map((s) => [s.id, s.date]))

  const results: WorkoutExerciseProgress[] = []
  for (const name of exerciseNames) {
    const sets = (
      await db.loggedSets.where("exerciseName").equals(name).toArray()
    ).filter((s) => sessionIds.has(s.sessionId) && s.deletedAt == null)

    if (sets.length === 0) continue

    const byDate = new Map<number, number>()
    for (const s of sets) {
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

function mondayOf(ts: number): number {
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
