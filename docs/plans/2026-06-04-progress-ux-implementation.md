# Progress UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the Progress screen clarity for exercise and workout analytics while keeping `Загалом`.

**Architecture:** Keep the existing three-tab `ProgressScreen` structure. Add small derived progress helpers in `src/db/progress.ts` so UI summaries are testable, then update `ProgressByExercise` and `ProgressByWorkout` to use those helpers and clearer labels.

**Tech Stack:** React, TypeScript, Dexie, Tailwind CSS, Recharts, Vitest.

---

### Task 1: Add Progress Summary Helpers

**Files:**
- Modify: `src/db/progress.ts`
- Test: `src/tests/db/progress.test.ts`

**Step 1: Write failing tests**

Add tests for:
- exercise summary returns latest weight, previous weight, delta kg, delta percent, PR, and total load for the selected history range.
- workout summary returns session count, progress exercise count, biggest gain, and date spans per row.

**Step 2: Verify tests fail**

Run: `npm test -- --run src/tests/db/progress.test.ts`
Expected: FAIL because the new helper exports do not exist.

**Step 3: Implement helpers**

Add pure exported helpers that derive summaries from existing `ExerciseHistoryPoint[]` and `WorkoutExerciseProgress[]`, plus date/session counts already available to the caller.

**Step 4: Verify tests pass**

Run: `npm test -- --run src/tests/db/progress.test.ts`
Expected: PASS.

### Task 2: Update Progress UI

**Files:**
- Modify: `src/screens/ProgressScreen.tsx`
- Modify: `src/screens/ProgressByExercise.tsx`
- Modify: `src/screens/ProgressByWorkout.tsx`

**Steps:**
- Raise tab and dropdown trigger heights to at least 52px.
- In `ProgressByExercise`, add summary metrics above charts.
- Rename `Об'єм` to `Навантаження` and add helper copy `вага × повтори`.
- In `ProgressByWorkout`, replace first/latest-only row copy with kg delta, percent delta, and first/latest dates.
- Remove `SessionCalendar` and all square calendar rendering.
- Add workout-level summary metrics.

### Task 3: Verify

**Commands:**
- `npx tsc -b`
- `npm test -- --run`

Expected: both pass.
