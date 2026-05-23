import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ProgressByExercise } from "./ProgressByExercise"
import { ProgressByWorkout } from "./ProgressByWorkout"
import { ProgressOverall } from "./ProgressOverall"

export default function ProgressScreen() {
  const [tab, setTab] = useState("exercise")

  return (
    <div className="px-5 py-6 pb-12 space-y-6">
      <div>
        <p className="font-display text-[11px] uppercase tracking-[0.2em] text-text-secondary mb-1.5">
          Аналітика
        </p>
        <h1 className="font-display text-[34px] leading-none font-medium tracking-tight">
          Прогрес
        </h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-surface border border-border w-full grid grid-cols-3 h-11 p-1 rounded-xl">
          <TabsTrigger
            value="exercise"
            className="data-[state=active]:bg-accent data-[state=active]:text-bg text-text-secondary rounded-lg text-[13px] font-medium"
          >
            Вправа
          </TabsTrigger>
          <TabsTrigger
            value="workout"
            className="data-[state=active]:bg-accent data-[state=active]:text-bg text-text-secondary rounded-lg text-[13px] font-medium"
          >
            Тренування
          </TabsTrigger>
          <TabsTrigger
            value="overall"
            className="data-[state=active]:bg-accent data-[state=active]:text-bg text-text-secondary rounded-lg text-[13px] font-medium"
          >
            Загалом
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exercise" className="mt-5">
          <ProgressByExercise />
        </TabsContent>
        <TabsContent value="workout" className="mt-5">
          <ProgressByWorkout />
        </TabsContent>
        <TabsContent value="overall" className="mt-5">
          <ProgressOverall />
        </TabsContent>
      </Tabs>
    </div>
  )
}
