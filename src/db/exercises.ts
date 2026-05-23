import { db } from "./client"
import type { ExerciseTemplate } from "./schema"
import { uid } from "@/lib/id"

export async function listExercises(workoutTypeId: string): Promise<ExerciseTemplate[]> {
  return db.exercises
    .where("workoutTypeId").equals(workoutTypeId)
    .sortBy("order")
}

export async function addExercise(
  workoutTypeId: string,
  name: string,
  targetSets: number,
): Promise<ExerciseTemplate> {
  const existing = await listExercises(workoutTypeId)
  const ex: ExerciseTemplate = {
    id: uid(),
    workoutTypeId,
    name,
    targetSets,
    order: existing.length,
  }
  await db.exercises.add(ex)
  return ex
}

export async function updateExercise(
  id: string,
  patch: Partial<Pick<ExerciseTemplate, "name" | "targetSets">>,
): Promise<void> {
  await db.exercises.update(id, patch)
}

export async function reorderExercises(
  _workoutTypeId: string,
  orderedIds: string[],
): Promise<void> {
  await db.transaction("rw", db.exercises, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.exercises.update(orderedIds[i], { order: i })
    }
  })
}

export async function deleteExercise(id: string): Promise<void> {
  await db.exercises.delete(id)
}
