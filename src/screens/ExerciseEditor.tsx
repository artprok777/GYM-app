import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export function ExerciseEditor({
  workoutTypeId,
  onBack,
}: {
  workoutTypeId: string
  onBack: () => void
}) {
  return (
    <div className="p-6 space-y-4">
      <Button variant="ghost" onClick={onBack} className="-ml-2 text-text-primary">
        <ChevronLeft size={18} /> Назад
      </Button>
      <p className="text-text-secondary">Workout: {workoutTypeId}</p>
    </div>
  )
}
