import { describe, it, expect, beforeEach } from "vitest"
import { db } from "@/db/client"
import { createProgram, addWorkoutType } from "@/db/programs"
import { addExercise } from "@/db/exercises"
import { setScheduleEntry } from "@/db/schedule"
import { logSet } from "@/db/sessions"
import { uid } from "@/lib/id"
import { getCurrentStreak, getWeekCompletions, mondayOf } from "@/db/progress"
import type { DayOfWeek } from "@/db/schema"

const DAY_MS = 86_400_000

function startOfDayAt(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function dowOf(ts: number): DayOfWeek {
  return new Date(ts).getDay() as DayOfWeek
}

async function seedSession(workoutTypeId: string, date: number, exerciseName: string, targetSets: number) {
  const session = { id: uid(), date, workoutTypeId, updatedAt: Date.now() }
  await db.sessions.add(session)
  for (let i = 1; i <= targetSets; i++) {
    await logSet(session.id, exerciseName, 80, 5, i)
  }
  return session
}

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe("getCurrentStreak", () => {
  it("returns 0 for empty db", async () => {
    expect(await getCurrentStreak()).toBe(0)
  })

  it("returns 1 when today is done", async () => {
    const prog = await createProgram("P")
    const wt = await addWorkoutType(prog.id, "A")
    await addExercise(wt.id, "Squat", 3)

    const today = startOfDayAt(Date.now())
    await setScheduleEntry(dowOf(today), wt.id)
    await seedSession(wt.id, today, "Squat", 3)

    expect(await getCurrentStreak()).toBe(1)
  })

  it("returns 3 for 3 consecutive done days", async () => {
    const prog = await createProgram("P")
    const wt = await addWorkoutType(prog.id, "A")
    await addExercise(wt.id, "Squat", 2)

    const today = startOfDayAt(Date.now())
    const d1 = today - 2 * DAY_MS
    const d2 = today - DAY_MS

    await setScheduleEntry(dowOf(d1), wt.id)
    await setScheduleEntry(dowOf(d2), wt.id)
    await setScheduleEntry(dowOf(today), wt.id)

    await seedSession(wt.id, d1, "Squat", 2)
    await seedSession(wt.id, d2, "Squat", 2)
    await seedSession(wt.id, today, "Squat", 2)

    expect(await getCurrentStreak()).toBe(3)
  })

  it("breaks streak on partial past day", async () => {
    const prog = await createProgram("P")
    const wt = await addWorkoutType(prog.id, "A")
    await addExercise(wt.id, "Squat", 3)

    const today = startOfDayAt(Date.now())
    const yesterday = today - DAY_MS
    const dayBefore = today - 2 * DAY_MS

    await setScheduleEntry(dowOf(dayBefore), wt.id)
    await setScheduleEntry(dowOf(yesterday), wt.id)
    await setScheduleEntry(dowOf(today), wt.id)

    // dayBefore: only 1 of 3 sets (partial → treated as missed)
    const partialSession = { id: uid(), date: dayBefore, workoutTypeId: wt.id, updatedAt: Date.now() }
    await db.sessions.add(partialSession)
    await logSet(partialSession.id, "Squat", 80, 5, 1)

    await seedSession(wt.id, yesterday, "Squat", 3)
    await seedSession(wt.id, today, "Squat", 3)

    // streak: today(+1), yesterday(+1), dayBefore(partial=break) → 2
    expect(await getCurrentStreak()).toBe(2)
  })

  it("skips rest days and does not break streak", async () => {
    const prog = await createProgram("P")
    const wt = await addWorkoutType(prog.id, "A")
    await addExercise(wt.id, "Squat", 2)

    const today = startOfDayAt(Date.now())
    const yesterday = today - DAY_MS
    const dayBefore = today - 2 * DAY_MS

    // dayBefore: done, yesterday: REST (no schedule entry), today: done
    await setScheduleEntry(dowOf(dayBefore), wt.id)
    await setScheduleEntry(dowOf(yesterday), null) // rest
    await setScheduleEntry(dowOf(today), wt.id)

    await seedSession(wt.id, dayBefore, "Squat", 2)
    await seedSession(wt.id, today, "Squat", 2)

    expect(await getCurrentStreak()).toBe(2)
  })

  it("returns 0 when today has only partial sets", async () => {
    const prog = await createProgram("P")
    const wt = await addWorkoutType(prog.id, "A")
    await addExercise(wt.id, "Squat", 3)

    const today = startOfDayAt(Date.now())
    await setScheduleEntry(dowOf(today), wt.id)

    const session = { id: uid(), date: today, workoutTypeId: wt.id, updatedAt: Date.now() }
    await db.sessions.add(session)
    await logSet(session.id, "Squat", 80, 5, 1) // only 1 of 3

    expect(await getCurrentStreak()).toBe(0)
  })

  it("returns 0 when yesterday is missed and today not started", async () => {
    const prog = await createProgram("P")
    const wt = await addWorkoutType(prog.id, "A")
    await addExercise(wt.id, "Squat", 2)

    const today = startOfDayAt(Date.now())
    const yesterday = today - DAY_MS

    await setScheduleEntry(dowOf(yesterday), wt.id)
    await setScheduleEntry(dowOf(today), wt.id)
    // no session for either day

    expect(await getCurrentStreak()).toBe(0)
  })
})

describe("getWeekCompletions", () => {
  it("returns correct states for last week: done/rest/missed", async () => {
    const prog = await createProgram("P")
    const wt = await addWorkoutType(prog.id, "A")
    await addExercise(wt.id, "Bench", 2)

    const today = startOfDayAt(Date.now())
    // Use last week so all 7 days are guaranteed to be in the past
    const weekStart = mondayOf(today) - 7 * DAY_MS

    // Mon(0), Tue(1), Wed(2): workout + done
    // Thu(3), Fri(4): rest
    // Sat(5), Sun(6): workout but no session → missed
    for (let i = 0; i < 7; i++) {
      const dayDate = weekStart + i * DAY_MS
      const dow = dowOf(dayDate) as DayOfWeek
      if (i < 3) {
        await setScheduleEntry(dow, wt.id)
        await seedSession(wt.id, dayDate, "Bench", 2)
      } else if (i < 5) {
        await setScheduleEntry(dow, null) // rest
      } else {
        await setScheduleEntry(dow, wt.id)
        // no session → missed
      }
    }

    const completions = await getWeekCompletions(weekStart)
    expect(completions).toHaveLength(7)
    completions.forEach((c, i) => {
      expect(c.date).toBe(weekStart + i * DAY_MS)
    })

    expect(completions[0].state).toBe("done")
    expect(completions[1].state).toBe("done")
    expect(completions[2].state).toBe("done")
    expect(completions[3].state).toBe("rest")
    expect(completions[4].state).toBe("rest")
    expect(completions[5].state).toBe("missed")
    expect(completions[6].state).toBe("missed")
  })

  it("marks past day with partial sets as partial", async () => {
    const prog = await createProgram("P")
    const wt = await addWorkoutType(prog.id, "A")
    await addExercise(wt.id, "Deadlift", 4)

    const today = startOfDayAt(Date.now())
    const weekStart = mondayOf(today)
    const targetDay = weekStart // Monday

    if (targetDay >= today) {
      // If today is Monday, skip this test scenario
      return
    }

    await setScheduleEntry(dowOf(targetDay) as DayOfWeek, wt.id)

    // log only 2 of 4 sets
    const session = { id: uid(), date: targetDay, workoutTypeId: wt.id, updatedAt: Date.now() }
    await db.sessions.add(session)
    await logSet(session.id, "Deadlift", 100, 5, 1)
    await logSet(session.id, "Deadlift", 100, 5, 2)

    const completions = await getWeekCompletions(weekStart)
    const monday = completions[0]
    expect(monday.state).toBe("partial")
  })
})
