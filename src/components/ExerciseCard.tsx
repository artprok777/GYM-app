import { ArrowRight } from "lucide-react"
import type { ExerciseTemplate } from "@/db/schema"
import { cn } from "@/lib/utils"

export function ExerciseCard({
  exercise,
  loggedThisSession,
  onClick,
}: {
  exercise: ExerciseTemplate
  loggedThisSession: number
  onClick: () => void
}) {
  const isComplete = loggedThisSession >= exercise.targetSets
  const hasProgress = loggedThisSession > 0

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-xl border px-5 py-4",
        "transition-all active:scale-[0.985]",
        isComplete
          ? "bg-success/[0.05] border-success/25"
          : hasProgress
            ? "bg-accent/[0.06] border-accent/25"
            : "bg-surface border-border",
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="font-display font-medium text-text-primary text-[18px] leading-tight tracking-tight truncate">
            {exercise.name}
          </div>
          <dl className="space-y-1">
            <Row label="Підходи" value={String(exercise.targetSets)} />
            <Row
              label="Повтори"
              value={exercise.targetReps != null ? String(exercise.targetReps) : "—"}
            />
            <Row
              label="Вага"
              value={
                exercise.targetWeight != null ? `${exercise.targetWeight} кг` : "—"
              }
            />
          </dl>
        </div>
        <ArrowRight
          size={18}
          className={cn(
            "shrink-0 transition-transform group-active:translate-x-0.5",
            isComplete
              ? "text-success/70"
              : hasProgress
                ? "text-accent/70"
                : "text-text-secondary/50",
          )}
        />
      </div>
    </button>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="font-display text-[11px] uppercase tracking-[0.15em] text-text-secondary w-[60px] shrink-0">
        {label}
      </dt>
      <dd className="font-display text-[14px] text-text-primary tabular-nums">
        {value}
      </dd>
    </div>
  )
}
