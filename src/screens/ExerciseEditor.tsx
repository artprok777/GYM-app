import { useEffect, useState } from "react"
import { ChevronLeft, Plus, Trash2, GripVertical } from "lucide-react"
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
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
  reorderExercises,
} from "@/db/exercises"
import { listWorkoutTypes, listPrograms } from "@/db/programs"
import type { ExerciseTemplate } from "@/db/schema"
import { cn } from "@/lib/utils"

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
  const [addingReps, setAddingReps] = useState("12")
  const [showAdd, setShowAdd] = useState(false)
  const [editingNameId, setEditingNameId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const [editingWeightId, setEditingWeightId] = useState<string | null>(null)
  const [draftWeight, setDraftWeight] = useState("")
  const [editingRepsId, setEditingRepsId] = useState<string | null>(null)
  const [draftReps, setDraftReps] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  )

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
    const reps = parseInt(addingReps, 10)
    if (!name || !sets || sets < 1) return
    await addExercise(workoutTypeId, name, sets, undefined, reps > 0 ? reps : undefined)
    setAddingName("")
    setAddingSets("3")
    setAddingReps("12")
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

  async function commitName(id: string) {
    const trimmed = draftName.trim()
    if (trimmed) await updateExercise(id, { name: trimmed })
    setEditingNameId(null)
    setDraftName("")
    await refresh()
  }

  async function commitWeight(id: string) {
    const raw = draftWeight.trim().replace(",", ".")
    if (raw === "") {
      await updateExercise(id, { targetWeight: undefined })
    } else {
      const n = parseFloat(raw)
      if (!isNaN(n) && n >= 0) await updateExercise(id, { targetWeight: n })
    }
    setEditingWeightId(null)
    setDraftWeight("")
    await refresh()
  }

  async function commitReps(id: string) {
    const raw = draftReps.trim()
    if (raw === "") {
      await updateExercise(id, { targetReps: undefined })
    } else {
      const n = parseInt(raw, 10)
      if (!isNaN(n) && n > 0) await updateExercise(id, { targetReps: n })
    }
    setEditingRepsId(null)
    setDraftReps("")
    await refresh()
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = exercises.findIndex((e) => e.id === active.id)
    const newIndex = exercises.findIndex((e) => e.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(exercises, oldIndex, newIndex)
    setExercises(next)
    await reorderExercises(
      workoutTypeId,
      next.map((e) => e.id),
    )
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={exercises.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
                {exercises.map((ex, i) => (
                  <SortableExerciseRow
                    key={ex.id}
                    exercise={ex}
                    index={i}
                    editingName={editingNameId === ex.id}
                    editingWeight={editingWeightId === ex.id}
                    editingReps={editingRepsId === ex.id}
                    draftName={draftName}
                    draftWeight={draftWeight}
                    draftReps={draftReps}
                    onStartEditName={() => {
                      setEditingNameId(ex.id)
                      setDraftName(ex.name)
                    }}
                    onChangeName={setDraftName}
                    onCommitName={() => commitName(ex.id)}
                    onStartEditWeight={() => {
                      setEditingWeightId(ex.id)
                      setDraftWeight(
                        ex.targetWeight != null ? String(ex.targetWeight) : "",
                      )
                    }}
                    onChangeWeight={setDraftWeight}
                    onCommitWeight={() => commitWeight(ex.id)}
                    onStartEditReps={() => {
                      setEditingRepsId(ex.id)
                      setDraftReps(
                        ex.targetReps != null ? String(ex.targetReps) : "",
                      )
                    }}
                    onChangeReps={setDraftReps}
                    onCommitReps={() => commitReps(ex.id)}
                    onSetsChange={(v) => handleSetsChange(ex.id, v)}
                    onDelete={() => handleDelete(ex.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
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
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={addingSets}
                onChange={(e) => setAddingSets(e.target.value)}
                className="w-16 bg-bg border-border h-12 text-center text-text-primary font-display text-lg"
                min="1"
              />
              <span className="text-text-secondary text-sm">підх</span>
              <span className="text-text-secondary text-lg">×</span>
              <Input
                type="number"
                value={addingReps}
                onChange={(e) => setAddingReps(e.target.value)}
                className="w-16 bg-bg border-border h-12 text-center text-text-primary font-display text-lg"
                min="1"
              />
              <span className="text-text-secondary text-sm">повт</span>
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

function SortableExerciseRow({
  exercise,
  index,
  editingName,
  editingWeight,
  editingReps,
  draftName,
  draftWeight,
  draftReps,
  onStartEditName,
  onChangeName,
  onCommitName,
  onStartEditWeight,
  onChangeWeight,
  onCommitWeight,
  onStartEditReps,
  onChangeReps,
  onCommitReps,
  onSetsChange,
  onDelete,
}: {
  exercise: ExerciseTemplate
  index: number
  editingName: boolean
  editingWeight: boolean
  editingReps: boolean
  draftName: string
  draftWeight: string
  draftReps: string
  onStartEditName: () => void
  onChangeName: (v: string) => void
  onCommitName: () => void
  onStartEditWeight: () => void
  onChangeWeight: (v: string) => void
  onCommitWeight: () => void
  onStartEditReps: () => void
  onChangeReps: (v: string) => void
  onCommitReps: () => void
  onSetsChange: (v: string) => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-stretch gap-1 px-1.5 py-2 bg-surface",
        isDragging && "opacity-60 shadow-lg z-10 relative",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1.5 text-text-secondary hover:text-text-primary touch-none cursor-grab active:cursor-grabbing flex items-center justify-center"
        aria-label="Перетягнути"
      >
        <GripVertical size={16} />
      </button>
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 min-h-[28px]">
          <span className="font-display text-[12px] text-text-secondary w-5 text-center shrink-0">
            {String(index + 1).padStart(2, "0")}
          </span>
          {editingName ? (
            <Input
              autoFocus
              value={draftName}
              onChange={(e) => onChangeName(e.target.value)}
              onBlur={onCommitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") onCommitName()
                if (e.key === "Escape") onCommitName()
              }}
              className="flex-1 h-9 bg-bg border-border text-text-primary px-2 text-[15px]"
            />
          ) : (
            <button
              onClick={onStartEditName}
              className="flex-1 font-sans font-medium text-text-primary text-[15px] min-w-0 truncate text-left"
            >
              {exercise.name}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 pl-7">
          {editingWeight ? (
            <Input
              autoFocus
              type="number"
              inputMode="decimal"
              step="0.5"
              value={draftWeight}
              onChange={(e) => onChangeWeight(e.target.value)}
              onBlur={onCommitWeight}
              onKeyDown={(e) => {
                if (e.key === "Enter") onCommitWeight()
                if (e.key === "Escape") onCommitWeight()
              }}
              className="w-16 h-8 bg-bg border-border text-center font-display text-text-primary px-1"
              min="0"
            />
          ) : (
            <button
              onClick={onStartEditWeight}
              className={cn(
                "h-8 px-2 rounded-md border border-border bg-bg flex items-center gap-1 font-display text-[12px]",
                exercise.targetWeight != null
                  ? "text-text-primary"
                  : "text-text-secondary",
              )}
              aria-label="Цільова вага"
            >
              {exercise.targetWeight != null ? exercise.targetWeight : "—"}
              <span className="text-text-secondary text-[10px] uppercase tracking-wider">
                кг
              </span>
            </button>
          )}
          <div className="flex items-center gap-1 ml-1">
            <Input
              type="number"
              value={exercise.targetSets}
              onChange={(e) => onSetsChange(e.target.value)}
              className="w-11 h-8 bg-bg border-border text-center font-display text-text-primary px-1 text-[13px]"
              min="1"
            />
            <span className="font-display text-[10px] uppercase tracking-wider text-text-secondary">
              підх
            </span>
            <span className="font-display text-text-secondary text-[13px] mx-0.5">×</span>
            {editingReps ? (
              <Input
                autoFocus
                type="number"
                inputMode="numeric"
                step="1"
                value={draftReps}
                onChange={(e) => onChangeReps(e.target.value)}
                onBlur={onCommitReps}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onCommitReps()
                  if (e.key === "Escape") onCommitReps()
                }}
                className="w-11 h-8 bg-bg border-border text-center font-display text-text-primary px-1 text-[13px]"
                min="1"
              />
            ) : (
              <button
                onClick={onStartEditReps}
                className={cn(
                  "w-11 h-8 rounded-md border border-border bg-bg flex items-center justify-center font-display text-[13px]",
                  exercise.targetReps != null
                    ? "text-text-primary"
                    : "text-text-secondary",
                )}
                aria-label="Цільові повтори"
              >
                {exercise.targetReps != null ? exercise.targetReps : "—"}
              </button>
            )}
            <span className="font-display text-[10px] uppercase tracking-wider text-text-secondary">
              повт
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={onDelete}
        className="p-2 text-text-secondary hover:text-destructive min-h-[44px] min-w-[40px] flex items-center justify-center self-start"
        aria-label="Видалити вправу"
      >
        <Trash2 size={16} />
      </button>
    </li>
  )
}
