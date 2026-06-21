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
  summarizeWorkoutProgress,
  type WorkoutProgressSummary,
} from "@/db/progress"
import type { WorkoutType } from "@/db/schema"
import { formatWeight } from "@/lib/format"
import { useSyncRefresh } from "@/hooks/useSyncRefresh"

const EMPTY_SUMMARY: WorkoutProgressSummary = {
  sessionCount: 0,
  progressExerciseCount: 0,
  biggestGain: null,
  rows: [],
}

export function ProgressByWorkout() {
  const [types, setTypes] = useState<WorkoutType[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [summary, setSummary] = useState<WorkoutProgressSummary>(EMPTY_SUMMARY)

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
    const sessionDates = await getSessionDatesForWorkoutType(selectedId)
    setSummary(summarizeWorkoutProgress(progress, sessionDates))
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
        <DropdownMenuTrigger className="flex min-h-[52px] items-center gap-2 bg-surface border border-border px-3 rounded-md text-text-primary text-sm data-[state=open]:border-accent focus:outline-none">
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

      {summary.rows.length === 0 ? (
        <p className="text-text-secondary text-sm py-8 text-center">
          Зроби це тренування хоча б раз, щоб побачити прогрес.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 rounded-lg border border-border bg-surface divide-x divide-border overflow-hidden">
            <Metric label="Сесій" value={String(summary.sessionCount)} />
            <Metric
              label="Вправ"
              value={String(summary.progressExerciseCount)}
            />
            <Metric
              label="Топ приріст"
              value={formatSignedWeight(summary.biggestGain?.deltaWeight ?? null)}
              tone={summary.biggestGain?.deltaWeight ?? null}
            />
          </div>

          <div className="space-y-2">
            {summary.rows.map((r) => {
              const Icon =
                r.deltaWeight > 0
                  ? ArrowUp
                  : r.deltaWeight < 0
                    ? ArrowDown
                    : ArrowRight
              const color =
                r.deltaWeight > 0
                  ? "text-success"
                  : r.deltaWeight < 0
                    ? "text-destructive"
                    : "text-text-secondary"
              return (
                <Card
                  key={r.exerciseName}
                  className="bg-surface border-border p-3 min-h-[84px]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-display flex-1 text-text-primary min-w-0 truncate">
                      {r.exerciseName}
                    </span>
                    <span
                      className={`font-display flex items-center gap-1 ${color} shrink-0 tabular-nums`}
                    >
                      <Icon size={14} />
                      {formatSignedWeight(r.deltaWeight)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                    <span className="font-display text-text-secondary tabular-nums">
                      {formatWeight(r.firstWeight)} → {formatWeight(r.latestWeight)} кг
                    </span>
                    <span className={`font-display ${color} tabular-nums`}>
                      {formatPercent(r.deltaPercent)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-text-secondary">
                    {formatShortDate(r.firstDate)} → {formatShortDate(r.latestDate)}
                  </p>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: number | null
}) {
  const valueColor =
    tone == null || tone === 0
      ? "text-text-primary"
      : tone > 0
        ? "text-success"
        : "text-destructive"

  return (
    <div className="min-h-[72px] px-3 py-3">
      <p className="font-display text-[10px] uppercase tracking-[0.2em] text-text-secondary">
        {label}
      </p>
      <p className={`font-display text-xl leading-none tabular-nums mt-2 ${valueColor}`}>
        {value}
      </p>
    </div>
  )
}

function formatSignedWeight(value: number | null): string {
  if (value == null) return "—"
  const sign = value > 0 ? "+" : ""
  return `${sign}${formatWeight(value)} кг`
}

function formatPercent(value: number | null): string {
  if (value == null) return "—"
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(0)}%`
}

function formatShortDate(ts: number): string {
  return new Date(ts).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "short",
  })
}
