import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, ChevronRight, LayoutGrid, GripVertical } from "lucide-react"
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
  listPrograms,
  createProgram,
  listWorkoutTypes,
  renameWorkoutType,
  deleteWorkoutType,
  reorderWorkoutTypes,
} from "@/db/programs"
import { CreateWorkoutSheet } from "@/components/CreateWorkoutSheet"
import type { Program, WorkoutType } from "@/db/schema"
import { cn } from "@/lib/utils"
import { useSyncRefresh } from "@/hooks/useSyncRefresh"

export function ProgramEditor({
  onSelectWorkoutType,
}: {
  onSelectWorkoutType: (wtId: string) => void
}) {
  const [program, setProgram] = useState<Program | null>(null)
  const [types, setTypes] = useState<WorkoutType[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const [showCreateSheet, setShowCreateSheet] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
  )

  async function refresh() {
    const programs = await listPrograms()
    let p = programs[0]
    if (!p) p = await createProgram("Моя програма")
    setProgram(p)
    setTypes(await listWorkoutTypes(p.id))
  }

  useEffect(() => {
    refresh()
  }, [])

  useSyncRefresh(refresh)

  function handleAdd() {
    if (!program) return
    setShowCreateSheet(true)
  }

  async function handleRename(id: string) {
    const trimmed = draftName.trim()
    if (trimmed) {
      await renameWorkoutType(id, trimmed)
    }
    setEditingId(null)
    setDraftName("")
    await refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm("Видалити це тренування разом з вправами?")) return
    await deleteWorkoutType(id)
    await refresh()
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (!program) return
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = types.findIndex((t) => t.id === active.id)
    const newIndex = types.findIndex((t) => t.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(types, oldIndex, newIndex)
    setTypes(next)
    await reorderWorkoutTypes(
      program.id,
      next.map((t) => t.id),
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="font-display text-[11px] uppercase tracking-[0.2em] text-text-secondary mb-1.5">
          Тренування
        </p>
        <h2 className="font-display text-xl text-text-primary">
          Створи блоки A, B, C
        </h2>
      </div>

      {types.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent-muted text-accent mb-1">
            <LayoutGrid size={18} />
          </div>
          <p className="font-display text-text-primary text-base">
            Поки немає блоків
          </p>
          <p className="text-text-secondary text-sm leading-relaxed">
            Створи перше тренування — натисни нижче.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={types.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
              {types.map((wt, i) => (
                <SortableWorkoutTypeRow
                  key={wt.id}
                  workoutType={wt}
                  letter={String.fromCharCode(65 + i)}
                  editing={editingId === wt.id}
                  draftName={draftName}
                  onChangeDraft={setDraftName}
                  onCommit={() => handleRename(wt.id)}
                  onStartEdit={() => {
                    setEditingId(wt.id)
                    setDraftName(wt.name)
                  }}
                  onSelect={() => onSelectWorkoutType(wt.id)}
                  onDelete={() => handleDelete(wt.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <Button
        onClick={handleAdd}
        className="w-full bg-accent text-bg hover:bg-accent/90 h-12 font-medium text-[15px]"
      >
        <Plus size={18} className="mr-1.5" /> Додати тренування
      </Button>

      {showCreateSheet && program && (
        <CreateWorkoutSheet
          programId={program.id}
          onClose={() => setShowCreateSheet(false)}
          onCreated={refresh}
        />
      )}
    </section>
  )
}

function SortableWorkoutTypeRow({
  workoutType,
  letter,
  editing,
  draftName,
  onChangeDraft,
  onCommit,
  onStartEdit,
  onSelect,
  onDelete,
}: {
  workoutType: WorkoutType
  letter: string
  editing: boolean
  draftName: string
  onChangeDraft: (v: string) => void
  onCommit: () => void
  onStartEdit: () => void
  onSelect: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: workoutType.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 px-2 py-2.5 transition-colors bg-surface",
        editing && "bg-bg",
        isDragging && "opacity-60 shadow-lg z-10 relative",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1.5 text-text-secondary hover:text-text-primary touch-none cursor-grab active:cursor-grabbing min-h-[44px] flex items-center justify-center"
        aria-label="Перетягнути"
      >
        <GripVertical size={16} />
      </button>
      {editing ? (
        <Input
          autoFocus
          value={draftName}
          onChange={(e) => onChangeDraft(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => e.key === "Enter" && onCommit()}
          className="bg-bg border-border text-text-primary h-11 flex-1"
        />
      ) : (
        <button
          onClick={onSelect}
          className="flex items-center gap-3 flex-1 min-h-[44px] text-left group"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg border border-border font-display text-[13px] text-accent shrink-0">
            {letter}
          </div>
          <span className="font-sans font-medium text-text-primary text-[15px] flex-1 min-w-0 truncate">
            {workoutType.name}
          </span>
          <ChevronRight
            size={16}
            className="text-text-secondary group-active:translate-x-0.5 transition-transform"
          />
        </button>
      )}
      <button
        onClick={onStartEdit}
        className="p-2 text-text-secondary hover:text-accent min-h-[44px] min-w-[40px] flex items-center justify-center"
        aria-label="Перейменувати"
      >
        <Pencil size={16} />
      </button>
      <button
        onClick={onDelete}
        className="p-2 text-text-secondary hover:text-destructive min-h-[44px] min-w-[40px] flex items-center justify-center"
        aria-label="Видалити"
      >
        <Trash2 size={16} />
      </button>
    </li>
  )
}
