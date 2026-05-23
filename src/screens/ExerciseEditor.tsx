import { useEffect, useState } from "react"
import { ChevronLeft, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  listExercises,
  addExercise,
  deleteExercise,
  updateExercise,
} from "@/db/exercises"
import { listWorkoutTypes, listPrograms } from "@/db/programs"
import type { ExerciseTemplate } from "@/db/schema"

export function ExerciseEditor({
  workoutTypeId,
  onBack,
}: {
  workoutTypeId: string
  onBack: () => void
}) {
  const [exercises, setExercises] = useState<ExerciseTemplate[]>([])
  const [workoutName, setWorkoutName] = useState<string>("")
  const [addingName, setAddingName] = useState("")
  const [addingSets, setAddingSets] = useState("3")
  const [showAdd, setShowAdd] = useState(false)

  async function refresh() {
    setExercises(await listExercises(workoutTypeId))
    const programs = await listPrograms()
    if (programs[0]) {
      const types = await listWorkoutTypes(programs[0].id)
      setWorkoutName(types.find((t) => t.id === workoutTypeId)?.name ?? "")
    }
  }

  useEffect(() => {
    refresh()
  }, [workoutTypeId])

  async function handleAdd() {
    const name = addingName.trim()
    const sets = parseInt(addingSets, 10)
    if (!name || !sets || sets < 1) return
    await addExercise(workoutTypeId, name, sets)
    setAddingName("")
    setAddingSets("3")
    setShowAdd(false)
    await refresh()
  }

  async function handleDelete(id: string) {
    await deleteExercise(id)
    await refresh()
  }

  async function handleSetsChange(id: string, sets: string) {
    const n = parseInt(sets, 10)
    if (n > 0) await updateExercise(id, { targetSets: n })
    await refresh()
  }

  return (
    <div className="px-5 py-6 pb-12 space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-text-secondary hover:text-accent -ml-1 text-[14px]"
      >
        <ChevronLeft size={18} /> Програма
      </button>

      <div>
        <p className="font-display text-[11px] uppercase tracking-[0.2em] text-text-secondary mb-1.5">
          Вправи
        </p>
        <h1 className="font-display text-[28px] leading-none font-medium tracking-tight">
          {workoutName || "Тренування"}
        </h1>
      </div>

      <div className="space-y-2">
        {exercises.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-1">
            <p className="font-display text-text-primary text-base">
              Поки немає вправ
            </p>
            <p className="text-text-secondary text-sm">
              Додай першу вправу нижче.
            </p>
          </div>
        )}
        {exercises.length > 0 && (
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
            {exercises.map((ex, i) => (
              <li
                key={ex.id}
                className="flex items-center gap-3 px-3 py-2.5 min-h-[56px]"
              >
                <span className="font-display text-[12px] text-text-secondary w-5 text-center">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-sans font-medium text-text-primary text-[15px] min-w-0 truncate">
                  {ex.name}
                </span>
                <Input
                  type="number"
                  value={ex.targetSets}
                  onChange={(e) => handleSetsChange(ex.id, e.target.value)}
                  className="w-14 h-9 bg-bg border-border text-center font-display text-text-primary px-1"
                  min="1"
                />
                <span className="font-display text-[10px] uppercase tracking-wider text-text-secondary">
                  підх
                </span>
                <button
                  onClick={() => handleDelete(ex.id)}
                  className="p-2 text-text-secondary hover:text-destructive min-h-[44px] min-w-[40px] flex items-center justify-center"
                  aria-label="Видалити вправу"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button
        onClick={() => setShowAdd(true)}
        className="w-full bg-accent text-bg hover:bg-accent/90 h-12 font-medium text-[15px]"
      >
        <Plus size={18} className="mr-1.5" /> Додати вправу
      </Button>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-surface border-border text-text-primary">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">
              Нова вправа
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Input
              placeholder="Напр. Присідання зі штангою"
              value={addingName}
              onChange={(e) => setAddingName(e.target.value)}
              className="bg-bg border-border h-12 text-text-primary text-[15px]"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={addingSets}
                onChange={(e) => setAddingSets(e.target.value)}
                className="w-20 bg-bg border-border h-12 text-center text-text-primary font-display text-lg"
                min="1"
              />
              <span className="text-text-secondary text-sm">
                цільових підходів
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAdd}
              className="bg-accent text-bg hover:bg-accent/90 w-full h-12 font-medium"
            >
              Додати
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
