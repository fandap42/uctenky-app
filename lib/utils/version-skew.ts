import { unstable_isUnrecognizedActionError } from "next/navigation"

const RELOAD_KEY = "version-skew-reload-at"
const MIN_RELOAD_INTERVAL_MS = 10_000

export function reloadIfVersionSkew(error: unknown): boolean {
  if (!unstable_isUnrecognizedActionError(error)) return false

  try {
    const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
    if (Date.now() - lastReload < MIN_RELOAD_INTERVAL_MS) return false
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {}

  window.location.reload()
  return true
}
