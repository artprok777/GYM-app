import { db } from "./client"
import type { ScheduleEntry, DayOfWeek } from "./schema"
import { enqueue } from "./sync"

export async function getSchedule(): Promise<ScheduleEntry[]> {
  const existing = await db.schedule.toArray()
  const live = existing.filter((e) => e.deletedAt == null)
  const map = new Map(live.map((e) => [e.dayOfWeek, e]))
  const days: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6]
  return days.map(
    (d) =>
      map.get(d) ?? {
        dayOfWeek: d,
        workoutTypeId: null,
        updatedAt: 0,
      },
  )
}

export async function setScheduleEntry(
  dayOfWeek: DayOfWeek,
  workoutTypeId: string | null,
): Promise<void> {
  const row: ScheduleEntry = {
    dayOfWeek,
    workoutTypeId,
    updatedAt: Date.now(),
  }
  await db.schedule.put(row)
  await enqueue("upsert", "schedule", String(dayOfWeek), row)
}

export async function getTodaysWorkoutType(): Promise<string | null> {
  const today = new Date().getDay() as DayOfWeek
  const entry = await db.schedule.get(today)
  if (!entry || entry.deletedAt != null) return null
  return entry.workoutTypeId ?? null
}
