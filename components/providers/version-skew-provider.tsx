"use client"

import { useEffect } from "react"
import { reloadIfVersionSkew } from "@/lib/utils/version-skew"

export function VersionSkewProvider() {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (reloadIfVersionSkew(event.reason)) {
        event.preventDefault()
      }
    }

    window.addEventListener("unhandledrejection", handleRejection)
    return () => window.removeEventListener("unhandledrejection", handleRejection)
  }, [])

  return null
}
