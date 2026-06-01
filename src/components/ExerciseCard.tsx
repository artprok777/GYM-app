import { ArrowRight, Check } from "lucide-react"
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
          ? "bg-success/[0.12] border-success/60 shadow-[inset_0_0_0_1px_rgba(74,222,128,0.15)]"
          : hasProgress
            ? "bg-accent/[0.10] border-accent/45"
            : "bg-surface border-border",
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={cn(
                "font-display font-medium text-[18px] leading-tight tracking-tight truncate",
                isComplete ? "text-success" : "text-text-primary",
              )}
            >
              {exercise.name}
            </div>
            {isComplete && (
              <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-success/15 border border-success/40 px-2 py-0.5 font-display text-[10px] uppercase tracking-[0.12em] text-success">
                <Check size={11} strokeWidth={3} /> Готово
              </span>
            )}
          </div>
          <dl className="flex items-baseline gap-x-5 gap-y-1 flex-wrap">
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
        {isComplete ? (
          <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-success/20 border border-success/50">
            <Check size={16} strokeWidth={2.5} className="text-success" />
          </div>
        ) : (
          <ArrowRight
            size={18}
            className={cn(
              "shrink-0 transition-transform group-active:translate-x-0.5",
              hasProgress ? "text-accent/80" : "text-text-secondary/50",
            )}
          />
        )}
      </div>
    </button>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="font-display text-[11px] uppercase tracking-[0.15em] text-text-secondary">
        {label}
      </dt>
      <dd className="font-display text-[14px] text-text-primary tabular-nums">
        {value}
      </dd>
    </div>
  )
}
