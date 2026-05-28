import { useEffect } from "react"
import { SYNC_EVENT } from "@/db/sync"

export function useSyncRefresh(cb: () => void | Promise<void>): void {
  useEffect(() => {
    const handler = () => {
      void cb()
    }
    window.addEventListener(SYNC_EVENT, handler)
    return () => window.removeEventListener(SYNC_EVENT, handler)
  }, [cb])
}
