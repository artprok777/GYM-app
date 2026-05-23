import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  listPrograms,
  createProgram,
  listWorkoutTypes,
  addWorkoutType,
  renameWorkoutType,
  deleteWorkoutType,
} from "@/db/programs"
import type { Program, WorkoutType } from "@/db/schema"

export function ProgramEditor({
  onSelectWorkoutType,
}: {
  onSelectWorkoutType: (wtId: string) => void
}) {
  const [program, setProgram] = useState<Program | null>(null)
  const [types, setTypes] = useState<WorkoutType[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")

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

  async function handleAdd() {
    if (!program) return
    const nextLetter = String.fromCharCode(65 + types.length)
    await addWorkoutType(program.id, `Тренування ${nextLetter}`)
    await refresh()
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

  return (
    <div className="space-y-3">
      <div>
        <h1 className="font-display text-3xl">Програма</h1>
        <p className="text-text-secondary text-sm mt-1">
          Тренування і вправи. Натисни на тренування, щоб редагувати вправи.
        </p>
      </div>

      <div className="space-y-2">
        {types.map((wt) => (
          <Card
            key={wt.id}
            className="bg-surface border-border p-3 flex items-center gap-2"
          >
            {editingId === wt.id ? (
              <Input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={() => handleRename(wt.id)}
                onKeyDown={(e) => e.key === "Enter" && handleRename(wt.id)}
                className="bg-bg border-border text-text-primary"
              />
            ) : (
              <button
                onClick={() => onSelectWorkoutType(wt.id)}
                className="font-display text-lg text-left flex-1 min-h-[44px] text-text-primary"
              >
                {wt.name}
              </button>
            )}
            <button
              onClick={() => {
                setEditingId(wt.id)
                setDraftName(wt.name)
              }}
              className="p-2 text-text-secondary hover:text-accent min-h-[44px] min-w-[44px]"
              aria-label="Перейменувати"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => handleDelete(wt.id)}
              className="p-2 text-text-secondary hover:text-destructive min-h-[44px] min-w-[44px]"
              aria-label="Видалити"
            >
              <Trash2 size={18} />
            </button>
          </Card>
        ))}
        {types.length === 0 && (
          <p className="text-text-secondary text-sm py-4 text-center">
            Створи перше тренування — наприклад A, B, C — і додай у нього вправи.
          </p>
        )}
      </div>

      <Button
        onClick={handleAdd}
        className="w-full bg-accent text-bg hover:bg-accent/90 h-12"
      >
        <Plus size={18} className="mr-2" /> Додати тренування
      </Button>
    </div>
  )
}
