import { Card } from "@/components/ui/card"
import { formatLastSession } from "@/lib/format"
import type { ExerciseTemplate, LoggedSet } from "@/db/schema"

export function ExerciseCard({
  exercise,
  lastSets,
  loggedThisSession,
  onClick,
}: {
  exercise: ExerciseTemplate
  lastSets: LoggedSet[]
  loggedThisSession: number
  onClick: () => void
}) {
  const isComplete = loggedThisSession >= exercise.targetSets

  return (
    <Card
      onClick={onClick}
      className="bg-surface border-border p-4 cursor-pointer active:scale-[0.99] transition-transform min-h-[80px]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg text-text-primary">{exercise.name}</div>
          <div className="text-text-secondary text-sm mt-1">
            Минулого разу:{" "}
            <span className="font-display">{formatLastSession(lastSets)}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div
            className={`font-display text-sm ${
              isComplete ? "text-success" : "text-text-secondary"
            }`}
          >
            {loggedThisSession}/{exercise.targetSets}
          </div>
          <div className="text-text-secondary text-xs">підх.</div>
        </div>
      </div>
    </Card>
  )
}
