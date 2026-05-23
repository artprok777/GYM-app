import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getSessionSetsForExercise,
  getLastSetsForExercise,
  logSet,
  deleteSet,
} from "@/db/sessions"
import type { ExerciseTemplate, LoggedSet } from "@/db/schema"
import { formatWeight, formatLastSession } from "@/lib/format"
import { cn } from "@/lib/utils"

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
  const [weight, setWeight] = useState("")
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
        setWeight(formatWeight(seed.weight))
        setReps(String(seed.reps))
      }
      setSeeded(true)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleAdd() {
    const w = parseFloat(weight.replace(",", "."))
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
    setTimeout(() => setFlashId(null), 400)
    await refresh()
  }

  async function handleRemove(id: string) {
    await deleteSet(id)
    await refresh()
  }

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        className="fixed inset-0 bg-black/60 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        key="sheet"
        className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-50 pb-[env(safe-area-inset-bottom)] border-t border-border"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
      >
        <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-xl text-text-primary">
                {exercise.name}
              </h2>
              <p className="text-text-secondary text-sm mt-1">
                Минулого разу:{" "}
                <span className="font-display">{formatLastSession(lastSets)}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-text-secondary p-2 -mr-2 hover:text-text-primary"
              aria-label="Закрити"
            >
              <X size={22} />
            </button>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-text-secondary text-xs uppercase tracking-wider">
                КГ
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg text-center font-display text-4xl py-3 mt-1 focus:border-accent outline-none text-text-primary"
              />
            </div>
            <div className="flex-1">
              <label className="text-text-secondary text-xs uppercase tracking-wider">
                ПОВТОРИ
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg text-center font-display text-4xl py-3 mt-1 focus:border-accent outline-none text-text-primary"
              />
            </div>
          </div>

          <Button
            onClick={handleAdd}
            className="w-full bg-accent text-bg hover:bg-accent/90 h-14 text-base font-medium"
          >
            <Plus size={20} className="mr-2" /> Додати підхід
          </Button>

          <div className="space-y-2 pt-2">
            {loggedSets.map((s, i) => (
              <motion.div
                key={s.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg border border-border",
                  flashId === s.id ? "bg-accent-muted" : "bg-bg",
                )}
                animate={
                  flashId === s.id
                    ? {
                        backgroundColor: [
                          "rgba(245,166,35,0.3)",
                          "rgba(245,166,35,0)",
                        ],
                      }
                    : {}
                }
                transition={{ duration: 0.4 }}
              >
                <Check size={16} className="text-success" />
                <span className="text-text-secondary text-sm w-20">
                  Підхід {i + 1}
                </span>
                <span className="font-display flex-1 text-text-primary">
                  {formatWeight(s.weight)} кг × {s.reps}
                </span>
                <button
                  onClick={() => handleRemove(s.id)}
                  className="text-text-secondary text-xs hover:text-destructive px-2"
                  aria-label="Видалити підхід"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
