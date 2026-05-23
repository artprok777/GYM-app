import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ProgressByExercise } from "./ProgressByExercise"
import { ProgressByWorkout } from "./ProgressByWorkout"
import { ProgressOverall } from "./ProgressOverall"

export default function ProgressScreen() {
  const [tab, setTab] = useState("exercise")

  return (
    <div className="p-6 pb-24 space-y-4">
      <h1 className="font-display text-3xl">Прогрес</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-surface border border-border w-full grid grid-cols-3 h-11">
          <TabsTrigger
            value="exercise"
            className="data-[state=active]:bg-accent data-[state=active]:text-bg text-text-secondary"
          >
            По вправі
          </TabsTrigger>
          <TabsTrigger
            value="workout"
            className="data-[state=active]:bg-accent data-[state=active]:text-bg text-text-secondary"
          >
            По тренуванню
          </TabsTrigger>
          <TabsTrigger
            value="overall"
            className="data-[state=active]:bg-accent data-[state=active]:text-bg text-text-secondary"
          >
            Загальний
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exercise" className="mt-4">
          <ProgressByExercise />
        </TabsContent>
        <TabsContent value="workout" className="mt-4">
          <ProgressByWorkout />
        </TabsContent>
        <TabsContent value="overall" className="mt-4">
          <ProgressOverall />
        </TabsContent>
      </Tabs>
    </div>
  )
}
