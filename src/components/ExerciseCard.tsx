import { ChevronRight } from "lucide-react"
import { formatLastSession } from "@/lib/format"
import type { ExerciseTemplate, LoggedSet } from "@/db/schema"
import { cn } from "@/lib/utils"

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
  const hasProgress = loggedThisSession > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-xl border px-4 py-4",
        "transition-all active:scale-[0.985]",
        isComplete
          ? "bg-success/[0.05] border-success/25"
          : hasProgress
            ? "bg-accent/[0.06] border-accent/25"
            : "bg-surface border-border",
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="font-display font-medium text-text-primary text-[18px] leading-tight tracking-tight truncate">
            {exercise.name}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-display text-[10px] uppercase tracking-[0.15em] text-text-secondary">
              Минулого
            </span>
            <span className="font-display text-[13px] text-text-primary">
              {formatLastSession(lastSets)}
            </span>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2.5">
          <div className="text-right leading-none">
            <div
              className={cn(
                "font-display text-[30px] leading-none tabular-nums",
                isComplete
                  ? "text-success"
                  : hasProgress
                    ? "text-accent"
                    : "text-text-secondary",
              )}
            >
              {loggedThisSession}
            </div>
            <div className="font-display text-[11px] text-text-secondary mt-1">
              / {exercise.targetSets}
              {exercise.targetReps ? ` × ${exercise.targetReps}` : ""} підх
            </div>
          </div>
          <ChevronRight
            size={16}
            className="text-text-secondary/40 group-active:translate-x-0.5 transition-transform"
          />
        </div>
      </div>
    </button>
  )
}
