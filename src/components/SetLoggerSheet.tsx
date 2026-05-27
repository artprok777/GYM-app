import { useState, useEffect } from "react"
import { motion, AnimatePresence, useDragControls } from "framer-motion"
import { X, Check, Plus, Minus, Pencil } from "lucide-react"
import {
  getSessionSetsForExercise,
  getLastSetsForExercise,
  logSet,
  deleteSet,
  updateSet,
} from "@/db/sessions"
import type { ExerciseTemplate, LoggedSet } from "@/db/schema"
import { formatWeight, formatLastSession } from "@/lib/format"
import { cn } from "@/lib/utils"
import { WheelPicker } from "./WheelPicker"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"

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
  const [setsCount, setSetsCount] = useState(1)
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set())
  const [seeded, setSeeded] = useState(false)
  const [editingSetId, setEditingSetId] = useState<string | null>(null)
  const [editWeight, setEditWeight] = useState("")
  const [editReps, setEditReps] = useState("")
  const [sessionTargetReps, setSessionTargetReps] = useState<number | null>(
    exercise.targetReps ?? null,
  )
  const [editingTargetReps, setEditingTargetReps] = useState(false)
  const [draftTargetReps, setDraftTargetReps] = useState("")

  async function refresh() {
    const last = await getLastSetsForExercise(exercise.name, sessionId)
    const logged = await getSessionSetsForExercise(sessionId, exercise.name)
    setLastSets(last)
    setLoggedSets(logged)

    if (!seeded) {
      const seed = logged[logged.length - 1] ?? last[last.length - 1]
      if (seed) {
        setWeight(snapWeight(seed.weight))
      } else if (exercise.targetWeight) {
        setWeight(snapWeight(exercise.targetWeight))
      }
      setSeeded(true)
    }
  }

  function commitTargetReps() {
    const raw = draftTargetReps.trim()
    if (raw === "") {
      setSessionTargetReps(null)
    } else {
      const n = parseInt(raw, 10)
      if (!isNaN(n) && n > 0) setSessionTargetReps(n)
    }
    setEditingTargetReps(false)
    setDraftTargetReps("")
  }

  useEffect(() => {
    refresh()
  }, [])

  function bumpSets(delta: number) {
    setSetsCount((c) => Math.max(1, c + delta))
  }

  async function handleAdd() {
    const w = weight
    const r = sessionTargetReps ?? exercise.targetReps ?? 1
    const n = Math.max(1, setsCount)
    if (!w) return
    const newIds: string[] = []
    for (let i = 0; i < n; i++) {
      const set = await logSet(
        sessionId,
        exercise.name,
        w,
        r,
        loggedSets.length + 1 + i,
      )
      newIds.push(set.id)
    }
    setFlashIds(new Set(newIds))
    setTimeout(() => setFlashIds(new Set()), 500)
    setSetsCount(1)
    await refresh()
  }

  async function handleRemove(id: string) {
    await deleteSet(id)
    await refresh()
  }

  function startEditSet(s: LoggedSet) {
    setEditingSetId(s.id)
    setEditWeight(String(s.weight))
    setEditReps(String(s.reps))
  }

  function cancelEditSet() {
    setEditingSetId(null)
    setEditWeight("")
    setEditReps("")
  }

  async function commitEditSet(id: string) {
    const w = parseFloat(editWeight.replace(",", "."))
    const r = parseInt(editReps, 10)
    if (!isNaN(w) && w >= 0 && !isNaN(r) && r > 0) {
      await updateSet(id, { weight: snapWeight(w), reps: r })
    }
    cancelEditSet()
    await refresh()
  }

  const dragControls = useDragControls()
  useBodyScrollLock()

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
                Підхід {loggedSets.length + 1}
                <span className="text-text-secondary">
                  {" "}/ {exercise.targetSets}
                </span>
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-[22px] leading-tight text-text-primary tracking-tight">
                  {exercise.name}
                </h2>
                {editingTargetReps ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      type="number"
                      inputMode="numeric"
                      step="1"
                      value={draftTargetReps}
                      onChange={(e) => setDraftTargetReps(e.target.value)}
                      onBlur={commitTargetReps}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitTargetReps()
                        if (e.key === "Escape") {
                          setEditingTargetReps(false)
                          setDraftTargetReps("")
                        }
                      }}
                      className="w-14 h-7 bg-bg border border-border rounded-md text-center font-display text-text-primary text-[13px]"
                    />
                    <span className="font-display text-[11px] uppercase tracking-wider text-text-secondary">
                      повт
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingTargetReps(true)
                      setDraftTargetReps(
                        sessionTargetReps != null ? String(sessionTargetReps) : "",
                      )
                    }}
                    className="inline-flex items-center gap-1 px-2 h-7 rounded-md border border-border bg-bg text-text-secondary hover:text-text-primary"
                    aria-label="Змінити цільові повтори"
                  >
                    <span className="font-display text-[12px] text-text-primary">
                      {sessionTargetReps != null ? sessionTargetReps : "—"}
                    </span>
                    <span className="font-display text-[10px] uppercase tracking-wider">
                      повт
                    </span>
                    <Pencil size={11} className="ml-0.5" />
                  </button>
                )}
              </div>
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
              {seeded ? (
                <WheelPicker
                  values={WEIGHT_VALUES}
                  value={weight}
                  onChange={setWeight}
                  formatValue={(v) => (v === Math.floor(v) ? String(v) : v.toFixed(1))}
                />
              ) : (
                <div style={{ height: 5 * 44 }} />
              )}
            </div>
            {/* Sets count with +/- */}
            <NumberField
              label="ПІДХОДИ"
              value={String(setsCount)}
              onChange={(v) => {
                const n = parseInt(v, 10)
                setSetsCount(isNaN(n) || n < 1 ? 1 : n)
              }}
              onIncrement={() => bumpSets(1)}
              onDecrement={() => bumpSets(-1)}
              inputMode="numeric"
              step="1"
            />
          </div>

          <button
            onClick={handleAdd}
            className="w-full bg-accent text-bg hover:bg-accent/90 active:scale-[0.98] transition-transform h-14 rounded-xl font-medium text-[15px] flex items-center justify-center gap-2"
          >
            <Plus size={20} strokeWidth={2.5} />
            {setsCount > 1
              ? `Зафіксувати ${setsCount} підходи`
              : "Зафіксувати підхід"}
          </button>

          {loggedSets.length > 0 && (
            <div className="space-y-1.5">
              <p className="font-display text-[10px] uppercase tracking-[0.2em] text-text-secondary px-1">
                Підходи цієї сесії
              </p>
              <ul className="rounded-xl border border-border bg-bg divide-y divide-border overflow-hidden">
                {loggedSets.map((s, i) => {
                  const isEditing = editingSetId === s.id
                  return (
                    <motion.li
                      key={s.id}
                      className={cn(
                        "px-3 py-2.5",
                        flashIds.has(s.id) && "bg-accent-muted",
                      )}
                      animate={
                        flashIds.has(s.id)
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
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <span className="font-display text-[11px] uppercase tracking-wider text-text-secondary w-12 shrink-0">
                            № {i + 1}
                          </span>
                          <input
                            autoFocus
                            type="number"
                            inputMode="decimal"
                            step="0.5"
                            value={editWeight}
                            onChange={(e) => setEditWeight(e.target.value)}
                            className="w-16 h-9 bg-surface border border-border rounded-md text-center font-display text-text-primary text-[14px]"
                          />
                          <span className="text-text-secondary text-[11px]">кг</span>
                          <span className="text-text-secondary text-[14px]">×</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            step="1"
                            value={editReps}
                            onChange={(e) => setEditReps(e.target.value)}
                            className="w-14 h-9 bg-surface border border-border rounded-md text-center font-display text-text-primary text-[14px]"
                          />
                          <span className="text-text-secondary text-[11px]">повт</span>
                          <div className="flex-1" />
                          <button
                            onClick={() => commitEditSet(s.id)}
                            className="p-2 text-success hover:bg-success/10 rounded-md"
                            aria-label="Зберегти"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={cancelEditSet}
                            className="p-2 text-text-secondary hover:bg-surface rounded-md"
                            aria-label="Скасувати"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Check size={14} className="text-success shrink-0" />
                          <span className="font-display text-[11px] uppercase tracking-wider text-text-secondary w-12 shrink-0">
                            № {i + 1}
                          </span>
                          <button
                            onClick={() => startEditSet(s)}
                            className="font-display text-text-primary flex-1 text-[15px] text-left"
                          >
                            {formatWeight(s.weight)}
                            <span className="text-text-secondary text-[12px] mx-1">кг</span>
                            ×<span className="ml-1">{s.reps}</span>
                          </button>
                          <button
                            onClick={() => handleRemove(s.id)}
                            className="text-text-secondary hover:text-destructive p-1.5"
                            aria-label="Видалити підхід"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </motion.li>
                  )
                })}
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
