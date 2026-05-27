import Dexie, { type Table } from "dexie"
import type {
  Program,
  WorkoutType,
  ScheduleEntry,
  ExerciseTemplate,
  WorkoutSession,
  LoggedSet,
} from "./schema"

export class GymDB extends Dexie {
  programs!: Table<Program, string>
  workoutTypes!: Table<WorkoutType, string>
  schedule!: Table<ScheduleEntry, number>
  exercises!: Table<ExerciseTemplate, string>
  sessions!: Table<WorkoutSession, string>
  loggedSets!: Table<LoggedSet, string>

  constructor() {
    super("gym-tracker")
    this.version(1).stores({
      programs: "id, name, createdAt",
      workoutTypes: "id, programId, order",
      schedule: "dayOfWeek, workoutTypeId",
      exercises: "id, workoutTypeId, order",
      sessions: "id, date, workoutTypeId",
      loggedSets: "id, sessionId, exerciseName, loggedAt",
    })
    this.version(2).stores({
      programs: "id, name, createdAt",
      workoutTypes: "id, programId, order",
      schedule: "dayOfWeek, workoutTypeId",
      exercises: "id, workoutTypeId, order",
      sessions: "id, date, workoutTypeId",
      loggedSets: "id, sessionId, exerciseName, loggedAt",
    })
  }
}

export const db = new GymDB()
