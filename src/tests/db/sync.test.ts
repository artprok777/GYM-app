import { beforeEach, describe, expect, it, vi } from "vitest"
import { db } from "@/db/client"

const supabaseMock = vi.hoisted(() => ({
  responses: new Map<string, { data: unknown[] | null; error: Error | null }>(),
}))

vi.mock("@/db/supabase", () => ({
  USER_ID: "user-1",
  cloudEnabled: true,
  supabase: {
    from(table: string) {
      return {
        select() {
          return this
        },
        eq() {
          return this
        },
        gt() {
          return Promise.resolve(
            supabaseMock.responses.get(table) ?? { data: [], error: null },
          )
        },
      }
    },
  },
}))

describe("sync pull", () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    localStorage.clear()
    supabaseMock.responses.clear()
  })

  it("does not advance last pulled timestamp when any remote table fails", async () => {
    const { pullChanges } = await import("@/db/sync")
    const since = "2026-01-01T00:00:00.000Z"
    localStorage.setItem("gym-tracker:last_pulled_at", since)
    supabaseMock.responses.set("workout_types", {
      data: null,
      error: new Error("remote unavailable"),
    })

    await pullChanges()

    expect(localStorage.getItem("gym-tracker:last_pulled_at")).toBe(since)
  })
})
