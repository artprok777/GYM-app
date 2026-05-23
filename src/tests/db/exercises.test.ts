import { describe, it, expect, beforeEach } from "vitest"
import { db } from "@/db/client"
import { createProgram, addWorkoutType } from "@/db/programs"
import {
  addExercise,
  listExercises,
  updateExercise,
  reorderExercises,
  deleteExercise,
} from "@/db/exercises"

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe("exercises db", () => {
  it("adds exercises in order", async () => {
    const p = await createProgram("p")
    const wt = await addWorkoutType(p.id, "A")
    await addExercise(wt.id, "Squat", 3)
    await addExercise(wt.id, "Bench", 3)
    const list = await listExercises(wt.id)
    expect(list.map((e) => e.name)).toEqual(["Squat", "Bench"])
    expect(list[0].order).toBe(0)
    expect(list[1].order).toBe(1)
  })

  it("updates an exercise", async () => {
    const p = await createProgram("p")
    const wt = await addWorkoutType(p.id, "A")
    const ex = await addExercise(wt.id, "Squat", 3)
    await updateExercise(ex.id, { name: "Front Squat", targetSets: 5 })
    const list = await listExercises(wt.id)
    expect(list[0].name).toBe("Front Squat")
    expect(list[0].targetSets).toBe(5)
  })

  it("reorders exercises", async () => {
    const p = await createProgram("p")
    const wt = await addWorkoutType(p.id, "A")
    const a = await addExercise(wt.id, "A", 3)
    const b = await addExercise(wt.id, "B", 3)
    const c = await addExercise(wt.id, "C", 3)
    await reorderExercises(wt.id, [c.id, a.id, b.id])
    const list = await listExercises(wt.id)
    expect(list.map((e) => e.name)).toEqual(["C", "A", "B"])
  })

  it("deletes an exercise", async () => {
    const p = await createProgram("p")
    const wt = await addWorkoutType(p.id, "A")
    const ex = await addExercise(wt.id, "Squat", 3)
    await deleteExercise(ex.id)
    expect(await listExercises(wt.id)).toHaveLength(0)
  })
})
