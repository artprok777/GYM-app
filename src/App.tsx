import { useState, useEffect } from "react"
import { TabBar, type Tab } from "./components/TabBar"
import TodayScreen from "./screens/TodayScreen"
import ProgramScreen from "./screens/ProgramScreen"
import ProgressScreen from "./screens/ProgressScreen"
import { bootstrap, startSync } from "./db/sync"

export default function App() {
  const [tab, setTab] = useState<Tab>("today")

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload()
      })
    }
  }, [])

  useEffect(() => {
    let cleanup: (() => void) | undefined
    bootstrap()
      .catch((e) => console.error("[sync] bootstrap failed", e))
      .finally(() => {
        cleanup = startSync()
      })
    return () => cleanup?.()
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
