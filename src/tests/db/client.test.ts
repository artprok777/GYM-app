import { describe, it, expect, beforeEach } from "vitest"
import { db } from "@/db/client"

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe("GymDB schema", () => {
  it("opens with all six tables defined", () => {
    expect(db.programs).toBeDefined()
    expect(db.workoutTypes).toBeDefined()
    expect(db.schedule).toBeDefined()
    expect(db.exercises).toBeDefined()
    expect(db.sessions).toBeDefined()
    expect(db.loggedSets).toBeDefined()
  })

  it("starts empty after a fresh open", async () => {
    expect(await db.programs.count()).toBe(0)
    expect(await db.loggedSets.count()).toBe(0)
  })
})
