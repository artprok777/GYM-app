import { db } from "./client"
import type { ExerciseTemplate } from "./schema"
import { uid } from "@/lib/id"
import { enqueue } from "./sync"

export async function listExercises(workoutTypeId: string): Promise<ExerciseTemplate[]> {
  const rows = await db.exercises
    .where("workoutTypeId")
    .equals(workoutTypeId)
    .sortBy("order")
  return rows.filter((e) => e.deletedAt == null)
}

export async function addExercise(
  workoutTypeId: string,
  name: string,
  targetSets: number,
  targetWeight?: number,
  targetReps?: number,
): Promise<ExerciseTemplate> {
  const existing = await listExercises(workoutTypeId)
  const ex: ExerciseTemplate = {
    id: uid(),
    workoutTypeId,
    name,
    targetSets,
    ...(targetReps != null && { targetReps }),
    ...(targetWeight != null && { targetWeight }),
    order: existing.length,
    updatedAt: Date.now(),
  }
  await db.exercises.add(ex)
  await enqueue("upsert", "exercises", ex.id, ex)
  return ex
}

export async function updateExercise(
  id: string,
  patch: Partial<
    Pick<ExerciseTemplate, "name" | "targetSets" | "targetReps" | "targetWeight">
  >,
): Promise<void> {
  const existing = await db.exercises.get(id)
  await db.exercises.update(id, { ...patch, updatedAt: Date.now() })
  const row = await db.exercises.get(id)
  if (row) await enqueue("upsert", "exercises", id, row)

  if (patch.name && existing && patch.name !== existing.name) {
    const now = Date.now()
    const affected = await db.loggedSets
      .where("exerciseName")
      .equals(existing.name)
      .toArray()
    for (const set of affected) {
      await db.loggedSets.update(set.id, { exerciseName: patch.name, updatedAt: now })
      await enqueue("upsert", "loggedSets", set.id, { ...set, exerciseName: patch.name, updatedAt: now })
    }
  }
}

export async function reorderExercises(
  _workoutTypeId: string,
  orderedIds: string[],
): Promise<void> {
  const now = Date.now()
  await db.transaction("rw", db.exercises, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.exercises.update(orderedIds[i], { order: i, updatedAt: now })
    }
  })
  for (const id of orderedIds) {
    const row = await db.exercises.get(id)
    if (row) await enqueue("upsert", "exercises", id, row)
  }
}

export async function deleteExercise(id: string): Promise<void> {
  const now = Date.now()
  await db.exercises.update(id, { deletedAt: now, updatedAt: now })
  await enqueue("delete", "exercises", id, null)
}
