interface Syncable {
  updatedAt: number
  deletedAt?: number
}

export interface Program extends Syncable {
  id: string
  name: string
  createdAt: number
}

export interface WorkoutType extends Syncable {
  id: string
  programId: string
  name: string
  order: number
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = Sunday

export interface ScheduleEntry extends Syncable {
  dayOfWeek: DayOfWeek
  workoutTypeId: string | null
}

export interface ExerciseTemplate extends Syncable {
  id: string
  workoutTypeId: string
  name: string
  targetSets: number
  targetReps?: number
  targetWeight?: number
  order: number
}

export interface WorkoutSession extends Syncable {
  id: string
  date: number // start of day, unix ms
  workoutTypeId: string
  notes?: string
}

export interface LoggedSet extends Syncable {
  id: string
  sessionId: string
  exerciseName: string // denormalized so history survives renames
  weight: number
  reps: number
  setNumber: number
  loggedAt: number
}

export type SyncTable =
  | "programs"
  | "workoutTypes"
  | "schedule"
  | "exercises"
  | "sessions"
  | "loggedSets"

export interface SyncQueueEntry {
  id: string
  op: "upsert" | "delete"
  table: SyncTable
  recordId: string // for schedule it's the dayOfWeek as string
  payload: unknown
  createdAt: number
  syncedAt?: number
  attempts: number
  lastError?: string
}
