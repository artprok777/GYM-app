import { describe, it, expect, beforeEach } from "vitest"
import { db } from "@/db/client"
import {
  startSession,
  getOrStartTodaysSession,
  logSet,
  getSessionSets,
  getSessionSetsForExercise,
  getLastSetsForExercise,
  updateSet,
  deleteSet,
} from "@/db/sessions"

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe("sessions db", () => {
  it("starts a session for today", async () => {
    const s = await startSession("wt-1")
    expect(s.workoutTypeId).toBe("wt-1")
    expect(s.date).toBeGreaterThan(0)
  })

  it("reuses today's session if one already exists for the workout type", async () => {
    const s1 = await getOrStartTodaysSession("wt-1")
    const s2 = await getOrStartTodaysSession("wt-1")
    expect(s2.id).toBe(s1.id)
  })

  it("logs a set and retrieves it", async () => {
    const s = await startSession("wt-1")
    await logSet(s.id, "Squat", 80, 5, 1)
    const sets = await getSessionSets(s.id)
    expect(sets).toHaveLength(1)
    expect(sets[0].weight).toBe(80)
    expect(sets[0].reps).toBe(5)
  })

  it("filters session sets by exercise name", async () => {
    const s = await startSession("wt-1")
    await logSet(s.id, "Squat", 80, 5, 1)
    await logSet(s.id, "Bench", 60, 5, 1)
    await logSet(s.id, "Squat", 80, 5, 2)
    const squat = await getSessionSetsForExercise(s.id, "Squat")
    expect(squat).toHaveLength(2)
    expect(squat.every((x) => x.exerciseName === "Squat")).toBe(true)
  })

  it("retrieves last completed sets for an exercise from previous session", async () => {
    const s1 = await startSession("wt-1")
    await logSet(s1.id, "Squat", 80, 5, 1)
    await logSet(s1.id, "Squat", 80, 5, 2)
    const s2 = await startSession("wt-1")
    await db.sessions.update(s2.id, { date: s1.date + 86400000 })
    const last = await getLastSetsForExercise("Squat", s2.id)
    expect(last).toHaveLength(2)
    expect(last[0].weight).toBe(80)
  })

  it("returns empty when no previous sets exist", async () => {
    const s = await startSession("wt-1")
    const last = await getLastSetsForExercise("Squat", s.id)
    expect(last).toEqual([])
  })

  it("deletes a set", async () => {
    const s = await startSession("wt-1")
    const set = await logSet(s.id, "Squat", 80, 5, 1)
    await deleteSet(set.id)
    expect(await getSessionSets(s.id)).toHaveLength(0)
  })

  it("updates weight and reps of a logged set", async () => {
    const s = await startSession("wt-1")
    const set = await logSet(s.id, "Squat", 80, 5, 1)
    await updateSet(set.id, { weight: 82.5, reps: 8 })
    const sets = await getSessionSets(s.id)
    expect(sets[0].weight).toBe(82.5)
    expect(sets[0].reps).toBe(8)
    expect(sets[0].setNumber).toBe(1)
  })
})
