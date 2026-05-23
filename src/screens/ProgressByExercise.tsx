import { useEffect, useMemo, useState } from "react"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown } from "lucide-react"
import { db } from "@/db/client"
import {
  getExerciseHistory,
  getPersonalRecord,
  type ExerciseHistoryPoint,
} from "@/db/progress"
import { formatWeight } from "@/lib/format"

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

  useEffect(() => {
    db.loggedSets.toArray().then((sets) => {
      const names = [...new Set(sets.map((s) => s.exerciseName))].sort()
      setExercises(names)
      if (!selected && names[0]) setSelected(names[0])
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    const from = range.days > 0 ? Date.now() - range.days * 86400000 : undefined
    getExerciseHistory(selected, from).then(setHistory)
    getPersonalRecord(selected).then(setPr)
  }, [selected, range])

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
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="bg-surface border-border h-10 text-text-primary"
            >
              {selected ?? "Вправа"}{" "}
              <ChevronDown size={14} className="ml-2" />
            </Button>
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
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="bg-surface border-border h-10 text-text-primary"
            >
              {range.label} <ChevronDown size={14} className="ml-2" />
            </Button>
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
