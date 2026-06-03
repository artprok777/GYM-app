import { useState, useEffect } from "react"
import { motion, AnimatePresence, useDragControls } from "framer-motion"
import { Check, Minus } from "lucide-react"
import { db } from "@/db/client"
import { getSchedule } from "@/db/schedule"
import { listExercises } from "@/db/exercises"
import { getSessionSets } from "@/db/sessions"
import { listPrograms, listWorkoutTypes } from "@/db/programs"
import type { ExerciseTemplate } from "@/db/schema"
import { ukDayName } from "@/lib/format"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"

const UK_MONTHS = ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"]

function formatDayHeader(date: number): string {
  const d = new Date(date)
  return `${d.getDate()} ${UK_MONTHS[d.getMonth()]}. ${d.getFullYear()} р., ${ukDayName(d.getDay())}`
}

interface ExerciseRow {
  exercise: ExerciseTemplate
  logged: number
}

type SheetState = "loading" | "rest" | "ready"

interface DayData {
  workoutName?: string
  totalSets: number
  exerciseCount: number
  completedExercises: number
  rows: ExerciseRow[]
}

function statusLabel(data: DayData): string {
  if (data.completedExercises === data.exerciseCount && data.exerciseCount > 0) return "Виконано"
  if (data.totalSets === 0) return "Пропущено"
  return `${data.completedExercises} / ${data.exerciseCount} вправ`
}

export function DaySheet({ date, onClose }: { date: number; onClose: () => void }) {
  const [sheetState, setSheetState] = useState<SheetState>("loading")
  const [data, setData] = useState<DayData | null>(null)
  const dragControls = useDragControls()
  useBodyScrollLock()

  useEffect(() => {
    let cancelled = false
    async function load() {
      const dayOfWeek = new Date(date).getDay()
      const schedule = await getSchedule()
      const workoutTypeId = schedule.find(e => e.dayOfWeek === dayOfWeek)?.workoutTypeId ?? null

      if (!workoutTypeId) {
        if (!cancelled) setSheetState("rest")
        return
      }

      const programs = await listPrograms()
      let workoutName: string | undefined
      if (programs[0]) {
        const types = await listWorkoutTypes(programs[0].id)
        workoutName = types.find(t => t.id === workoutTypeId)?.name
      }

      const exercises = await listExercises(workoutTypeId)
      const session = await db.sessions
        .where("date")
        .equals(date)
        .and(s => s.workoutTypeId === workoutTypeId && s.deletedAt == null)
        .first()

      const allSets = session ? await getSessionSets(session.id) : []
      const totalSets = allSets.length

      let completedExercises = 0
      const rows: ExerciseRow[] = exercises.map(ex => {
        const logged = allSets.filter(s => s.exerciseName === ex.name).length
        if (logged >= ex.targetSets) completedExercises++
        return { exercise: ex, logged }
      })

      if (!cancelled) {
        setData({ workoutName, totalSets, exerciseCount: exercises.length, completedExercises, rows })
        setSheetState("ready")
      }
    }
    void load()
    return () => { cancelled = true }
  }, [date])

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        key="sheet"
        className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-50 border-t border-border flex flex-col"
        style={{ maxHeight: "calc(100dvh - env(safe-area-inset-top) - 8px)" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 380 }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 0.4 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 80 || info.velocity.y > 500) onClose()
        }}
      >
        {/* drag handle */}
        <div
          className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none shrink-0"
          onPointerDown={e => dragControls.start(e)}
        >
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div
          className="px-5 overflow-y-auto flex-1 space-y-4"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
        >
          {/* header */}
          <div className="space-y-0.5 pt-1">
            <p className="font-display text-[10px] uppercase tracking-[0.2em] text-text-secondary">
              {formatDayHeader(date)}
            </p>
            {sheetState === "ready" && data && (
              <p className={`font-display text-[20px] leading-tight tracking-tight ${
                data.completedExercises === data.exerciseCount && data.exerciseCount > 0
                  ? "text-success"
                  : data.totalSets === 0
                    ? "text-text-secondary"
                    : "text-accent"
              }`}>
                {statusLabel(data)}
              </p>
            )}
          </div>

          {sheetState === "loading" && (
            <div className="py-8 text-center text-text-secondary font-display text-[12px] uppercase tracking-wider">
              Завантаження…
            </div>
          )}

          {sheetState === "rest" && (
            <div className="py-8 text-center space-y-1">
              <p className="font-display text-[13px] text-text-secondary uppercase tracking-wider">Відпочинок</p>
              <p className="text-text-secondary text-[12px]">Цей день не запланований</p>
            </div>
          )}

          {sheetState === "ready" && data && (
            <div className="space-y-1">
              {data.rows.length === 0 ? (
                <p className="text-text-secondary text-[13px] text-center py-4">Вправ не знайдено</p>
              ) : (
                <ul className="rounded-xl border border-border bg-bg divide-y divide-border overflow-hidden">
                  {data.rows.map(({ exercise, logged }) => {
                    const done = logged >= exercise.targetSets
                    const inProgress = logged > 0 && !done
                    return (
                      <li key={exercise.id} className="px-4 py-3 flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          done
                            ? "bg-success/15 border border-success/50"
                            : inProgress
                              ? "bg-accent/15 border border-accent/40"
                              : "bg-transparent border border-border"
                        }`}>
                          {done ? (
                            <Check size={11} className="text-success" strokeWidth={2.5} />
                          ) : inProgress ? (
                            <Minus size={11} className="text-accent" strokeWidth={2.5} />
                          ) : null}
                        </div>
                        <span className="font-display text-[14px] text-text-primary flex-1 leading-snug">
                          {exercise.name}
                        </span>
                        <span className="font-display text-[12px] tabular-nums text-text-secondary shrink-0">
                          <span className={done ? "text-success" : inProgress ? "text-accent" : "text-text-secondary"}>
                            {logged}
                          </span>
                          <span className="text-text-secondary">/{exercise.targetSets}</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
