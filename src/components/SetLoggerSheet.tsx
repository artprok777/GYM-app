import type { ExerciseTemplate } from "@/db/schema"

export function SetLoggerSheet({
  exercise,
  sessionId,
  onClose,
}: {
  exercise: ExerciseTemplate
  sessionId: string
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full p-6 rounded-t-2xl text-text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        <p>
          Logger placeholder for {exercise.name}, session {sessionId}
        </p>
      </div>
    </div>
  )
}
