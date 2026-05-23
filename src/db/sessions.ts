import { db } from "./client"
import type { WorkoutSession, LoggedSet } from "./schema"
import { uid } from "@/lib/id"

function startOfDay(ts = Date.now()): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export async function startSession(workoutTypeId: string): Promise<WorkoutSession> {
  const session: WorkoutSession = {
    id: uid(),
    date: startOfDay(),
    workoutTypeId,
  }
  await db.sessions.add(session)
  return session
}

export async function getOrStartTodaysSession(
  workoutTypeId: string,
): Promise<WorkoutSession> {
  const today = startOfDay()
  const existing = await db.sessions
    .where("date").equals(today)
    .and((s) => s.workoutTypeId === workoutTypeId)
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
  const set: LoggedSet = {
    id: uid(),
    sessionId,
    exerciseName,
    weight,
    reps,
    setNumber,
    loggedAt: Date.now(),
  }
  await db.loggedSets.add(set)
  return set
}

export async function getSessionSets(sessionId: string): Promise<LoggedSet[]> {
  return db.loggedSets
    .where("sessionId").equals(sessionId)
    .sortBy("setNumber")
}

export async function getSessionSetsForExercise(
  sessionId: string,
  exerciseName: string,
): Promise<LoggedSet[]> {
  const sets = await db.loggedSets
    .where("sessionId").equals(sessionId)
    .toArray()
  return sets
    .filter((s) => s.exerciseName === exerciseName)
    .sort((a, b) => a.setNumber - b.setNumber)
}

export async function getLastSetsForExercise(
  exerciseName: string,
  excludeSessionId: string,
): Promise<LoggedSet[]> {
  const allSets = await db.loggedSets
    .where("exerciseName").equals(exerciseName)
    .toArray()
  const otherSessionSets = allSets.filter((s) => s.sessionId !== excludeSessionId)
  if (otherSessionSets.length === 0) return []
  const lastSessionId = otherSessionSets
    .slice()
    .sort((a, b) => b.loggedAt - a.loggedAt)[0].sessionId
  return otherSessionSets
    .filter((s) => s.sessionId === lastSessionId)
    .sort((a, b) => a.setNumber - b.setNumber)
}

export async function deleteSet(id: string): Promise<void> {
  await db.loggedSets.delete(id)
}
