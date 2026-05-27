import Dexie, { type Table } from "dexie"
import type {
  Program,
  WorkoutType,
  ScheduleEntry,
  ExerciseTemplate,
  WorkoutSession,
  LoggedSet,
  SyncQueueEntry,
} from "./schema"

export class GymDB extends Dexie {
  programs!: Table<Program, string>
  workoutTypes!: Table<WorkoutType, string>
  schedule!: Table<ScheduleEntry, number>
  exercises!: Table<ExerciseTemplate, string>
  sessions!: Table<WorkoutSession, string>
  loggedSets!: Table<LoggedSet, string>
  syncQueue!: Table<SyncQueueEntry, string>

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
    this.version(3)
      .stores({
        programs: "id, name, createdAt, updatedAt",
        workoutTypes: "id, programId, order, updatedAt",
        schedule: "dayOfWeek, workoutTypeId, updatedAt",
        exercises: "id, workoutTypeId, order, updatedAt",
        sessions: "id, date, workoutTypeId, updatedAt",
        loggedSets: "id, sessionId, exerciseName, loggedAt, updatedAt",
        syncQueue: "id, createdAt, syncedAt",
      })
      .upgrade(async (tx) => {
        const now = Date.now()
        const stamp = async (name: string) => {
          const tbl = tx.table(name)
          await tbl.toCollection().modify((row: { updatedAt?: number }) => {
            if (row.updatedAt == null) row.updatedAt = now
          })
        }
        await Promise.all([
          stamp("programs"),
          stamp("workoutTypes"),
          stamp("schedule"),
          stamp("exercises"),
          stamp("sessions"),
          stamp("loggedSets"),
        ])
      })
  }
}

export const db = new GymDB()
