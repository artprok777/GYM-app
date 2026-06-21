import { useCallback, useEffect, useMemo, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { db } from "@/db/client"
import {
  getExerciseHistory,
  getPersonalRecord,
  summarizeExerciseProgress,
  type ExerciseHistoryPoint,
} from "@/db/progress"
import { formatWeight } from "@/lib/format"
import { useSyncRefresh } from "@/hooks/useSyncRefresh"

const RANGES = [
  { label: "1 місяць", days: 30 },
  { label: "3 місяці", days: 90 },
  { label: "6 місяців", days: 180 },
  { label: "Весь час", days: 0 },
]

export function ProgressByExercise() {
  const [exercises, setExercises] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [range, setRange] = useState(RANGES[1])
  const [history, setHistory] = useState<ExerciseHistoryPoint[]>([])
  const [pr, setPr] = useState<number | null>(null)

  const loadExercises = useCallback(async () => {
    const sets = await db.loggedSets.toArray()
    const names = [...new Set(sets.map((s) => s.exerciseName))].sort()
    setExercises(names)
    setSelected((cur) => cur ?? names[0] ?? null)
  }, [])

  const loadHistory = useCallback(async () => {
    if (!selected) return
    const from = range.days > 0 ? Date.now() - range.days * 86400000 : undefined
    setHistory(await getExerciseHistory(selected, from))
    setPr(await getPersonalRecord(selected))
  }, [selected, range])

  useEffect(() => {
    loadExercises()
  }, [loadExercises])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useSyncRefresh(useCallback(async () => {
    await loadExercises()
    await loadHistory()
  }, [loadExercises, loadHistory]))

  const chartData = useMemo(
    () =>
      history.map((p) => ({
        date: new Date(p.date).toLocaleDateString("uk-UA", {
          day: "2-digit",
          month: "short",
        }),
        weight: p.maxWeight,
        load: p.totalVolume,
      })),
    [history],
  )
  const summary = useMemo(
    () => summarizeExerciseProgress(history, pr),
    [history, pr],
  )

  if (exercises.length === 0) {
    return (
      <p className="text-text-secondary text-sm py-8 text-center">
        Поки немає логів. Зроби тренування — і прогрес з'явиться тут.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex min-h-[52px] items-center gap-2 bg-surface border border-border px-3 rounded-md text-text-primary text-sm data-[state=open]:border-accent focus:outline-none">
            <span>{selected ?? "Вправа"}</span>
            <ChevronDown size={14} />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-surface border-border max-h-72 overflow-y-auto">
            {exercises.map((e) => (
              <DropdownMenuItem
                key={e}
                onClick={() => setSelected(e)}
                className="text-text-primary focus:bg-bg focus:text-text-primary"
              >
                {e}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex min-h-[52px] items-center gap-2 bg-surface border border-border px-3 rounded-md text-text-primary text-sm data-[state=open]:border-accent focus:outline-none">
            <span>{range.label}</span>
            <ChevronDown size={14} />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-surface border-border">
            {RANGES.map((r) => (
              <DropdownMenuItem
                key={r.label}
                onClick={() => setRange(r)}
                className="text-text-primary focus:bg-bg focus:text-text-primary"
              >
                {r.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-3 rounded-lg border border-border bg-surface divide-x divide-border overflow-hidden">
        <Metric label="PR" value={formatNullableWeight(summary.pr)} accent />
        <Metric
          label="Остання"
          value={formatNullableWeight(summary.latestWeight)}
        />
        <Metric
          label="Зміна"
          value={formatSignedWeight(summary.deltaWeight)}
          tone={summary.deltaWeight}
        />
      </div>

      <div>
        <h3 className="text-text-secondary text-xs uppercase tracking-wider mb-2">
          Максимальна вага
        </h3>
        <div className="h-56 bg-surface rounded-lg p-3 border border-border">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                stroke="#8A8A9A"
                fontSize={11}
                tickLine={false}
              />
              <YAxis stroke="#8A8A9A" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161618",
                  border: "1px solid #2A2A30",
                  fontFamily: "DM Mono",
                  color: "#F8F8F8",
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#F5A623"
                strokeWidth={2}
                dot={{ fill: "#F5A623", r: 3 }}
                animationDuration={600}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-text-secondary text-xs uppercase tracking-wider mb-2">
          Навантаження
        </h3>
        <p className="text-text-secondary text-xs mb-2">вага × повтори</p>
        <div className="h-40 bg-surface rounded-lg p-3 border border-border">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                stroke="#8A8A9A"
                fontSize={11}
                tickLine={false}
              />
              <YAxis stroke="#8A8A9A" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161618",
                  border: "1px solid #2A2A30",
                  fontFamily: "DM Mono",
                  color: "#F8F8F8",
                }}
              />
              <Line
                type="monotone"
                dataKey="load"
                stroke="#F8F8F8"
                strokeWidth={1.5}
                dot={{ fill: "#F8F8F8", r: 2 }}
                animationDuration={600}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  accent = false,
  tone,
}: {
  label: string
  value: string
  accent?: boolean
  tone?: number | null
}) {
  const valueColor = accent
    ? "text-accent"
    : tone == null || tone === 0
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

function formatNullableWeight(value: number | null): string {
  return value == null ? "—" : `${formatWeight(value)} кг`
}

function formatSignedWeight(value: number | null): string {
  if (value == null) return "—"
  const sign = value > 0 ? "+" : ""
  return `${sign}${formatWeight(value)} кг`
}
