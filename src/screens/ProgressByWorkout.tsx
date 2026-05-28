import { useCallback, useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Card } from "@/components/ui/card"
import { ChevronDown, ArrowUp, ArrowRight, ArrowDown } from "lucide-react"
import { listPrograms, listWorkoutTypes } from "@/db/programs"
import { listExercises } from "@/db/exercises"
import {
  getWorkoutProgress,
  getSessionDatesForWorkoutType,
} from "@/db/progress"
import type { WorkoutType } from "@/db/schema"
import { formatWeight } from "@/lib/format"
import { useSyncRefresh } from "@/hooks/useSyncRefresh"

interface Row {
  name: string
  first: number
  latest: number
  delta: number
}

export function ProgressByWorkout() {
  const [types, setTypes] = useState<WorkoutType[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [dates, setDates] = useState<number[]>([])

  const loadTypes = useCallback(async () => {
    const programs = await listPrograms()
    if (!programs[0]) return
    const t = await listWorkoutTypes(programs[0].id)
    setTypes(t)
    setSelectedId((cur) => cur ?? t[0]?.id ?? null)
  }, [])

  const loadProgress = useCallback(async () => {
    if (!selectedId) return
    const ex = await listExercises(selectedId)
    const progress = await getWorkoutProgress(
      selectedId,
      ex.map((e) => e.name),
    )
    const computed: Row[] = progress.map((p) => ({
      name: p.exerciseName,
      first: p.firstWeight,
      latest: p.latestWeight,
      delta:
        p.firstWeight === 0
          ? 0
          : ((p.latestWeight - p.firstWeight) / p.firstWeight) * 100,
    }))
    setRows(computed)
    setDates(await getSessionDatesForWorkoutType(selectedId))
  }, [selectedId])

  useEffect(() => {
    loadTypes()
  }, [loadTypes])

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  useSyncRefresh(useCallback(async () => {
    await loadTypes()
    await loadProgress()
  }, [loadTypes, loadProgress]))

  const selectedName = types.find((t) => t.id === selectedId)?.name

  if (types.length === 0) {
    return (
      <p className="text-text-secondary text-sm py-8 text-center">
        Створи програму, щоб бачити прогрес по тренуванню.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 bg-surface border border-border h-10 px-3 rounded-md text-text-primary text-sm data-[state=open]:border-accent focus:outline-none">
          <span>{selectedName ?? "Тренування"}</span>
          <ChevronDown size={14} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-surface border-border">
          {types.map((t) => (
            <DropdownMenuItem
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className="text-text-primary focus:bg-bg focus:text-text-primary"
            >
              {t.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {rows.length === 0 ? (
        <p className="text-text-secondary text-sm py-8 text-center">
          Зроби це тренування хоча б раз, щоб побачити прогрес.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const Icon = r.delta > 1 ? ArrowUp : r.delta < -1 ? ArrowDown : ArrowRight
            const color =
              r.delta > 1
                ? "text-success"
                : r.delta < -1
                  ? "text-destructive"
                  : "text-text-secondary"
            return (
              <Card
                key={r.name}
                className="bg-surface border-border p-3 flex items-center justify-between gap-3"
              >
                <span className="font-display flex-1 text-text-primary min-w-0 truncate">
                  {r.name}
                </span>
                <span className="font-display text-text-secondary text-sm shrink-0">
                  {formatWeight(r.first)} → {formatWeight(r.latest)} кг
                </span>
                <span
                  className={`font-display flex items-center gap-1 ${color} w-16 justify-end shrink-0`}
                >
                  <Icon size={14} />
                  {r.delta >= 0 ? "+" : ""}
                  {r.delta.toFixed(0)}%
                </span>
              </Card>
            )
          })}
        </div>
      )}

      <div className="pt-2">
        <h3 className="text-text-secondary text-xs uppercase tracking-wider mb-2">
          Зроблено разів:{" "}
          <span className="font-display text-text-primary">{dates.length}</span>
        </h3>
        <SessionCalendar dates={dates} />
      </div>
    </div>
  )
}

function SessionCalendar({ dates }: { dates: number[] }) {
  if (dates.length === 0) {
    return <p className="text-text-secondary text-xs">Поки немає сесій.</p>
  }
  const set = new Set(dates.map((d) => new Date(d).toDateString()))
  const today = new Date()
  const cells: { date: Date; done: boolean }[] = []
  for (let i = 41; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    cells.push({ date: d, done: set.has(d.toDateString()) })
  }
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {cells.map((c, i) => (
        <div
          key={i}
          title={c.date.toLocaleDateString("uk-UA")}
          className={`aspect-square rounded-sm ${
            c.done ? "bg-accent" : "bg-border"
          }`}
        />
      ))}
    </div>
  )
}
