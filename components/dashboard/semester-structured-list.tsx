"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { StatusBadge, mapTicketStatusToBadge } from "@/components/ui/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSemester, sortSemesterKeys, monthNames } from "@/lib/utils/semesters"
import { PaidStatusSelect } from "./paid-status-select"
import { FiledStatusSelect } from "./filed-status-select"
import { ExpenseTypeSelect } from "./expense-type-select"
import { ReceiptUpload } from "@/components/receipts/receipt-upload"
import { ReceiptViewDialog } from "@/components/receipts/receipt-view-dialog"
import { DeleteButton } from "./delete-button"
import { EditTransactionDialog } from "./edit-transaction-dialog"
import { EditNoteDialog } from "./edit-note-dialog"
import { ApprovalActions } from "@/components/requests/approval-actions"
import { deleteTicket, updateTicketStatus } from "@/lib/actions/tickets"
import { deleteReceipt, updateReceiptStatus, toggleReceiptPaid, updateReceiptExpenseType, toggleReceiptFiled } from "@/lib/actions/receipts"
import { CollapsibleSemester } from "./collapsible-semester"
import { TablePagination } from "@/components/ui/table-pagination"
import { getTicketsBySemester } from "@/lib/actions/tickets"

import { TicketStatus, ExpenseType } from "@prisma/client"

interface Transaction {
  id: string
  purpose: string
  store?: string | null
  status: TicketStatus
  isPaid?: boolean
  isFiled?: boolean
  expenseType?: ExpenseType
  budgetAmount?: number
  targetDate?: Date | string
  amount?: number
  fileUrl?: string | null
  receiptUrl?: string | null
  note?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  requester?: { id: string; fullName: string } | null
  section?: { id: string; name: string } | null
}

interface StructuredListProps {
  initialTransactions?: Transaction[] // For the first expanded semester
  semesterKeys: string[]
  semesterTotals?: Record<string, number>
  isAdmin?: boolean
  showActions?: boolean
  showSection?: boolean
  showRequester?: boolean
  filters?: {
    requesterId?: string
    sectionId?: string
    status?: TicketStatus | TicketStatus[]
  }
  showNotes?: boolean
}



function MonthlyTransactionCard({ 
  monthTxs, 
  month,
  showRequester,
  showSection,
  isAdmin,
  showActions,
  showNotes
}: { 
  monthTxs: Transaction[], 
  month: number,
  showRequester: boolean,
  showSection: boolean,
  isAdmin: boolean,
  showActions: boolean,
  showNotes: boolean
}) {
  const [pageSize, setPageSize] = useState<number | "all">(10)
  const [currentPage, setCurrentPage] = useState(1)

  const effectivePageSize = pageSize === "all" ? monthTxs.length : pageSize
  const totalPages = pageSize === "all" ? 1 : Math.ceil(monthTxs.length / (pageSize as number))
  const paginatedTxs = monthTxs.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize)

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="py-3 px-4 bg-muted/30 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {monthNames[month]}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              {showRequester && <TableHead className="table-header-cell">Žadatel</TableHead>}
              {showSection && <TableHead className="table-header-cell">Sekce</TableHead>}
              <TableHead className="table-header-cell min-w-[100px]">Datum</TableHead>
              <TableHead className="table-header-cell min-w-[200px]">Účel</TableHead>
              <TableHead className="table-header-cell min-w-[150px]">Obchod</TableHead>
              <TableHead className="table-header-cell text-right min-w-[100px]">Částka</TableHead>
              <TableHead className="table-header-cell text-center">Stav</TableHead>
              {isAdmin && <TableHead className="table-header-cell text-center">Typ</TableHead>}
              {isAdmin && <TableHead className="table-header-cell text-center">Proplaceno</TableHead>}
              {isAdmin && <TableHead className="table-header-cell text-center">Založeno</TableHead>}
              <TableHead className="table-header-cell text-center w-[80px]">Přílohy</TableHead>
              {showActions && <TableHead className="table-header-cell text-right">Akce</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTxs.map((tx) => (
              <TableRow key={tx.id} className="border-border hover:bg-muted/50 transition-colors h-[52px]">
                {showRequester && (
                  <TableCell className="py-2 text-sm text-foreground font-semibold">
                    {tx.requester?.fullName || "Neznámý"}
                  </TableCell>
                )}
                {showSection && (
                  <TableCell className="py-2 text-sm text-foreground">
                    {tx.section?.name || "-"}
                  </TableCell>
                )}
                 <TableCell className="py-2 text-sm text-foreground whitespace-nowrap tabular-nums">
                   {new Date(tx.targetDate || tx.createdAt).toLocaleDateString("cs-CZ")}
                 </TableCell>
                 <TableCell className="py-2">
                   <p className="text-sm text-foreground font-medium truncate max-w-[150px]">{tx.purpose}</p>
                 </TableCell>
                 <TableCell className="py-2 text-sm text-foreground">
                   {tx.store || "-"}
                 </TableCell>
                 <TableCell className="py-2 text-sm text-foreground whitespace-nowrap tabular-nums font-semibold">
                   {(tx.amount || tx.budgetAmount || 0).toLocaleString("cs-CZ")} Kč
                 </TableCell>
                 <TableCell className="py-2 text-center">
                    <StatusBadge status={mapTicketStatusToBadge(tx.status)} size="sm" />
                 </TableCell>
                {isAdmin && (
                  <TableCell className="py-2">
                    {/* Only show for Receipts or specific Tickets */}
                    {tx.expenseType && <ExpenseTypeSelect transactionId={tx.id} initialType={tx.expenseType} />}
                  </TableCell>
                )}
                {isAdmin && (
                  <TableCell className="py-2">
                    {tx.isPaid !== undefined && <PaidStatusSelect transactionId={tx.id} initialStatus={tx.isPaid} />}
                  </TableCell>
                )}
                {isAdmin && (
                  <TableCell className="py-2">
                    {tx.isFiled !== undefined && <FiledStatusSelect transactionId={tx.id} initialStatus={tx.isFiled} onStatusUpdate={(id, status) => toggleReceiptFiled(id, status)} />}
                  </TableCell>
                )}
                <TableCell className="py-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {showNotes && <EditNoteDialog receiptId={tx.id} initialNote={tx.note} />}
                    {(tx.fileUrl || tx.receiptUrl) ? (
                      <ReceiptViewDialog 
                        transactionId={tx.id} 
                        purpose={tx.purpose} 
                      />
                    ) : (
                      <div className="w-4" />
                    )}
                  </div>
                </TableCell>
                {showActions && (
                  <TableCell className="py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isAdmin && (
                        <>
                          <EditTransactionDialog transaction={tx as unknown as { id: string; purpose: string; budgetAmount: number; targetDate?: Date | string; status: string; note?: string | null }} />
                          <DeleteButton 
                            onDelete={() => tx.fileUrl ? deleteReceipt(tx.id) : deleteTicket(tx.id)} 
                            iconOnly 
                          />
                        </>
                      )}
                      {!isAdmin && (
                        <>
                          {tx.status === "APPROVED" && <ReceiptUpload ticketId={tx.id} />}
                          {tx.status === "PENDING_APPROVAL" && (
                            <DeleteButton onDelete={() => deleteTicket(tx.id)} iconOnly />
                          )}
                        </>
                      )}
                      {isAdmin && (
                        <ApprovalActions 
                          ticketId={tx.id} 
                          currentStatus={tx.status} 
                          purpose={tx.purpose}
                          budgetAmount={tx.budgetAmount || 0}
                          targetDate={tx.targetDate}
                        />
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {monthTxs.length > 0 && (
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

export function SemesterStructuredList({
  initialTransactions = [],
  semesterKeys,
  semesterTotals = {},
  isAdmin = false,
  showActions = false,
  showSection = true,
  showRequester = true,
  filters = {},
  showNotes = true,
}: StructuredListProps) {
  const sortedKeys = sortSemesterKeys(semesterKeys)

  const renderSemesterContent = (data: { transactions: Transaction[] }, semesterKey: string) => {
    const { transactions } = data
    // Sort transactions by date (newest first) before grouping
    const sortedTxs = [...transactions].sort((a, b) => {
      const dateA = new Date(a.targetDate || a.createdAt).getTime()
      const dateB = new Date(b.targetDate || b.createdAt).getTime()
      return dateB - dateA
    })

    const monthGroups: Record<number, Transaction[]> = {}
    const semesterTotal = semesterTotals[semesterKey] || 0

    sortedTxs.forEach((tx) => {
      const date = new Date(tx.targetDate || tx.createdAt)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const sortKey = year * 100 + month
      if (!monthGroups[sortKey]) monthGroups[sortKey] = []
      monthGroups[sortKey].push(tx)
    })

    const sortedMonthKeys = Object.keys(monthGroups)
      .map(Number)
      .sort((a, b) => b - a)

    return (
      <div className="space-y-6">
        <div className="flex justify-start pl-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Celkem vyčerpáno:</span>
            <span className="text-lg font-black text-foreground tabular-nums">
              {semesterTotal.toLocaleString("cs-CZ")} <span className="text-xs font-bold text-muted-foreground">Kč</span>
            </span>
          </div>
        </div>

        <div className="grid gap-6">
          {sortedMonthKeys.map((monthKey) => {
            const monthTxs = monthGroups[monthKey]
            const month = monthKey % 100
            return (
              <MonthlyTransactionCard
                key={monthKey}
                month={month}
                monthTxs={monthTxs}
                isAdmin={isAdmin}
                showRequester={showRequester}
                showSection={showSection}
                showActions={showActions}
                showNotes={showNotes}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {sortedKeys.map((key, index) => {
        return (
          <CollapsibleSemester
            key={key}
            semesterKey={key}
            defaultExpanded={index === 0}
            initialData={index === 0 ? { transactions: initialTransactions } : undefined}
            fetchData={() => getTicketsBySemester(key, filters)}
            renderContent={(data) => renderSemesterContent(data, key)}
          />
        )
      })}
      {sortedKeys.length === 0 && (
        <div className="py-20 text-center text-muted-foreground italic font-medium">
          Žádné žádosti k zobrazení
        </div>
      )}
    </div>
  )
}
