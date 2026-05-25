import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
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
    <div className="space-y-6">
      <div className="flex gap-8">
        <div>
          <p className="font-display text-[10px] uppercase tracking-[0.2em] text-text-secondary">
            Всього тренувань
          </p>
          <p className="font-display text-[48px] leading-none tabular-nums text-text-primary mt-1">
            {totalSessions}
          </p>
        </div>
        <div>
          <p className="font-display text-[10px] uppercase tracking-[0.2em] text-text-secondary">
            Серія тижнів
          </p>
          <p className={`font-display text-[48px] leading-none tabular-nums mt-1 ${streak > 0 ? "text-accent" : "text-text-primary"}`}>
            {streak}
          </p>
        </div>
      </div>

      <div>
        <p className="font-display text-[10px] uppercase tracking-[0.2em] text-text-secondary mb-3">
          Тренувань на тиждень
        </p>
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

function computeStreak(weeks: WeekStat[]): number {
  if (weeks.length === 0) return 0
  let streak = 0
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].count > 0) streak++
    else break
  }
  return streak
}
