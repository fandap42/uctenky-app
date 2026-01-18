"use client"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface BudgetProgressProps {
  sectionName: string
  budgetCap: number
  spent: number
  pending: number
  action?: React.ReactNode
}

export function BudgetProgress({
  sectionName,
  budgetCap,
  spent,
  pending,
  action,
}: BudgetProgressProps) {
  const spentPercentage = budgetCap > 0 ? (spent / budgetCap) * 100 : 0
  const pendingPercentage = budgetCap > 0 ? (pending / budgetCap) * 100 : 0
  const totalPercentage = spentPercentage + pendingPercentage
  const remaining = budgetCap - spent - pending

  const getProgressColor = () => {
    if (totalPercentage >= 100) return "bg-red-500"
    if (totalPercentage >= 80) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{sectionName}</span>
          {action}
        </div>
        <span className="text-sm text-slate-400">
          {spent.toLocaleString("cs-CZ")} / {budgetCap.toLocaleString("cs-CZ")} Kč
        </span>
      </div>
      
      {/* Custom stacked progress bar */}
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden flex">
        {/* Spent amount */}
        <div
          className={cn("h-full transition-all duration-500", getProgressColor())}
          style={{ width: `${Math.min(spentPercentage, 100)}%` }}
        />
        {/* Pending amount */}
        {pending > 0 && (
          <div
            className="h-full bg-yellow-500/50 transition-all duration-500"
            style={{ width: `${Math.min(pendingPercentage, 100 - spentPercentage)}%` }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={cn("w-2.5 h-2.5 rounded-full", getProgressColor())} />
            <span className="text-slate-400">
              Vyčerpáno: {spent.toLocaleString("cs-CZ")} Kč
            </span>
          </div>
          {pending > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <span className="text-slate-400">
                Čeká: {pending.toLocaleString("cs-CZ")} Kč
              </span>
            </div>
          )}
        </div>
        <span
          className={cn(
            "font-medium",
            remaining < 0 ? "text-red-400" : "text-green-400"
          )}
        >
          Zbývá: {remaining.toLocaleString("cs-CZ")} Kč
        </span>
      </div>
    </div>
  )
}
