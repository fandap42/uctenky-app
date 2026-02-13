"use client"

import { useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OverviewTable } from "@/components/pokladna/overview-table"
import type { TicketClickPayload } from "@/components/pokladna/overview-table"
import { AlertCircle, History, Pencil } from "lucide-react"
import { DepositDialog } from "@/components/pokladna/deposit-dialog"
import { DebtErrorDialog } from "@/components/pokladna/debt-error-dialog"
import { CashOnHandDialog } from "@/components/pokladna/cash-on-hand-dialog"
import { HistoryDialog } from "@/components/pokladna/history-dialog"
import { CashRegisterExport } from "@/components/pokladna/cash-register-export"
import { TablePagination } from "@/components/ui/table-pagination"
import { getPokladnaSemesterData } from "@/lib/actions/cash-register"
import { CollapsibleSemester } from "@/components/dashboard/collapsible-semester"
import { TicketDetailDialog } from "@/components/dashboard/TicketDetailDialog"
import { useSession } from "next-auth/react"
import { ExpenseType, ReceiptStatus, TicketStatus } from "@prisma/client"

interface PokladnaClientProps {
  unpaidCount: number
  registerData: RegisterData
  semesterKeys: string[]
  initialSemesterData: SemesterData
}

interface TicketReceipt {
  id: string
  store: string
  date: string
  amount: number
  fileUrl: string
  isPaid: boolean
  expenseType: ExpenseType
  status: ReceiptStatus
  isFiled: boolean
  note?: string | null
}

interface TicketDetailRef {
  id: string
  purpose: string
  budgetAmount: number
  status: TicketStatus
  requesterId: string | null
  sectionId: string
  createdAt: string
  updatedAt?: string
  targetDate: string
  section: { name: string }
  requester?: { fullName: string | null } | null
  receipts: TicketReceipt[]
  isFiled?: boolean
}

interface TransactionRow {
  id: string
  amount: number | string
  date?: string
  createdAt?: string
  store?: string | null
  purpose?: string
  description?: string
  section?: { name: string }
  sectionName?: string
  expenseType?: string
  isPaid?: boolean
  isFiled?: boolean
  receiptUrl?: string | null
  fileUrl?: string | null
  note?: string | null
  ticket?: TicketDetailRef
  targetDate?: string
}

interface DepositRow {
  id: string
  amount: number | string
  date: string
  description?: string | null
}

interface HistoryEntry {
  id: string
  amount: number | string
  createdAt: string
  reason: string
}

interface RegisterData {
  realCash: number
  currentBalance: number
  totalDebtErrors: number
  totalCashOnHand: number
  receipts: TransactionRow[]
  deposits: DepositRow[]
  debtErrors: HistoryEntry[]
  cashOnHand: HistoryEntry[]
}

interface SemesterData {
  openingBalance: number
  deposits: DepositRow[]
  transactions?: TransactionRow[]
  receipts?: TransactionRow[]
}

interface MonthlyGroup {
  monthName: string
  month: number
  year: number
  transactions: TransactionRow[]
  deposits: DepositRow[]
  sortKey: number
  endBalance: number
  startBalance: number
}

const MONTH_NAMES = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
]

function MonthlyPokladnaCard({
  group,
  onTicketClick,
}: {
  group: MonthlyGroup
  onTicketClick?: (ticket: TicketClickPayload) => void
}) {
  const [pageSize, setPageSize] = useState<number | "all">(10)
  const [currentPage, setCurrentPage] = useState(1)

  const totalItems = group.transactions.length + group.deposits.length
  const totalPages = pageSize === "all" ? 1 : Math.ceil(totalItems / (pageSize as number))

  return (
    <Card className="bg-card border-border overflow-hidden">
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
          pageSize={pageSize}
          currentPage={currentPage}
          onTicketClick={onTicketClick}
        />
        {totalItems > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}

export function PokladnaClient({ 
  unpaidCount, 
  registerData,
  semesterKeys,
  initialSemesterData
}: PokladnaClientProps) {
  const [showDebtError, setShowDebtError] = useState(false)
  const [showCashOnHand, setShowCashOnHand] = useState(false)
  const [showDebtHistory, setShowDebtHistory] = useState(false)
  const [showCashHistory, setShowCashHistory] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const { data: session } = useSession()

  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return null
    return registerData.receipts.find((r) => r.ticket?.id === selectedTicketId)?.ticket || null
  }, [selectedTicketId, registerData.receipts])

  const renderSemesterContent = (data: SemesterData) => {
    // data contains openingBalance, deposits, and either transactions or receipts
    const { openingBalance, deposits } = data
    // Handle both naming conventions (server returns receipts, client prop expects transactions)
    const transactions = data.transactions || data.receipts || []
    
    // Monthly grouping within the semester
    const monthlyGroups: Record<string, MonthlyGroup> = {}

    type TransactionItem = TransactionRow & { displayDate: Date; type: "TR"; amount: number }
    type DepositItem = DepositRow & { displayDate: Date; type: "DEP"; amount: number }

    const transactionItems: TransactionItem[] = transactions.map((t) => ({
      ...t,
      displayDate: new Date(t.date || t.createdAt || new Date().toISOString()),
      type: "TR",
      amount: -Number(t.amount || 0),
    }))

    const depositItems: DepositItem[] = deposits.map((d) => ({
      ...d,
      displayDate: new Date(d.date),
      type: "DEP",
      amount: Number(d.amount),
    }))

    const allData = [...transactionItems, ...depositItems].sort(
      (a, b) => a.displayDate.getTime() - b.displayDate.getTime()
    )

    let runningBalance = Number(openingBalance)
    
    allData.forEach(item => {
      const startBalance = runningBalance
      runningBalance += item.amount
      
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
          <MonthlyPokladnaCard 
            key={`${group.year}-${group.monthName}`} 
            group={group} 
            onTicketClick={(ticket) => setSelectedTicketId(ticket.id)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2">Pokladna</h1>
        </div>
        <div className="flex items-center gap-3">
          <DepositDialog />
        </div>
      </div>

      {/* Top Cards Grid - Improved responsiveness */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[160px]">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reálná pokladna</h3>
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
              Zůstatek - Dluh u chyb - Hotovost
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
          <div className="flex items-start justify-between gap-x-4 gap-y-2 mb-2 flex-wrap">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-1.5">Dluh z chyb</h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDebtHistory(true)}
                className="text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase flex items-center gap-1 h-6 px-2 rounded-full bg-muted/20 transition-all border border-transparent hover:border-current/10"
              >
                <History className="w-3 h-3" />
                Historie
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDebtError(true)}
                className="text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase flex items-center gap-1 h-6 px-2 rounded-full bg-muted/20 transition-all border border-transparent hover:border-current/10"
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
          <div className="flex items-start justify-between gap-x-4 gap-y-2 mb-2 flex-wrap">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-1.5">Hotovost</h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCashHistory(true)}
                className="text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase flex items-center gap-1 h-6 px-2 rounded-full bg-muted/20 transition-all border border-transparent hover:border-current/10"
              >
                <History className="w-3 h-3" />
                Historie
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCashOnHand(true)}
                className="text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase flex items-center gap-1 h-6 px-2 rounded-full bg-muted/20 transition-all border border-transparent hover:border-current/10"
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
      />
      <CashOnHandDialog 
        open={showCashOnHand} 
        onOpenChange={setShowCashOnHand} 
      />
      
      <HistoryDialog
        open={showDebtHistory}
        onOpenChange={setShowDebtHistory}
        title="Historie dluhu z chyb"
        transactions={registerData.debtErrors}
      />
      
      <HistoryDialog
        open={showCashHistory}
        onOpenChange={setShowCashHistory}
        title="Historie hotovosti u pokladníka"
        transactions={registerData.cashOnHand}
      />

      <TicketDetailDialog 
        ticket={selectedTicket}
        open={!!selectedTicketId}
        onOpenChange={(open) => !open && setSelectedTicketId(null)}
        currentUserRole={session?.user?.role || "MEMBER"}
        currentUserId={session?.user?.id || ""}
      />
    </div>
  )
}
