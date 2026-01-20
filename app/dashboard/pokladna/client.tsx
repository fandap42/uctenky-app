"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllCashRegisterData } from "@/lib/actions/cash-register"
import { getSemester, monthNames } from "@/lib/utils/semesters"
import { DepositDialog } from "@/components/pokladna/deposit-dialog"
import { DebtErrorDialog } from "@/components/pokladna/debt-error-dialog"
import { CashOnHandDialog } from "@/components/pokladna/cash-on-hand-dialog"
import { HistoryDialog } from "@/components/pokladna/history-dialog"
import { CashRegisterExport } from "@/components/pokladna/cash-register-export"
import { OverviewTable } from "@/components/pokladna/overview-table"
import { toast } from "sonner"

interface PokladnaClientProps {
  initialYear: number
  initialMonth: number
}

interface Transaction {
  id: string
  purpose: string
  store: string | null
  estimatedAmount: number
  finalAmount: number | null
  isPaid: boolean
  expenseType: string
  dueDate: string | null
  section: { name: string } | null
  requester: { fullName: string } | null
}

interface Deposit {
  id: string
  amount: number
  description: string | null
  date: string
  createdAt: string
}

interface DebtErrorItem {
  id: string
  amount: number
  reason: string
  createdAt: string
}

interface CashOnHandItem {
  id: string
  amount: number
  reason: string
  createdAt: string
}

interface CashRegisterData {
  deposits?: Deposit[]
  debtErrors?: DebtErrorItem[]
  cashOnHand?: CashOnHandItem[]
  transactions?: Transaction[]
  totalDebtErrors?: number
  totalCashOnHand?: number
  totalDeposits?: number
  currentBalance?: number
  unpaidCount?: number
  realCash?: number
  error?: string
}

// Group items by semester and month
function groupBySemesterAndMonth<T extends { date?: string; dueDate?: string | null }>(
  items: T[],
  dateField: "date" | "dueDate"
): Record<string, Record<number, T[]>> {
  const semesters: Record<string, Record<number, T[]>> = {}

  items.forEach((item) => {
    const dateStr = dateField === "date" ? (item as Deposit).date : (item as unknown as Transaction).dueDate
    if (!dateStr) return

    const date = new Date(dateStr)
    const semKey = getSemester(date)
    const monthKey = date.getMonth() + 1

    if (!semesters[semKey]) semesters[semKey] = {}
    if (!semesters[semKey][monthKey]) semesters[semKey][monthKey] = []

    semesters[semKey][monthKey].push(item)
  })

  return semesters
}

export function PokladnaClient({ initialYear, initialMonth }: PokladnaClientProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CashRegisterData | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const result = await getAllCashRegisterData()
    if (result.error) {
      toast.error(result.error)
    } else {
      setData(result as CashRegisterData)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="text-center py-12 text-slate-400">
        Nepodařilo se načíst data
      </div>
    )
  }

  // Group transactions and deposits by semester/month
  const transactionsBySemester = groupBySemesterAndMonth(
    data.transactions || [],
    "dueDate"
  )
  const depositsBySemester = groupBySemesterAndMonth(
    data.deposits || [],
    "date"
  )

  // Get all semester keys
  const allSemKeys = new Set([
    ...Object.keys(transactionsBySemester),
    ...Object.keys(depositsBySemester),
  ])

  // Sort semesters (newest first)
  const sortedSemKeys = Array.from(allSemKeys).sort((a, b) => {
    const yearA = parseInt(a.slice(2))
    const yearB = parseInt(b.slice(2))
    if (yearA !== yearB) return yearB - yearA
    return b.charAt(0).localeCompare(a.charAt(0))
  })

  // Calculate balance for a specific month (uses actual year/month, not semester)
  function getMonthBalance(year: number, month: number) {
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)
    
    const depositsUpToMonth = (data?.deposits || []).filter(
      (d) => new Date(d.date) <= endOfMonth
    )
    // Count ALL transactions (not just isPaid) since they represent expenses
    const transactionsUpToMonth = (data?.transactions || []).filter(
      (t) => t.dueDate && new Date(t.dueDate) <= endOfMonth
    )

    const totalDeposits = depositsUpToMonth.reduce((sum, d) => sum + d.amount, 0)
    const totalExpenses = transactionsUpToMonth.reduce(
      (sum, t) => sum + (t.finalAmount || t.estimatedAmount),
      0
    )

    return totalDeposits - totalExpenses
  }

  // Get actual year for a month in a semester
  // ZS25 = Fall 2025 (Sep-Dec 2025, Jan 2026)
  // LS26 = Spring 2026 (Feb-Aug 2026)
  function getActualYearForMonth(semKey: string, month: number): number {
    const yearStr = semKey.slice(2)
    const semYear = parseInt(yearStr) < 50 ? 2000 + parseInt(yearStr) : 1900 + parseInt(yearStr)
    
    const isWinterSem = semKey.startsWith("ZS")
    
    if (isWinterSem && month === 1) {
      // January in winter semester is next year
      return semYear + 1
    }
    
    return semYear
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Pokladna</h1>
          <p className="text-slate-400">Správa pokladny a přehled financí</p>
        </div>
        <div className="flex gap-2">
          <DepositDialog onSuccess={loadData} />
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Real Cash */}
        <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-700/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-300">
              Reálná pokladna
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-white">
              {(data.realCash || 0).toLocaleString("cs-CZ")} Kč
            </CardTitle>
            {(data.unpaidCount || 0) > 0 && (
              <p className="text-sm text-orange-400 mt-1">
                ⚠️ Neproplacených: {data.unpaidCount}
              </p>
            )}
          </CardHeader>
        </Card>

        {/* Current Balance */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Aktuální zůstatek
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-white">
              {(data.currentBalance || 0).toLocaleString("cs-CZ")} Kč
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Debt Errors */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 flex items-center justify-between">
              <span>Dluh z chyb</span>
              <div className="flex gap-1">
                <HistoryDialog
                  title="Historie dluhu z chyb"
                  items={data.debtErrors || []}
                  type="debt"
                />
                <DebtErrorDialog
                  currentTotal={data.totalDebtErrors || 0}
                  onSuccess={loadData}
                />
              </div>
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-red-400">
              {(data.totalDebtErrors || 0).toLocaleString("cs-CZ")} Kč
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Cash on Hand */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 flex items-center justify-between">
              <span>Hotovost</span>
              <div className="flex gap-1">
                <HistoryDialog
                  title="Historie hotovosti"
                  items={data.cashOnHand || []}
                  type="cash"
                />
                <CashOnHandDialog
                  currentTotal={data.totalCashOnHand || 0}
                  onSuccess={loadData}
                />
              </div>
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-yellow-400">
              {(data.totalCashOnHand || 0).toLocaleString("cs-CZ")} Kč
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Semester/Month structured list */}
      <div className="space-y-12">
        {sortedSemKeys.map((semKey) => {
          const semTransactions = transactionsBySemester[semKey] || {}
          const semDeposits = depositsBySemester[semKey] || {}

          // Get all months in this semester
          const allMonths = new Set([
            ...Object.keys(semTransactions).map(Number),
            ...Object.keys(semDeposits).map(Number),
          ])

          const sortedMonths = Array.from(allMonths).sort((a, b) => b - a)

          if (sortedMonths.length === 0) return null

          return (
            <div key={semKey} className="space-y-6">
              {/* Semester Header */}
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white bg-slate-800 px-4 py-1 rounded-lg border border-slate-700">
                  {semKey}
                </h2>
                <div className="h-px flex-1 bg-slate-800" />
              </div>

              {/* Months */}
              <div className="grid gap-6">
                {sortedMonths.map((monthKey) => {
                  const monthTxs = semTransactions[monthKey] || []
                  const monthDeposits = semDeposits[monthKey] || []

                  // Get actual year for this specific month
                  const actualYear = getActualYearForMonth(semKey, monthKey)
                  // Calculate month balance
                  const monthBalance = getMonthBalance(actualYear, monthKey)

                  return (
                    <Card
                      key={`${semKey}-${monthKey}`}
                      className="bg-slate-800/30 border-slate-700/50 overflow-hidden"
                    >
                      <CardHeader className="py-3 px-4 bg-slate-800/50 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                          <CardTitle className="text-sm font-medium text-slate-300">
                            {monthNames[monthKey]}
                          </CardTitle>
                          <span className="text-sm text-slate-500">
                            Zůstatek na konci měsíce:{" "}
                            <span className="text-white font-medium">
                              {monthBalance.toLocaleString("cs-CZ")} Kč
                            </span>
                          </span>
                        </div>
                        <CashRegisterExport
                          transactions={monthTxs}
                          deposits={monthDeposits}
                          beginningBalance={getMonthBalance(
                            monthKey === 1 ? actualYear - 1 : actualYear,
                            monthKey - 1 < 1 ? 12 : monthKey - 1
                          )}
                          endingBalance={monthBalance}
                          year={actualYear}
                          month={monthKey}
                        />
                      </CardHeader>
                      <CardContent className="p-0">
                        <OverviewTable
                          transactions={monthTxs}
                          deposits={monthDeposits}
                        />
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {sortedSemKeys.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          Žádné záznamy v pokladně
        </div>
      )}
    </div>
  )
}
