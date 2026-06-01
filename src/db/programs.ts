import { db } from "./client"
import type { Program, WorkoutType } from "./schema"
import { uid } from "@/lib/id"
import { enqueue } from "./sync"

export async function createProgram(name: string): Promise<Program> {
  const now = Date.now()
  const program: Program = { id: uid(), name, createdAt: now, updatedAt: now }
  await db.programs.add(program)
  await enqueue("upsert", "programs", program.id, program)
  return program
}

export async function listPrograms(): Promise<Program[]> {
  const rows = await db.programs.orderBy("createdAt").toArray()
  return rows.filter((p) => p.deletedAt == null)
}

export async function listWorkoutTypes(programId: string): Promise<WorkoutType[]> {
  const rows = await db.workoutTypes
    .where("programId")
    .equals(programId)
    .sortBy("order")
  return rows.filter((w) => w.deletedAt == null)
}

export async function addWorkoutType(
  programId: string,
  name: string,
): Promise<WorkoutType> {
  const existing = await listWorkoutTypes(programId)
  const wt: WorkoutType = {
    id: uid(),
    programId,
    name,
    order: existing.length,
    updatedAt: Date.now(),
  }
  await db.workoutTypes.add(wt)
  await enqueue("upsert", "workoutTypes", wt.id, wt)
  return wt
}

export async function renameWorkoutType(id: string, name: string): Promise<void> {
  const patch = { name, updatedAt: Date.now() }
  await db.workoutTypes.update(id, patch)
  const row = await db.workoutTypes.get(id)
  if (row) await enqueue("upsert", "workoutTypes", id, row)
}

export async function reorderWorkoutTypes(
  _programId: string,
  orderedIds: string[],
): Promise<void> {
  const now = Date.now()
  await db.transaction("rw", db.workoutTypes, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.workoutTypes.update(orderedIds[i], { order: i, updatedAt: now })
    }
  })
  for (const id of orderedIds) {
    const row = await db.workoutTypes.get(id)
    if (row) await enqueue("upsert", "workoutTypes", id, row)
  }
}

export async function deleteWorkoutType(id: string): Promise<void> {
  const now = Date.now()
  await db.transaction("rw", db.workoutTypes, db.exercises, async () => {
    const childIds = await db.exercises
      .where("workoutTypeId")
      .equals(id)
      .primaryKeys()
    for (const cid of childIds) {
      await db.exercises.update(cid, { deletedAt: now, updatedAt: now })
    }
    await db.workoutTypes.update(id, { deletedAt: now, updatedAt: now })
  })
  await enqueue("delete", "workoutTypes", id, null)
  const childIds = await db.exercises
    .where("workoutTypeId")
    .equals(id)
    .primaryKeys()
  for (const cid of childIds) {
    await enqueue("delete", "exercises", cid as string, null)
  }
}
