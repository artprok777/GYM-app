import { useState } from "react"
import { ProgramEditor } from "./ProgramEditor"
import { ExerciseEditor } from "./ExerciseEditor"
import { ScheduleEditor } from "./ScheduleEditor"

export default function ProgramScreen() {
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string | null>(null)

  if (selectedWorkoutType) {
    return (
      <ExerciseEditor
        workoutTypeId={selectedWorkoutType}
        onBack={() => setSelectedWorkoutType(null)}
      />
    )
  }

  return (
    <div className="p-6 pb-24 space-y-6">
      <ProgramEditor onSelectWorkoutType={setSelectedWorkoutType} />
      <ScheduleEditor />
    </div>
  )
}
