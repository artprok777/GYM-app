import { describe, it, expect, beforeEach } from "vitest"
import { db } from "@/db/client"
import { getSchedule, setScheduleEntry } from "@/db/schedule"

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe("schedule db", () => {
  it("returns empty schedule for all 7 days initially", async () => {
    const s = await getSchedule()
    expect(s).toHaveLength(7)
    expect(s.every((e) => e.workoutTypeId === null)).toBe(true)
    expect(s.map((e) => e.dayOfWeek).sort()).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it("sets and reads a schedule entry", async () => {
    await setScheduleEntry(1, "wt-123") // Monday
    const s = await getSchedule()
    const monday = s.find((e) => e.dayOfWeek === 1)
    expect(monday?.workoutTypeId).toBe("wt-123")
  })

  it("clears entry by passing null", async () => {
    await setScheduleEntry(1, "wt-123")
    await setScheduleEntry(1, null)
    const s = await getSchedule()
    expect(s.find((e) => e.dayOfWeek === 1)?.workoutTypeId).toBeNull()
  })

  it("overwrites existing entry on same day", async () => {
    await setScheduleEntry(3, "wt-A")
    await setScheduleEntry(3, "wt-B")
    const s = await getSchedule()
    expect(s.find((e) => e.dayOfWeek === 3)?.workoutTypeId).toBe("wt-B")
  })
})
