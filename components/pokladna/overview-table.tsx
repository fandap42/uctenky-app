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
import { ExpenseTypeBadge, mapExpenseTypeToVariant } from "@/components/ui/expense-type-badge"
import { FunctionalCheckbox } from "@/components/ui/functional-checkbox"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, StickyNote } from "lucide-react"
import { cn } from "@/lib/utils"
import { EditNoteDialog } from "@/components/dashboard/edit-note-dialog"
import { ReceiptViewDialog } from "@/components/receipts/receipt-view-dialog"
import { FolderCheck, FolderX, CheckIcon } from "lucide-react"
import { toggleReceiptPaid, toggleReceiptFiled } from "@/lib/actions/receipts"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const dateFormatter = new Intl.DateTimeFormat("cs-CZ", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

interface OverviewTableProps {
  transactions: any[]
  deposits: any[]
  pageSize?: number | "all"
  currentPage?: number
  onTicketClick?: (ticket: any) => void
}

export function OverviewTable({ 
  transactions, 
  deposits,
  pageSize = "all",
  currentPage = 1,
  onTicketClick
}: OverviewTableProps) {
  // Combine and sort by date
  const combinedData = [
    ...transactions.map(t => ({
      ...t,
      displayDate: new Date(t.dueDate || t.createdAt),
      displayType: "TRANSACTION"
    })),
    ...deposits.map(d => ({
      ...d,
      displayDate: new Date(d.date),
      displayType: "DEPOSIT"
    }))
  ].sort((a, b) => b.displayDate.getTime() - a.displayDate.getTime())

  // Ephemeral state for checkboxes
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({})

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const router = useRouter()
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({})
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, { isPaid?: boolean, isFiled?: boolean }>>({})

  async function handleTogglePaid(receiptId: string, currentStatus: boolean) {
    const newStatus = !currentStatus
    setOptimisticStatuses(prev => ({ ...prev, [receiptId]: { ...prev[receiptId], isPaid: newStatus } }))
    setLoadingIds(prev => ({ ...prev, [receiptId]: true }))
    
    const result = await toggleReceiptPaid(receiptId, newStatus)
    if (result.error) {
      toast.error(result.error)
      setOptimisticStatuses(prev => ({ ...prev, [receiptId]: { ...prev[receiptId], isPaid: currentStatus } }))
    } else {
      toast.success(newStatus ? "Označeno jako proplaceno" : "Označeno jako neproplaceno")
      router.refresh()
    }
    setLoadingIds(prev => ({ ...prev, [receiptId]: false }))
  }

  async function handleToggleFiled(receiptId: string, currentStatus: boolean) {
    if (!receiptId) return
    const newStatus = !currentStatus
    setOptimisticStatuses(prev => ({ ...prev, [receiptId]: { ...prev[receiptId], isFiled: newStatus } }))
    setLoadingIds(prev => ({ ...prev, [receiptId]: true }))
    
    const result = await toggleReceiptFiled(receiptId, newStatus)
    if (result.error) {
      toast.error(result.error)
      setOptimisticStatuses(prev => ({ ...prev, [receiptId]: { ...prev[receiptId], isFiled: currentStatus } }))
    } else {
      toast.success(newStatus ? "Označeno jako založeno" : "Označeno jako nezaloženo")
      router.refresh()
    }
    setLoadingIds(prev => ({ ...prev, [receiptId]: false }))
  }

  const effectivePageSize = pageSize === "all" ? combinedData.length : pageSize
  const paginatedData = combinedData.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize)

  return (
    <div className="w-full">
      <Table>
        <TableHeader className="bg-muted/80 border-b border-border">
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="table-header-cell w-[100px]">Datum</TableHead>
            <TableHead className="table-header-cell">Sekce</TableHead>
            <TableHead className="table-header-cell min-w-[200px]">Účel</TableHead>
            <TableHead className="table-header-cell">Obchod</TableHead>
            <TableHead className="table-header-cell text-right">Částka</TableHead>
            <TableHead className="table-header-cell text-center w-[120px]">Typ</TableHead>
            <TableHead className="table-header-cell text-center w-[100px]">Přílohy</TableHead>
            <TableHead className="table-header-cell text-center w-[100px]">Proplaceno</TableHead>
            <TableHead className="table-header-cell text-center w-[100px]">Založeno</TableHead>
            <TableHead className="py-3 px-0 text-center w-12 text-muted-foreground/30">
              <CheckIcon className="size-4 mx-auto" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((item) => {
            const isTr = item.displayType === "TRANSACTION"
            const currentIsPaid = optimisticStatuses[item.id]?.isPaid ?? item.isPaid
            const currentIsFiled = optimisticStatuses[item.id]?.isFiled ?? item.isFiled

            return (
              <TableRow 
                key={item.id} 
                className={cn(
                  "border-border transition-all duration-200 group",
                  isTr && onTicketClick ? "hover:bg-primary/5 cursor-pointer" : "hover:bg-muted/10"
                )}
                onClick={() => isTr && onTicketClick && onTicketClick(item.ticket)}
              >
                <TableCell className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap tabular-nums font-medium">
                  {dateFormatter.format(item.displayDate)}
                </TableCell>
                <TableCell className="py-3 px-4">
                  {isTr ? (
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 font-bold text-[10px] h-5 uppercase tracking-wider px-2 shadow-sm">
                      {item.section?.name || item.sectionName}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground/30">—</span>
                  )}
                </TableCell>
                <TableCell className="py-3 px-4 text-sm text-foreground font-semibold">
                  {isTr ? (item.purpose || item.description) : (item.description || "Vklad do pokladny")}
                </TableCell>
                <TableCell className="py-3 px-4 text-xs text-foreground font-medium">
                  {isTr ? (item.store || "—") : <span className="text-muted-foreground/30">—</span>}
                </TableCell>
                <TableCell className="py-3 px-4 text-right tabular-nums">
                  {isTr ? (
                    <div className="flex items-center justify-end gap-1.5">
                      {!currentIsPaid && <AlertCircle className="w-3.5 h-3.5 text-status-pending" />}
                      <span className="font-bold text-destructive text-sm tracking-tight text-label">
                        {Math.abs(Number(item.amount || item.finalAmount || item.estimatedAmount)).toLocaleString("cs-CZ")} Kč
                      </span>
                    </div>
                  ) : (
                    <span className="font-bold text-status-success text-sm tracking-tight text-label">
                      +{Number(item.amount).toLocaleString("cs-CZ")} Kč
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-3 px-4 text-center">
                  {isTr ? (
                    <div className="flex justify-center">
                      <ExpenseTypeBadge type={mapExpenseTypeToVariant(item.expenseType)} />
                    </div>
                  ) : (
                    <span className="text-muted-foreground/30">—</span>
                  )}
                </TableCell>
                <TableCell className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {isTr ? (
                      <EditNoteDialog receiptId={item.id} initialNote={item.note} />
                    ) : (
                      <div className="w-4" />
                    )}
                    {isTr && (item.receiptUrl || item.fileUrl) ? (
                      <ReceiptViewDialog 
                        transactionId={item.id} 
                        purpose={item.purpose} 
                      />
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4 text-center">
                  {isTr ? (
                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                      <FunctionalCheckbox 
                        variant="paid"
                        checked={currentIsPaid}
                        onCheckedChange={() => handleTogglePaid(item.id, !!currentIsPaid)}
                        disabled={loadingIds[item.id]}
                      />
                    </div>
                  ) : <span className="text-muted-foreground/30">—</span>}
                </TableCell>
                <TableCell className="py-3 px-4 text-center">
                  {isTr ? (
                    <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                      <FunctionalCheckbox 
                        variant="filed"
                        checked={currentIsFiled}
                        onCheckedChange={() => handleToggleFiled(item.id, !!currentIsFiled)}
                        disabled={loadingIds[item.id]}
                      />
                    </div>
                  ) : <span className="text-muted-foreground/30">—</span>}
                </TableCell>
                <TableCell className="py-3 px-0 text-center">
                  <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      id={`track-${item.id}`} 
                      checked={!!checkedIds[item.id]} 
                      onCheckedChange={() => toggleCheck(item.id)}
                      className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-md w-4 h-4 shadow-sm mx-auto opacity-30 group-hover:opacity-100 transition-all"
                    />
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
          {combinedData.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-20 text-center text-muted-foreground italic">
                Žádné záznamy o vkladech ani účtenkách nebyly nalezeny
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
