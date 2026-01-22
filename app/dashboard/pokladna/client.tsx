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

import { getPokladnaSemesterData } from "@/lib/actions/cash-register"
import { CollapsibleSemester } from "@/components/dashboard/collapsible-semester"

interface PokladnaClientProps {
  initialBalance: number
  unpaidCount: number
  currentUsers: any[]
  registerData: any // Context (debtErrors, cashOnHand, etc.)
  semesterKeys: string[]
  initialSemesterData: any
}

export function PokladnaClient({ 
  initialBalance, 
  unpaidCount, 
  currentUsers,
  registerData,
  semesterKeys,
  initialSemesterData
}: PokladnaClientProps) {
  const [showDebtError, setShowDebtError] = useState(false)
  const [showCashOnHand, setShowCashOnHand] = useState(false)
  const [showDebtHistory, setShowDebtHistory] = useState(false)
  const [showCashHistory, setShowCashHistory] = useState(false)

  const renderSemesterContent = (data: any) => {
    // data contains openingBalance, deposits, transactions
    const { openingBalance, deposits, transactions } = data
    
    // Monthly grouping within the semester
    const monthlyGroups: Record<string, {
      monthName: string,
      month: number,
      year: number,
      transactions: any[],
      deposits: any[],
      sortKey: number,
      endBalance: number,
      startBalance: number
    }> = {}

    const allData = [
      ...transactions.map((t: any) => ({ ...t, displayDate: new Date(t.dueDate || t.createdAt), type: 'TR', amount: -(t.finalAmount || t.estimatedAmount) })),
      ...deposits.map((d: any) => ({ ...d, displayDate: new Date(d.date), type: 'DEP', amount: d.amount }))
    ].sort((a, b) => a.displayDate.getTime() - b.displayDate.getTime())

    let runningBalance = openingBalance
    
    allData.forEach(item => {
      const startBalance = runningBalance
      runningBalance += Number(item.amount)
      
      const date = item.displayDate
      const month = date.getMonth()
      const year = date.getFullYear()
      const monthKey = `${year}-${month}`

      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = {
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
        monthlyGroups[monthKey].transactions.push(item)
      } else {
        monthlyGroups[monthKey].deposits.push(item)
      }
      
      monthlyGroups[monthKey].endBalance = runningBalance
    })

    const sortedMonths = Object.values(monthlyGroups).sort((a, b) => b.sortKey - a.sortKey)

    return (
      <div className="space-y-12">
        {sortedMonths.map((group) => (
          <Card key={`${group.year}-${group.monthName}`} className="bg-card border-border overflow-hidden">
            <CardHeader className="py-3 px-4 bg-muted/30 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  {group.monthName}
                </CardTitle>
                <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
                <div className="text-xs font-medium text-muted-foreground">
                  Zůstatek: <span className="text-foreground font-black">{group.endBalance.toLocaleString("cs-CZ")} Kč</span>
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
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <OverviewTable 
                transactions={group.transactions} 
                deposits={group.deposits} 
              />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

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

      {/* Top Cards Grid - Same as before */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[160px]">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reálná pokladna</h3>
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
              Zůstatek - Dluhy - Hotovost
            </div>
            {unpaidCount > 0 && (
              <div className="flex items-center gap-2 text-warning font-black text-xs uppercase tracking-wider">
                <AlertCircle className="w-3.5 h-3.5" />
                Neproplacené: {unpaidCount}
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
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Aktuální zůstatek</h3>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-4xl font-black text-foreground tabular-nums">
              {registerData.currentBalance.toLocaleString("cs-CZ")}
            </span>
            <span className="text-xl font-bold text-muted-foreground">Kč</span>
          </div>
        </Card>

        <Card className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dluh z chyb</h3>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDebtHistory(true)}
                className="text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase flex items-center gap-1 h-5 px-1.5 rounded-full bg-muted/20"
              >
                <History className="w-3 h-3" />
                Historie
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDebtError(true)}
                className="text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase flex items-center gap-1 h-5 px-1.5 rounded-full bg-muted/20"
              >
                <Pencil className="w-3 h-3" />
                Upravit
              </Button>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-4xl font-black text-foreground tabular-nums">
              {registerData.totalDebtErrors.toLocaleString("cs-CZ")}
            </span>
            <span className="text-xl font-bold text-muted-foreground">Kč</span>
          </div>
        </Card>

        <Card className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hotovost</h3>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCashHistory(true)}
                className="text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase flex items-center gap-1 h-5 px-1.5 rounded-full bg-muted/20"
              >
                <History className="w-3 h-3" />
                Historie
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCashOnHand(true)}
                className="text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase flex items-center gap-1 h-5 px-1.5 rounded-full bg-muted/20"
              >
                <Pencil className="w-3 h-3" />
                Upravit
              </Button>
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-4xl font-black text-foreground tabular-nums">
              {registerData.totalCashOnHand.toLocaleString("cs-CZ")}
            </span>
            <span className="text-xl font-bold text-muted-foreground">Kč</span>
          </div>
        </Card>
      </div>

      {/* Lazy Loaded Semester Sections */}
      <div className="space-y-12">
        {semesterKeys.map((key, index) => (
          <CollapsibleSemester
            key={key}
            semesterKey={key}
            defaultExpanded={index === 0}
            initialData={index === 0 ? initialSemesterData : undefined}
            fetchData={() => getPokladnaSemesterData(key)}
            renderContent={renderSemesterContent}
          />
        ))}

        {semesterKeys.length === 0 && (
          <div className="py-20 text-center text-muted-foreground italic font-medium">
            Žádné pokladní záznamy k zobrazení
          </div>
        )}
      </div>

      {/* Dialogs */}
      <DebtErrorDialog 
        open={showDebtError} 
        onOpenChange={setShowDebtError} 
        currentTotal={initialBalance} 
      />
      <CashOnHandDialog 
        open={showCashOnHand} 
        onOpenChange={setShowCashOnHand} 
        currentTotal={initialBalance}
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
