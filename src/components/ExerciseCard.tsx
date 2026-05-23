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
        "group w-full text-left rounded-xl border bg-surface px-4 py-4",
        "transition-all active:scale-[0.985]",
        isComplete
          ? "border-success/25"
          : hasProgress
            ? "border-accent/30"
            : "border-border",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-1 self-stretch rounded-full",
            isComplete
              ? "bg-success"
              : hasProgress
                ? "bg-accent"
                : "bg-border",
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="font-sans font-medium text-text-primary text-[17px] leading-tight">
            {exercise.name}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="font-display text-[10px] uppercase tracking-wider text-text-secondary">
              Останній раз
            </span>
            <span className="font-display text-[13px] text-text-primary">
              {formatLastSession(lastSets)}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0 flex items-center gap-2">
          <div>
            <div
              className={cn(
                "font-display text-xl leading-none",
                isComplete
                  ? "text-success"
                  : hasProgress
                    ? "text-accent"
                    : "text-text-secondary",
              )}
            >
              {loggedThisSession}
              <span className="text-text-secondary text-base">
                /{exercise.targetSets}
              </span>
            </div>
            <div className="font-display text-[9px] uppercase tracking-wider text-text-secondary mt-1">
              підх
            </div>
          </div>
          <ChevronRight
            size={18}
            className="text-text-secondary group-active:translate-x-0.5 transition-transform"
          />
        </div>
      </div>
    </button>
  )
}
