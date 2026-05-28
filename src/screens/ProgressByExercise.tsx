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
import { Badge } from "@/components/ui/badge"
import { ChevronDown } from "lucide-react"
import { db } from "@/db/client"
import {
  getExerciseHistory,
  getPersonalRecord,
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
        volume: p.totalVolume,
      })),
    [history],
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
          <DropdownMenuTrigger className="flex items-center gap-2 bg-surface border border-border h-10 px-3 rounded-md text-text-primary text-sm data-[state=open]:border-accent focus:outline-none">
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
          <DropdownMenuTrigger className="flex items-center gap-2 bg-surface border border-border h-10 px-3 rounded-md text-text-primary text-sm data-[state=open]:border-accent focus:outline-none">
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

      {pr !== null && (
        <Badge className="bg-accent-muted text-accent border-0 font-display text-base px-3 py-1.5">
          PR: {formatWeight(pr)} кг
        </Badge>
      )}

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
          Об'єм
        </h3>
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
                dataKey="volume"
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
