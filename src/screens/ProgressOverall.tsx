import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { Card } from "@/components/ui/card"
import { getSessionsByWeek, type WeekStat } from "@/db/progress"
import { db } from "@/db/client"

export function ProgressOverall() {
  const [weeks, setWeeks] = useState<WeekStat[]>([])
  const [totalSessions, setTotalSessions] = useState(0)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    ;(async () => {
      const w = await getSessionsByWeek()
      setWeeks(w.slice(-12))
      const sessions = await db.sessions.count()
      setTotalSessions(sessions)
      setStreak(computeStreak(w))
    })()
  }, [])

  const chartData = weeks.map((w) => ({
    week: new Date(w.weekStart).toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "short",
    }),
    count: w.count,
  }))

  if (totalSessions === 0) {
    return (
      <p className="text-text-secondary text-sm py-8 text-center">
        Поки немає тренувань. Зроби перше — і побачиш загальну картину.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Всього тренувань" value={String(totalSessions)} />
        <StatCard label="Серія тижнів" value={String(streak)} />
      </div>

      <div>
        <h3 className="text-text-secondary text-xs uppercase tracking-wider mb-2">
          Тренувань на тиждень
        </h3>
        <div className="h-56 bg-surface rounded-lg p-3 border border-border">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="week"
                stroke="#8A8A9A"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#8A8A9A"
                fontSize={11}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161618",
                  border: "1px solid #2A2A30",
                  fontFamily: "DM Mono",
                  color: "#F8F8F8",
                }}
              />
              <Bar dataKey="count" fill="#F5A623" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-surface border-border p-4">
      <div className="text-text-secondary text-xs uppercase tracking-wider">
        {label}
      </div>
      <div className="font-display text-3xl mt-1 text-text-primary">{value}</div>
    </Card>
  )
}

function computeStreak(weeks: WeekStat[]): number {
  if (weeks.length === 0) return 0
  let streak = 0
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].count > 0) streak++
    else break
  }
  return streak
}
