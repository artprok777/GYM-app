import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, Plus, GripVertical, Pencil, Check, ArrowRight } from "lucide-react"
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
  reorderExercises,
} from "@/db/exercises"
import { listWorkoutTypes, listPrograms, renameWorkoutType } from "@/db/programs"
import type { ExerciseTemplate } from "@/db/schema"
import { cn } from "@/lib/utils"
import { useSyncRefresh } from "@/hooks/useSyncRefresh"

export function ExerciseEditor({
  workoutTypeId,
  onBack,
  onSelectExercise,
}: {
  workoutTypeId: string
  onBack: () => void
  onSelectExercise: (exerciseId: string) => void
}) {
  const [exercises, setExercises] = useState<ExerciseTemplate[]>([])
  const [workoutName, setWorkoutName] = useState<string>("")
  const [addingName, setAddingName] = useState("")
  const [addingSets, setAddingSets] = useState("3")
  const [addingReps, setAddingReps] = useState("12")
  const [showAdd, setShowAdd] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  )

  const refresh = useCallback(async () => {
    setExercises(await listExercises(workoutTypeId))
    const programs = await listPrograms()
    if (programs[0]) {
      const types = await listWorkoutTypes(programs[0].id)
      setWorkoutName(types.find((t) => t.id === workoutTypeId)?.name ?? "")
    }
  }, [workoutTypeId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useSyncRefresh(refresh)

  async function commitTitle() {
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== workoutName) {
      await renameWorkoutType(workoutTypeId, trimmed)
    }
    setEditingTitle(false)
    setTitleDraft("")
    await refresh()
  }

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
        {editingTitle ? (
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle()
                if (e.key === "Escape") {
                  setEditingTitle(false)
                  setTitleDraft("")
                }
              }}
              className="bg-bg border-border text-text-primary font-display text-[28px] h-12 flex-1"
            />
            <button
              onClick={commitTitle}
              className="p-2 text-accent hover:text-accent/80 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Зберегти назву"
            >
              <Check size={20} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setEditingTitle(true)
              setTitleDraft(workoutName || "")
            }}
            className="group flex items-center gap-2 text-left min-h-[44px]"
            aria-label="Перейменувати тренування"
          >
            <h1 className="font-display text-[28px] leading-none font-medium tracking-tight">
              {workoutName || "Тренування"}
            </h1>
            <Pencil
              size={15}
              className="text-text-secondary group-hover:text-accent transition-colors"
            />
          </button>
        )}
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
              <ul className="space-y-2">
                {exercises.map((ex) => (
                  <SortableExerciseRow
                    key={ex.id}
                    exercise={ex}
                    onSelect={() => onSelectExercise(ex.id)}
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
  onSelect,
}: {
  exercise: ExerciseTemplate
  onSelect: () => void
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
        "flex items-stretch gap-1 rounded-xl border border-border bg-surface overflow-hidden",
        isDragging && "opacity-60 shadow-lg z-10 relative",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="px-2 text-text-secondary hover:text-text-primary touch-none cursor-grab active:cursor-grabbing flex items-center justify-center"
        aria-label="Перетягнути"
      >
        <GripVertical size={16} />
      </button>
      <button
        onClick={onSelect}
        className="group flex-1 min-w-0 text-left px-2 py-3.5 space-y-2 active:bg-bg/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 font-display font-medium text-text-primary text-[16px] leading-tight tracking-tight truncate">
            {exercise.name}
          </div>
          <ArrowRight
            size={16}
            className="shrink-0 text-text-secondary/50 group-active:translate-x-0.5 transition-transform"
          />
        </div>
        <dl className="flex items-baseline gap-x-4 gap-y-1 flex-wrap">
          <SummaryItem label="Підходи" value={String(exercise.targetSets)} />
          <SummaryItem
            label="Повтори"
            value={exercise.targetReps != null ? String(exercise.targetReps) : "—"}
          />
          <SummaryItem
            label="Вага"
            value={
              exercise.targetWeight != null ? `${exercise.targetWeight} кг` : "—"
            }
          />
        </dl>
      </button>
    </li>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="font-display text-[10px] uppercase tracking-[0.15em] text-text-secondary">
        {label}
      </dt>
      <dd className="font-display text-[13px] text-text-primary tabular-nums">
        {value}
      </dd>
    </div>
  )
}
