import { describe, it, expect } from "vitest"
import {
  formatWeight,
  formatLastSession,
  ukDayName,
  groupSets,
  pluralPidh,
  formatSessionDate,
} from "@/lib/format"
import type { LoggedSet } from "@/db/schema"

describe("formatWeight", () => {
  it("strips trailing zeros", () => {
    expect(formatWeight(80)).toBe("80")
    expect(formatWeight(82.5)).toBe("82,5")
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
    updatedAt: 0,
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

describe("groupSets", () => {
  const makeSet = (w: number, r: number, n: number): LoggedSet => ({
    id: String(n),
    sessionId: "s",
    exerciseName: "x",
    weight: w,
    reps: r,
    setNumber: n,
    loggedAt: 0,
    updatedAt: 0,
  })

  it("groups consecutive identical sets", () => {
    const sets = [
      makeSet(25, 12, 1),
      makeSet(30, 12, 2),
      makeSet(30, 12, 3),
      makeSet(30, 12, 4),
    ]
    expect(groupSets(sets)).toEqual([
      { count: 1, weight: 25, reps: 12 },
      { count: 3, weight: 30, reps: 12 },
    ])
  })

  it("does not merge non-consecutive groups", () => {
    const sets = [makeSet(30, 10, 1), makeSet(35, 10, 2), makeSet(30, 10, 3)]
    expect(groupSets(sets)).toHaveLength(3)
  })

  it("separates by reps even at same weight", () => {
    const sets = [makeSet(30, 12, 1), makeSet(30, 10, 2)]
    const groups = groupSets(sets)
    expect(groups).toHaveLength(2)
    expect(groups[0].reps).toBe(12)
    expect(groups[1].reps).toBe(10)
  })
})

describe("pluralPidh", () => {
  it("returns the right Ukrainian plural form", () => {
    expect(pluralPidh(1)).toBe("підхід")
    expect(pluralPidh(2)).toBe("підходи")
    expect(pluralPidh(4)).toBe("підходи")
    expect(pluralPidh(5)).toBe("підходів")
    expect(pluralPidh(11)).toBe("підходів")
    expect(pluralPidh(21)).toBe("підхід")
    expect(pluralPidh(22)).toBe("підходи")
  })
})

describe("formatSessionDate", () => {
  it("labels latest session", () => {
    expect(formatSessionDate(Date.now(), true)).toBe("Попереднє тренування")
  })

  it("formats other sessions as dates", () => {
    const out = formatSessionDate(new Date("2026-04-15").getTime(), false)
    expect(out).toMatch(/2026/)
  })
})
