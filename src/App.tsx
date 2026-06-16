import { lazy, Suspense, useEffect, useState } from "react"
import { TabBar, type Tab } from "./components/TabBar"
import TodayScreen from "./screens/TodayScreen"
import { bootstrap, startSync } from "./db/sync"

const ProgramScreen = lazy(() => import("./screens/ProgramScreen"))
const ProgressScreen = lazy(() => import("./screens/ProgressScreen"))

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
        <Suspense fallback={<div className="px-5 py-6 text-text-secondary" />}>
          {tab === "program" && <ProgramScreen />}
          {tab === "progress" && <ProgressScreen />}
        </Suspense>
      </main>
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
