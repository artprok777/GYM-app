import { useState, useEffect } from "react"
import { TabBar, type Tab } from "./components/TabBar"
import TodayScreen from "./screens/TodayScreen"
import ProgramScreen from "./screens/ProgramScreen"
import ProgressScreen from "./screens/ProgressScreen"

export default function App() {
  const [tab, setTab] = useState<Tab>("today")

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload()
      })
    }
  }, [])

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <main
        className="pb-[calc(env(safe-area-inset-bottom)+5rem)]"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {tab === "today" && <TodayScreen />}
        {tab === "program" && <ProgramScreen />}
        {tab === "progress" && <ProgressScreen />}
      </main>
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
