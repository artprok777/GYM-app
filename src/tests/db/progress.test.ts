import { describe, it, expect, beforeEach } from "vitest"
import { db } from "@/db/client"
import { startSession, logSet } from "@/db/sessions"
import {
  getExerciseHistory,
  getPersonalRecord,
  getWorkoutProgress,
  getSessionsByWeek,
  getSessionDatesForWorkoutType,
} from "@/db/progress"

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe("progress queries", () => {
  it("returns exercise history sorted by date", async () => {
    const s1 = await startSession("wt-1")
    await db.sessions.update(s1.id, { date: 1000 })
    await logSet(s1.id, "Squat", 80, 5, 1)

    const s2 = await startSession("wt-1")
    await db.sessions.update(s2.id, { date: 2000 })
    await logSet(s2.id, "Squat", 85, 5, 1)

    const history = await getExerciseHistory("Squat")
    expect(history).toHaveLength(2)
    expect(history[0].date).toBe(1000)
    expect(history[0].maxWeight).toBe(80)
    expect(history[1].maxWeight).toBe(85)
  })

  it("returns personal record", async () => {
    const s = await startSession("wt-1")
    await logSet(s.id, "Squat", 80, 5, 1)
    await logSet(s.id, "Squat", 100, 1, 2)
    await logSet(s.id, "Squat", 90, 3, 3)
    expect(await getPersonalRecord("Squat")).toBe(100)
  })

  it("returns null PR when no sets exist", async () => {
    expect(await getPersonalRecord("Squat")).toBeNull()
  })

  it("computes workout progress per exercise (first vs latest)", async () => {
    const s1 = await startSession("wt-1")
    await db.sessions.update(s1.id, { date: 1000 })
    await logSet(s1.id, "Squat", 80, 5, 1)
    await logSet(s1.id, "Bench", 60, 5, 1)

    const s2 = await startSession("wt-1")
    await db.sessions.update(s2.id, { date: 2000 })
    await logSet(s2.id, "Squat", 100, 5, 1)
    await logSet(s2.id, "Bench", 60, 5, 1)

    const progress = await getWorkoutProgress("wt-1", ["Squat", "Bench"])
    const squat = progress.find((p) => p.exerciseName === "Squat")!
    expect(squat.firstWeight).toBe(80)
    expect(squat.latestWeight).toBe(100)
    const bench = progress.find((p) => p.exerciseName === "Bench")!
    expect(bench.firstWeight).toBe(60)
    expect(bench.latestWeight).toBe(60)
  })

  it("groups sessions by week (Monday-anchored)", async () => {
    const s1 = await startSession("wt-1")
    await db.sessions.update(s1.id, { date: new Date("2026-05-04").getTime() })
    const s2 = await startSession("wt-1")
    await db.sessions.update(s2.id, { date: new Date("2026-05-06").getTime() })
    const s3 = await startSession("wt-1")
    await db.sessions.update(s3.id, { date: new Date("2026-05-11").getTime() })

    const weeks = await getSessionsByWeek()
    expect(weeks.length).toBeGreaterThanOrEqual(2)
    const firstWeek = weeks.find((w) => w.count === 2)
    expect(firstWeek).toBeTruthy()
  })

  it("returns session dates for a workout type", async () => {
    const s1 = await startSession("wt-A")
    await db.sessions.update(s1.id, { date: 1000 })
    const s2 = await startSession("wt-A")
    await db.sessions.update(s2.id, { date: 2000 })
    const s3 = await startSession("wt-B")
    await db.sessions.update(s3.id, { date: 1500 })

    const dates = await getSessionDatesForWorkoutType("wt-A")
    expect(dates).toEqual([1000, 2000])
  })
})
