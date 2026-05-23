import { db } from "./client"
import type { Program, WorkoutType } from "./schema"

const uid = () => crypto.randomUUID()

export async function createProgram(name: string): Promise<Program> {
  const program: Program = { id: uid(), name, createdAt: Date.now() }
  await db.programs.add(program)
  return program
}

export async function listPrograms(): Promise<Program[]> {
  return db.programs.orderBy("createdAt").toArray()
}

export async function listWorkoutTypes(programId: string): Promise<WorkoutType[]> {
  return db.workoutTypes
    .where("programId").equals(programId)
    .sortBy("order")
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
  }
  await db.workoutTypes.add(wt)
  return wt
}

export async function renameWorkoutType(id: string, name: string): Promise<void> {
  await db.workoutTypes.update(id, { name })
}

export async function deleteWorkoutType(id: string): Promise<void> {
  await db.transaction("rw", db.workoutTypes, db.exercises, async () => {
    await db.exercises.where("workoutTypeId").equals(id).delete()
    await db.workoutTypes.delete(id)
  })
}
