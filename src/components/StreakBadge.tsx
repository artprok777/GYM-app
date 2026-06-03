import { useState, useEffect, useCallback } from "react"
import { Flame } from "lucide-react"
import { getCurrentStreak } from "@/db/progress"
import { useSyncRefresh } from "@/hooks/useSyncRefresh"

function pluralize(n: number): string {
  if (n === 1) return "день"
  if (n >= 2 && n <= 4) return "дні"
  return "днів"
}

export function StreakBadge() {
  const [streak, setStreak] = useState(0)

  const refresh = useCallback(async () => {
    setStreak(await getCurrentStreak())
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  useSyncRefresh(refresh)

  if (streak === 0) return null

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Flame size={15} className="text-accent fill-accent/20" />
      <span className="font-display text-[15px] text-text-primary tabular-nums leading-none">
        {streak}
      </span>
      <span className="font-display text-[10px] uppercase tracking-wider text-text-secondary leading-none">
        {pluralize(streak)}
      </span>
    </div>
  )
}
