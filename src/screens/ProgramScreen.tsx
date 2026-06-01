import { useState } from "react"
import { ProgramEditor } from "./ProgramEditor"
import { ExerciseEditor } from "./ExerciseEditor"
import { ExerciseDetail } from "./ExerciseDetail"

export default function ProgramScreen() {
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)

  if (selectedExercise) {
    return (
      <ExerciseDetail
        exerciseId={selectedExercise}
        onBack={() => setSelectedExercise(null)}
      />
    )
  }

  if (selectedWorkoutType) {
    return (
      <ExerciseEditor
        workoutTypeId={selectedWorkoutType}
        onBack={() => setSelectedWorkoutType(null)}
        onSelectExercise={setSelectedExercise}
      />
    )
  }

  return (
    <div className="px-5 py-6 pb-12 space-y-8">
      <div>
        <p className="font-display text-[11px] uppercase tracking-[0.2em] text-text-secondary mb-1.5">
          Налаштування
        </p>
        <h1 className="font-display text-[34px] leading-none font-medium tracking-tight">
          Програма
        </h1>
      </div>

      <ProgramEditor onSelectWorkoutType={setSelectedWorkoutType} />
    </div>
  )
}
