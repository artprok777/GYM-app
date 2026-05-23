import { describe, it, expect } from "vitest"
import { formatWeight, formatLastSession, ukDayName } from "@/lib/format"
import type { LoggedSet } from "@/db/schema"

describe("formatWeight", () => {
  it("strips trailing zeros", () => {
    expect(formatWeight(80)).toBe("80")
    expect(formatWeight(82.5)).toBe("82.5")
    expect(formatWeight(82.0)).toBe("82")
  })
})

describe("formatLastSession", () => {
  const makeSet = (w: number, r: number, n: number): LoggedSet => ({
    id: String(n),
    sessionId: "s",
    exerciseName: "x",
    weight: w,
    reps: r,
    setNumber: n,
    loggedAt: 0,
  })

  it("returns empty marker when no sets", () => {
    expect(formatLastSession([])).toBe("—")
  })

  it("compacts identical sets", () => {
    const sets = [makeSet(80, 5, 1), makeSet(80, 5, 2), makeSet(80, 5, 3)]
    expect(formatLastSession(sets)).toBe("80 кг × 5 × 3")
  })

  it("lists varied sets", () => {
    const sets = [makeSet(80, 5, 1), makeSet(80, 4, 2), makeSet(75, 5, 3)]
    expect(formatLastSession(sets)).toBe("80×5, 80×4, 75×5 кг")
  })
})

describe("ukDayName", () => {
  it("returns Ukrainian day names", () => {
    expect(ukDayName(0)).toBe("Неділя")
    expect(ukDayName(1)).toBe("Понеділок")
    expect(ukDayName(6)).toBe("Субота")
  })
})
