import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, ChevronRight, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  listPrograms,
  createProgram,
  listWorkoutTypes,
  addWorkoutType,
  renameWorkoutType,
  deleteWorkoutType,
} from "@/db/programs"
import type { Program, WorkoutType } from "@/db/schema"
import { cn } from "@/lib/utils"

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
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
          {types.map((wt) => (
            <li
              key={wt.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 transition-colors",
                editingId === wt.id && "bg-bg",
              )}
            >
              {editingId === wt.id ? (
                <Input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={() => handleRename(wt.id)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename(wt.id)}
                  className="bg-bg border-border text-text-primary h-11"
                />
              ) : (
                <button
                  onClick={() => onSelectWorkoutType(wt.id)}
                  className="flex items-center gap-3 flex-1 min-h-[44px] text-left group"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg border border-border font-display text-[13px] text-accent shrink-0">
                    {String.fromCharCode(65 + types.indexOf(wt))}
                  </div>
                  <span className="font-sans font-medium text-text-primary text-[15px] flex-1 min-w-0 truncate">
                    {wt.name}
                  </span>
                  <ChevronRight
                    size={16}
                    className="text-text-secondary group-active:translate-x-0.5 transition-transform"
                  />
                </button>
              )}
              <button
                onClick={() => {
                  setEditingId(wt.id)
                  setDraftName(wt.name)
                }}
                className="p-2 text-text-secondary hover:text-accent min-h-[44px] min-w-[40px] flex items-center justify-center"
                aria-label="Перейменувати"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(wt.id)}
                className="p-2 text-text-secondary hover:text-destructive min-h-[44px] min-w-[40px] flex items-center justify-center"
                aria-label="Видалити"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button
        onClick={handleAdd}
        className="w-full bg-accent text-bg hover:bg-accent/90 h-12 font-medium text-[15px]"
      >
        <Plus size={18} className="mr-1.5" /> Додати тренування
      </Button>
    </section>
  )
}
