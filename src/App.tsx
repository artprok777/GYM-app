import { useState } from "react"
import { TabBar, type Tab } from "./components/TabBar"
import TodayScreen from "./screens/TodayScreen"
import ProgramScreen from "./screens/ProgramScreen"
import ProgressScreen from "./screens/ProgressScreen"

export default function App() {
  const [tab, setTab] = useState<Tab>("today")

  return (
    <div className="min-h-screen bg-bg text-text-primary pb-16">
      {tab === "today" && <TodayScreen />}
      {tab === "program" && <ProgramScreen />}
      {tab === "progress" && <ProgressScreen />}
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
