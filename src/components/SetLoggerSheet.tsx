import { useEffect, useState } from "react"
import { motion, AnimatePresence, useDragControls } from "framer-motion"
import { X, Check, Plus, Minus } from "lucide-react"
import {
  getSessionSetsForExercise,
  getLastSetsForExercise,
  logSet,
  deleteSet,
} from "@/db/sessions"
import type { ExerciseTemplate, LoggedSet } from "@/db/schema"
import { formatWeight, formatLastSession } from "@/lib/format"
import { cn } from "@/lib/utils"
import { WheelPicker } from "./WheelPicker"

const WEIGHT_VALUES = Array.from({ length: 401 }, (_, i) => Math.round(i * 5) / 10)

function snapWeight(v: number): number {
  return Math.round(v * 2) / 2
}

export function SetLoggerSheet({
  exercise,
  sessionId,
  onClose,
}: {
  exercise: ExerciseTemplate
  sessionId: string
  onClose: () => void
}) {
  const [lastSets, setLastSets] = useState<LoggedSet[]>([])
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([])
  const [weight, setWeight] = useState(0)
  const [reps, setReps] = useState("")
  const [flashId, setFlashId] = useState<string | null>(null)
  const [seeded, setSeeded] = useState(false)

  async function refresh() {
    const last = await getLastSetsForExercise(exercise.name, sessionId)
    const logged = await getSessionSetsForExercise(sessionId, exercise.name)
    setLastSets(last)
    setLoggedSets(logged)

    if (!seeded) {
      const seed = logged[logged.length - 1] ?? last[last.length - 1]
      if (seed) {
        setWeight(snapWeight(seed.weight))
        setReps(String(seed.reps))
      } else if (exercise.targetWeight) {
        setWeight(snapWeight(exercise.targetWeight))
      }
      setSeeded(true)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  function bumpReps(delta: number) {
    const current = parseInt(reps, 10) || 0
    const next = Math.max(0, current + delta)
    setReps(String(next))
  }

  async function handleAdd() {
    const w = weight
    const r = parseInt(reps, 10)
    if (!w || !r) return
    const set = await logSet(
      sessionId,
      exercise.name,
      w,
      r,
      loggedSets.length + 1,
    )
    setFlashId(set.id)
    setTimeout(() => setFlashId(null), 500)
    await refresh()
  }

  async function handleRemove(id: string) {
    await deleteSet(id)
    await refresh()
  }

  const progressCount = loggedSets.length
  const dragControls = useDragControls()

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

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
        <div
          className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none shrink-0"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-5 space-y-5 overflow-y-auto flex-1" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <p className="font-display text-[10px] uppercase tracking-[0.2em] text-accent">
                Підхід {progressCount + 1}
                <span className="text-text-secondary">
                  {" "}/ {exercise.targetSets}
                </span>
              </p>
              <h2 className="font-display text-[22px] leading-tight text-text-primary tracking-tight">
                {exercise.name}
              </h2>
              <p className="text-text-secondary text-[12px] font-sans">
                Минулого разу:{" "}
                <span className="font-display text-text-primary">
                  {formatLastSession(lastSets)}
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-text-secondary p-2 -mr-2 hover:text-text-primary shrink-0"
              aria-label="Закрити"
            >
              <X size={22} />
            </button>
          </div>

          <div className="space-y-3">
            {/* Weight drum picker */}
            <div className="bg-bg border border-border rounded-xl overflow-hidden">
              <p className="font-display text-[10px] uppercase tracking-[0.2em] text-text-secondary text-center pt-3 pb-1">
                КГ
              </p>
              <WheelPicker
                values={WEIGHT_VALUES}
                value={weight}
                onChange={setWeight}
                formatValue={(v) => (v === Math.floor(v) ? String(v) : v.toFixed(1))}
              />
            </div>
            {/* Reps with +/- */}
            <NumberField
              label="ПОВТОРИ"
              value={reps}
              onChange={setReps}
              onIncrement={() => bumpReps(1)}
              onDecrement={() => bumpReps(-1)}
              inputMode="numeric"
              step="1"
            />
          </div>

          <button
            onClick={handleAdd}
            className="w-full bg-accent text-bg hover:bg-accent/90 active:scale-[0.98] transition-transform h-14 rounded-xl font-medium text-[15px] flex items-center justify-center gap-2"
          >
            <Plus size={20} strokeWidth={2.5} />
            Зафіксувати підхід
          </button>

          {loggedSets.length > 0 && (
            <div className="space-y-1.5">
              <p className="font-display text-[10px] uppercase tracking-[0.2em] text-text-secondary px-1">
                Підходи цієї сесії
              </p>
              <ul className="rounded-xl border border-border bg-bg divide-y divide-border overflow-hidden">
                {loggedSets.map((s, i) => (
                  <motion.li
                    key={s.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3",
                      flashId === s.id && "bg-accent-muted",
                    )}
                    animate={
                      flashId === s.id
                        ? {
                            backgroundColor: [
                              "rgba(245,166,35,0.28)",
                              "rgba(245,166,35,0)",
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 0.5 }}
                  >
                    <Check size={14} className="text-success" />
                    <span className="font-display text-[11px] uppercase tracking-wider text-text-secondary w-16">
                      Підхід {i + 1}
                    </span>
                    <span className="font-display text-text-primary flex-1 text-[15px]">
                      {formatWeight(s.weight)}
                      <span className="text-text-secondary text-[12px] mx-1">кг</span>
                      ×<span className="ml-1">{s.reps}</span>
                    </span>
                    <button
                      onClick={() => handleRemove(s.id)}
                      className="text-text-secondary hover:text-destructive text-xs px-2 py-1"
                      aria-label="Видалити підхід"
                    >
                      <X size={14} />
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function NumberField({
  label,
  value,
  onChange,
  onIncrement,
  onDecrement,
  inputMode,
  step,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onIncrement: () => void
  onDecrement: () => void
  inputMode: "numeric" | "decimal"
  step: string
}) {
  return (
    <div className="bg-bg border border-border rounded-xl p-3 space-y-2">
      <p className="font-display text-[10px] uppercase tracking-[0.2em] text-text-secondary text-center">
        {label}
      </p>
      <input
        type="number"
        inputMode={inputMode}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="w-full bg-transparent text-center font-display text-[42px] leading-none focus:outline-none text-text-primary placeholder:text-border"
      />
      <div className="flex gap-1.5">
        <button
          onClick={onDecrement}
          className="flex-1 h-9 rounded-lg border border-border text-text-secondary active:bg-surface flex items-center justify-center"
          aria-label="Зменшити"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={onIncrement}
          className="flex-1 h-9 rounded-lg border border-border text-text-secondary active:bg-surface flex items-center justify-center"
          aria-label="Збільшити"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
