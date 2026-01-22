"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OverviewTable } from "@/components/pokladna/overview-table"
import { getBalanceAtDate } from "@/lib/actions/cash-register"
import { AlertCircle, Wallet, History, Pencil, FileDown, Plus } from "lucide-react"
import { DepositDialog } from "@/components/pokladna/deposit-dialog"
import { DebtErrorDialog } from "@/components/pokladna/debt-error-dialog"
import { CashOnHandDialog } from "@/components/pokladna/cash-on-hand-dialog"
import { HistoryDialog } from "@/components/pokladna/history-dialog"
import { CashRegisterExport } from "@/components/pokladna/cash-register-export"
import { getSemester } from "@/lib/utils/semesters"
import { cn } from "@/lib/utils"

interface PokladnaClientProps {
  initialBalance: number
  unpaidCount: number
  currentUsers: any[]
  registerData: any
}

const MONTH_NAMES = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
]

export function PokladnaClient({ 
  initialBalance, 
  unpaidCount, 
  currentUsers,
  registerData 
}: PokladnaClientProps) {
  const [balance, setBalance] = useState(initialBalance)
  const [showDebtError, setShowDebtError] = useState(false)
  const [showCashOnHand, setShowCashOnHand] = useState(false)
  const [showDebtHistory, setShowDebtHistory] = useState(false)
  const [showCashHistory, setShowCashHistory] = useState(false)

  // Group data by Semester and then by Month
  const semesterGroups = useMemo(() => {
    const semesters: Record<string, Record<string, { 
      monthName: string, 
      month: number,
      year: number, 
      transactions: any[], 
      deposits: any[],
      sortKey: number,
      endBalance: number,
      startBalance: number
    }>> = {}

    const allData = [
      ...registerData.transactions.map((t: any) => ({ ...t, displayDate: new Date(t.dueDate || t.createdAt), type: 'TR', amount: -(t.finalAmount || t.estimatedAmount) })),
      ...registerData.deposits.map((d: any) => ({ ...d, displayDate: new Date(d.date), type: 'DEP', amount: d.amount }))
    ].sort((a, b) => a.displayDate.getTime() - b.displayDate.getTime())

    let runningBalance = 0
    
    allData.forEach(item => {
      const startBalance = runningBalance
      runningBalance += Number(item.amount)
      
      const date = item.displayDate
      const month = date.getMonth()
      const year = date.getFullYear()
      const semKey = getSemester(date)
      const monthKey = `${year}-${month}`

      if (!semesters[semKey]) semesters[semKey] = {}
      if (!semesters[semKey][monthKey]) {
        semesters[semKey][monthKey] = {
          monthName: MONTH_NAMES[month],
          month: month + 1,
          year,
          transactions: [],
          deposits: [],
          sortKey: year * 100 + month,
          endBalance: 0,
          startBalance: startBalance
        }
      }

      if (item.type === 'TR') {
        semesters[semKey][monthKey].transactions.push(item)
      } else {
        semesters[semKey][monthKey].deposits.push(item)
      }
      
      semesters[semKey][monthKey].endBalance = runningBalance
    })

    // Transform into sorted array structure
    const sortedSemesters = Object.entries(semesters)
      .map(([semKey, months]) => ({
        semKey,
        months: Object.values(months).sort((a, b) => b.sortKey - a.sortKey)
      }))
      .sort((a, b) => {
        // Sort semesters (standard logic from SemesterStructuredList)
        const yearA = parseInt(a.semKey.slice(2))
        const yearB = parseInt(b.semKey.slice(2))
        if (yearA !== yearB) return yearB - yearA
        return b.semKey.charAt(0).localeCompare(a.semKey.charAt(0))
      })

    return sortedSemesters
  }, [registerData.transactions, registerData.deposits])

  return (
    <div className="space-y-8 pb-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Správa pokladny a přehled financí</h1>
        </div>
        <div className="flex items-center gap-3">
          <DepositDialog />
        </div>
      </div>

      {/* Top Cards Grid - Single Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[160px]">
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Reálná pokladna</h3>
            <div className="text-xs text-muted-foreground font-medium">
              Aktuální zůstatek - Dluh z chyb - Hotovost
            </div>
            {unpaidCount > 0 && (
              <div className="flex items-center gap-2 text-warning font-black text-sm">
                <AlertCircle className="w-4 h-4" />
                Neproplacených: {unpaidCount}
              </div>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-4xl font-black text-foreground tabular-nums">
              {registerData.realCash.toLocaleString("cs-CZ")}
            </span>
            <span className="text-xl font-bold text-muted-foreground">Kč</span>
          </div>
        </Card>

        <Card className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[160px]">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Aktuální zůstatek</h3>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-4xl font-black text-foreground tabular-nums">
              {registerData.currentBalance.toLocaleString("cs-CZ")}
            </span>
            <span className="text-xl font-bold text-muted-foreground">Kč</span>
          </div>
        </Card>

        <Card className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 flex flex-col min-h-[160px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Dluh z chyb</h3>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDebtHistory(true)}
                className="text-muted-foreground hover:text-foreground font-bold text-xs flex items-center gap-1 h-6 px-1"
              >
                <History className="w-3 h-3" />
                Historie
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDebtError(true)}
                className="border-border rounded-xl font-bold text-xs flex items-center gap-1 h-7 px-2"
              >
                <Pencil className="w-2.5 h-2.5" />
                Upravit
              </Button>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-3xl font-black text-foreground tabular-nums">
              {registerData.totalDebtErrors.toLocaleString("cs-CZ")}
            </span>
            <span className="text-lg font-bold text-muted-foreground">Kč</span>
          </div>
        </Card>

        <Card className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 flex flex-col min-h-[160px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Hotovost</h3>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCashHistory(true)}
                className="text-muted-foreground hover:text-foreground font-bold text-xs flex items-center gap-1 h-6 px-1"
              >
                <History className="w-3 h-3" />
                Historie
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowCashOnHand(true)}
                className="border-border rounded-xl font-bold text-xs flex items-center gap-1 h-7 px-2"
              >
                <Pencil className="w-2.5 h-2.5" />
                Upravit
              </Button>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-3xl font-black text-foreground tabular-nums">
              {registerData.totalCashOnHand.toLocaleString("cs-CZ")}
            </span>
            <span className="text-lg font-bold text-muted-foreground">Kč</span>
          </div>
        </Card>
      </div>

      {/* Semester Sections */}
      <div className="space-y-16">
        {semesterGroups.map((semester) => (
          <div key={semester.semKey} className="space-y-10">
            {/* Semester Header */}
            <div className="flex items-center gap-6">
              <h2 className="text-3xl font-black text-foreground bg-primary px-6 py-2 rounded-2xl text-primary-foreground">
                {semester.semKey}
              </h2>
              <div className="h-0.5 flex-1 bg-border/60" />
            </div>

            {/* Monthly Groups within Semester */}
            <div className="space-y-12">
              {semester.months.map((group) => (
                <div key={`${group.year}-${group.monthName}`} className="space-y-4">
                  <div className="flex items-center justify-between px-4">
                    <div className="flex items-baseline gap-3">
                      <h3 className="text-2xl font-black text-foreground">{group.monthName}</h3>
                      <div className="text-sm font-medium text-muted-foreground">
                        Zůstatek na konci měsíce: <span className="text-foreground font-black">{group.endBalance.toLocaleString("cs-CZ")} Kč</span>
                      </div>
                    </div>
                    <CashRegisterExport 
                      transactions={group.transactions}
                      deposits={group.deposits}
                      beginningBalance={group.startBalance}
                      endingBalance={group.endBalance}
                      year={group.year}
                      month={group.month}
                    />
                  </div>
                  
                  <OverviewTable 
                    transactions={group.transactions} 
                    deposits={group.deposits} 
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {semesterGroups.length === 0 && (
          <div className="py-20 text-center text-muted-foreground italic font-medium">
            Žádné pokladní záznamy k zobrazení
          </div>
        )}
      </div>

      {/* Dialogs */}
      <DebtErrorDialog 
        open={showDebtError} 
        onOpenChange={setShowDebtError} 
        currentTotal={balance} 
      />
      <CashOnHandDialog 
        open={showCashOnHand} 
        onOpenChange={setShowCashOnHand} 
        currentTotal={balance}
      />
      
      <HistoryDialog
        open={showDebtHistory}
        onOpenChange={setShowDebtHistory}
        title="Historie dluhu z chyb"
        transactions={registerData.debtErrors}
        type="debt"
      />
      
      <HistoryDialog
        open={showCashHistory}
        onOpenChange={setShowCashHistory}
        title="Historie hotovosti u pokladníka"
        transactions={registerData.cashOnHand}
        type="cash"
      />
    </div>
  )
}
