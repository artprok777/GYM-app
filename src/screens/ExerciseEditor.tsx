import { useEffect, useState } from "react"
import { ChevronLeft, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
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
import type { ExerciseTemplate } from "@/db/schema"

export function ExerciseEditor({
  workoutTypeId,
  onBack,
}: {
  workoutTypeId: string
  onBack: () => void
}) {
  const [exercises, setExercises] = useState<ExerciseTemplate[]>([])
  const [addingName, setAddingName] = useState("")
  const [addingSets, setAddingSets] = useState("3")
  const [showAdd, setShowAdd] = useState(false)

  async function refresh() {
    setExercises(await listExercises(workoutTypeId))
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
    <div className="p-6 pb-24 space-y-4">
      <Button
        variant="ghost"
        onClick={onBack}
        className="-ml-2 text-text-primary hover:text-accent hover:bg-transparent"
      >
        <ChevronLeft size={18} /> Назад
      </Button>

      <h1 className="font-display text-2xl">Вправи</h1>

      <div className="space-y-2">
        {exercises.length === 0 && (
          <p className="text-text-secondary text-sm py-4 text-center">
            Поки немає вправ. Додай першу.
          </p>
        )}
        {exercises.map((ex) => (
          <Card
            key={ex.id}
            className="bg-surface border-border p-3 flex items-center gap-3"
          >
            <span className="flex-1 font-display text-text-primary">{ex.name}</span>
            <Input
              type="number"
              value={ex.targetSets}
              onChange={(e) => handleSetsChange(ex.id, e.target.value)}
              className="w-16 bg-bg border-border text-center text-text-primary"
              min="1"
            />
            <span className="text-text-secondary text-sm">підх.</span>
            <button
              onClick={() => handleDelete(ex.id)}
              className="p-2 text-text-secondary hover:text-destructive min-h-[44px] min-w-[44px]"
              aria-label="Видалити вправу"
            >
              <Trash2 size={18} />
            </button>
          </Card>
        ))}
      </div>

      <Button
        onClick={() => setShowAdd(true)}
        className="w-full bg-accent text-bg hover:bg-accent/90 h-12"
      >
        <Plus size={18} className="mr-2" /> Додати вправу
      </Button>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-surface border-border text-text-primary">
          <DialogHeader>
            <DialogTitle className="font-display">Нова вправа</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Назва (напр. Присідання)"
              value={addingName}
              onChange={(e) => setAddingName(e.target.value)}
              className="bg-bg border-border h-12 text-text-primary"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={addingSets}
                onChange={(e) => setAddingSets(e.target.value)}
                className="w-20 bg-bg border-border h-12 text-center text-text-primary"
                min="1"
              />
              <span className="text-text-secondary">підходів</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAdd}
              className="bg-accent text-bg hover:bg-accent/90 w-full h-12"
            >
              Додати
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
