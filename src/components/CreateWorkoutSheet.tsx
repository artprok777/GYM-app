import { useState } from "react"
import { motion, AnimatePresence, useDragControls } from "framer-motion"
import { X, Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { addWorkoutType } from "@/db/programs"
import { addExercise } from "@/db/exercises"
import { cn } from "@/lib/utils"

interface DraftExercise {
  name: string
  targetSets: number
  targetWeight?: number
}

export function CreateWorkoutSheet({
  programId,
  onClose,
  onCreated,
}: {
  programId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [workoutName, setWorkoutName] = useState("")
  const [exercises, setExercises] = useState<DraftExercise[]>([])
  const [exName, setExName] = useState("")
  const [exSets, setExSets] = useState("3")
  const [exWeight, setExWeight] = useState("")
  const [saving, setSaving] = useState(false)
  const dragControls = useDragControls()

  function addDraftExercise() {
    const name = exName.trim()
    if (!name) return
    const sets = parseInt(exSets, 10) || 3
    const w = parseFloat(exWeight.replace(",", "."))
    setExercises((prev) => [
      ...prev,
      { name, targetSets: sets, targetWeight: w > 0 ? w : undefined },
    ])
    setExName("")
    setExWeight("")
    setExSets("3")
  }

  function removeDraft(idx: number) {
    setExercises((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    const name = workoutName.trim()
    if (!name || saving) return
    setSaving(true)
    const wt = await addWorkoutType(programId, name)
    for (const ex of exercises) {
      await addExercise(wt.id, ex.name, ex.targetSets, ex.targetWeight)
    }
    onCreated()
    onClose()
  }

  const canSave = workoutName.trim().length > 0

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
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          maxHeight: "calc(100dvh - env(safe-area-inset-top) - 8px)",
        }}
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
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none shrink-0"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-5 pb-5 space-y-5 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="font-display text-[10px] uppercase tracking-[0.2em] text-accent">
                Новий блок
              </p>
              <h2 className="font-display text-[22px] leading-tight text-text-primary tracking-tight">
                Нове тренування
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-text-secondary p-2 -mr-2 hover:text-text-primary shrink-0"
              aria-label="Закрити"
            >
              <X size={22} />
            </button>
          </div>

          {/* Workout name */}
          <Input
            autoFocus
            placeholder="Назва (напр. Тренування A)"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            className="bg-bg border-border h-12 text-text-primary text-[15px]"
          />

          {/* Added exercises */}
          {exercises.length > 0 && (
            <div className="space-y-1.5">
              <p className="font-display text-[10px] uppercase tracking-[0.2em] text-text-secondary px-1">
                Вправи
              </p>
              <ul className="rounded-xl border border-border bg-bg divide-y divide-border overflow-hidden">
                {exercises.map((ex, i) => (
                  <li key={i} className="flex items-center gap-3 px-4 py-3 min-h-[52px]">
                    <span className="font-display text-[11px] text-text-secondary w-5 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-sans text-text-primary text-[14px] min-w-0 truncate">
                      {ex.name}
                    </span>
                    <span className="font-display text-[11px] text-text-secondary shrink-0">
                      {ex.targetSets} підх
                      {ex.targetWeight ? ` · ${ex.targetWeight} кг` : ""}
                    </span>
                    <button
                      onClick={() => removeDraft(i)}
                      className="text-text-secondary hover:text-destructive p-1.5 shrink-0"
                      aria-label="Видалити"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Add exercise form */}
          <div className="rounded-xl border border-border bg-bg p-4 space-y-3">
            <p className="font-display text-[10px] uppercase tracking-[0.2em] text-text-secondary">
              Додати вправу
            </p>
            <Input
              placeholder="Назва вправи"
              value={exName}
              onChange={(e) => setExName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDraftExercise()}
              className="bg-surface border-border h-11 text-text-primary text-[14px]"
            />
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={exSets}
                  onChange={(e) => setExSets(e.target.value)}
                  className="w-14 bg-surface border-border h-11 text-center font-display text-text-primary"
                  min="1"
                />
                <span className="font-display text-[11px] text-text-secondary uppercase tracking-wider whitespace-nowrap">
                  підх
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-1">
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="кг"
                  value={exWeight}
                  onChange={(e) => setExWeight(e.target.value)}
                  className="flex-1 bg-surface border-border h-11 text-center font-display text-text-primary"
                />
                <span className="font-display text-[11px] text-text-secondary uppercase tracking-wider">
                  кг
                </span>
              </div>
            </div>
            <button
              onClick={addDraftExercise}
              disabled={!exName.trim()}
              className={cn(
                "w-full h-10 rounded-lg border font-display text-[13px] flex items-center justify-center gap-1.5 transition-colors",
                exName.trim()
                  ? "border-accent/40 text-accent hover:bg-accent/10 active:bg-accent/20"
                  : "border-border text-text-secondary/40",
              )}
            >
              <Plus size={15} strokeWidth={2.5} />
              Додати вправу
            </button>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className={cn(
              "w-full h-14 rounded-xl font-medium text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
              canSave
                ? "bg-accent text-bg hover:bg-accent/90"
                : "bg-surface text-text-secondary border border-border",
            )}
          >
            Зберегти тренування
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
