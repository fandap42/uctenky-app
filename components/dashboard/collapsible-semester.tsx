"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface CollapsibleSemesterProps {
  semesterKey: string
  fetchData: () => Promise<any>
  renderContent: (data: any) => React.ReactNode
  initialData?: any
  defaultExpanded?: boolean
  headerExtra?: React.ReactNode
}

export function CollapsibleSemester({
  semesterKey,
  fetchData,
  renderContent,
  initialData,
  defaultExpanded = false,
  headerExtra,
}: CollapsibleSemesterProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [data, setData] = useState<any>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isExpanded && !data && !isLoading) {
      loadData()
    }
  }, [isExpanded])

  useEffect(() => {
    const handleRefresh = () => {
      if (isExpanded) {
        loadData()
      } else {
        // If not expanded, just clear data so it refetches when expanded next time
        setData(null)
      }
    }

    window.addEventListener("app-data-refresh", handleRefresh)
    return () => window.removeEventListener("app-data-refresh", handleRefresh)
  }, [isExpanded])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetchData()
      if (result.error) {
        setError(result.error)
      } else {
        setData(result)
      }
    } catch (err) {
      setError("Nepodařilo se načíst data")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div 
        className="flex items-center gap-4 cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={cn(
          "flex items-center gap-2 text-2xl font-bold bg-primary px-4 py-1 rounded-lg text-primary-foreground transition-all",
          !isExpanded && "bg-muted text-muted-foreground opacity-70 group-hover:opacity-100"
        )}>
          {semesterKey}
          <ChevronDown className={cn(
            "w-6 h-6 transition-transform duration-300",
            isExpanded ? "rotate-0" : "-rotate-90"
          )} />
        </div>
        {headerExtra && <div className="flex-1 flex justify-end">{headerExtra}</div>}
        <div className="h-px flex-1 bg-border" />
      </div>

      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          {isLoading ? (
            <div className="py-12 flex justify-center items-center gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Načítání...</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-destructive font-medium">
              {error}
              <button 
                onClick={loadData}
                className="ml-4 text-sm underline hover:no-underline"
              >
                Zkusit znovu
              </button>
            </div>
          ) : data ? (
            renderContent(data)
          ) : null}
        </div>
      )}
    </div>
  )
}
