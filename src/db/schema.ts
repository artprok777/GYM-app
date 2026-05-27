export interface Program {
  id: string
  name: string
  createdAt: number
}

export interface WorkoutType {
  id: string
  programId: string
  name: string
  order: number
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = Sunday

export interface ScheduleEntry {
  dayOfWeek: DayOfWeek
  workoutTypeId: string | null
}

export interface ExerciseTemplate {
  id: string
  workoutTypeId: string
  name: string
  targetSets: number
  targetReps?: number
  targetWeight?: number
  order: number
}

export interface WorkoutSession {
  id: string
  date: number // start of day, unix ms
  workoutTypeId: string
  notes?: string
}

export interface LoggedSet {
  id: string
  sessionId: string
  exerciseName: string // denormalized so history survives renames
  weight: number
  reps: number
  setNumber: number
  loggedAt: number
}
