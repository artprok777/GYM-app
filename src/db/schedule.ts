import { db } from "./client"
import type { ScheduleEntry, DayOfWeek } from "./schema"

export async function getSchedule(): Promise<ScheduleEntry[]> {
  const existing = await db.schedule.toArray()
  const map = new Map(existing.map((e) => [e.dayOfWeek, e]))
  const days: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6]
  return days.map(
    (d) => map.get(d) ?? { dayOfWeek: d, workoutTypeId: null },
  )
}

export async function setScheduleEntry(
  dayOfWeek: DayOfWeek,
  workoutTypeId: string | null,
): Promise<void> {
  await db.schedule.put({ dayOfWeek, workoutTypeId })
}

export async function getTodaysWorkoutType(): Promise<string | null> {
  const today = new Date().getDay() as DayOfWeek
  const entry = await db.schedule.get(today)
  return entry?.workoutTypeId ?? null
}
