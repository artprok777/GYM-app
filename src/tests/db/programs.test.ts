import { describe, it, expect, beforeEach } from "vitest"
import { db } from "@/db/client"
import {
  createProgram,
  listPrograms,
  listWorkoutTypes,
  addWorkoutType,
  renameWorkoutType,
  deleteWorkoutType,
} from "@/db/programs"

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe("programs db", () => {
  it("creates a program", async () => {
    const program = await createProgram("My Program")
    expect(program.id).toBeTruthy()
    expect(program.name).toBe("My Program")
    const all = await listPrograms()
    expect(all).toHaveLength(1)
    expect(all[0].name).toBe("My Program")
  })

  it("adds workout types ordered by creation", async () => {
    const program = await createProgram("p")
    await addWorkoutType(program.id, "Тренування A")
    await addWorkoutType(program.id, "Тренування B")
    const types = await listWorkoutTypes(program.id)
    expect(types.map((t) => t.name)).toEqual(["Тренування A", "Тренування B"])
    expect(types[0].order).toBe(0)
    expect(types[1].order).toBe(1)
  })

  it("renames a workout type", async () => {
    const program = await createProgram("p")
    const wt = await addWorkoutType(program.id, "Old")
    await renameWorkoutType(wt.id, "New")
    const types = await listWorkoutTypes(program.id)
    expect(types[0].name).toBe("New")
  })

  it("deletes a workout type along with its exercises", async () => {
    const program = await createProgram("p")
    const wt = await addWorkoutType(program.id, "A")
    await db.exercises.add({
      id: "ex1",
      workoutTypeId: wt.id,
      name: "Squat",
      targetSets: 3,
      order: 0,
    })
    await deleteWorkoutType(wt.id)
    const types = await listWorkoutTypes(program.id)
    expect(types).toHaveLength(0)
    const ex = await db.exercises.where("workoutTypeId").equals(wt.id).count()
    expect(ex).toBe(0)
  })
})
