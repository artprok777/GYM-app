import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function App() {
  return (
    <div className="min-h-screen bg-bg text-text-primary flex items-center justify-center p-6">
      <Card className="bg-surface border-border p-6 space-y-4 max-w-sm w-full">
        <h1 className="font-display text-3xl text-accent">Gym Tracker</h1>
        <p className="text-text-secondary text-sm">shadcn/ui + Tailwind dark theme.</p>
        <div className="font-display text-4xl">82.5 кг × 5</div>
        <Button className="w-full bg-accent text-bg hover:bg-accent/90 h-12">
          Додати підхід
        </Button>
      </Card>
    </div>
  )
}
