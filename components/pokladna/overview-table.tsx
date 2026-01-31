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
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, StickyNote } from "lucide-react"
import { cn } from "@/lib/utils"
import { EditNoteDialog } from "@/components/dashboard/edit-note-dialog"
import { ReceiptViewDialog } from "@/components/receipts/receipt-view-dialog"
import { toggleReceiptPaid } from "@/lib/actions/receipts"
import { toggleTicketFiled } from "@/lib/actions/tickets"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { FolderCheck, FolderX, CheckIcon } from "lucide-react"

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

  async function handleTogglePaid(receiptId: string, currentStatus: boolean) {
    setLoadingIds(prev => ({ ...prev, [receiptId]: true }))
    const result = await toggleReceiptPaid(receiptId, !currentStatus)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(!currentStatus ? "Označeno jako proplaceno" : "Označeno jako neproplaceno")
      router.refresh()
    }
    setLoadingIds(prev => ({ ...prev, [receiptId]: false }))
  }

  async function handleToggleFiled(ticketId: string, currentStatus: boolean, itemId: string) {
    if (!ticketId) return
    setLoadingIds(prev => ({ ...prev, [itemId]: true }))
    const result = await toggleTicketFiled(ticketId, !currentStatus)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(!currentStatus ? "Označeno jako založeno" : "Označeno jako nezaloženo")
      router.refresh()
    }
    setLoadingIds(prev => ({ ...prev, [itemId]: false }))
  }

  const effectivePageSize = pageSize === "all" ? combinedData.length : pageSize
  const paginatedData = combinedData.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize)

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="py-2 px-4 text-xs font-black uppercase tracking-widest text-muted-foreground w-[100px]">Datum</TableHead>
            <TableHead className="py-2 px-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Sekce</TableHead>
            <TableHead className="py-2 px-4 text-xs font-black uppercase tracking-widest text-muted-foreground min-w-[200px]">Účel</TableHead>
            <TableHead className="py-2 px-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Obchod</TableHead>
            <TableHead className="py-2 px-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Částka</TableHead>
            <TableHead className="py-2 px-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Typ</TableHead>
            <TableHead className="py-2 px-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Proplaceno</TableHead>
            <TableHead className="py-2 px-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Založeno</TableHead>
            <TableHead className="py-2 px-0 text-center w-12 text-muted-foreground/30">
              <CheckIcon className="size-4 mx-auto" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((item) => {
            const isTr = item.displayType === "TRANSACTION"
            return (
              <TableRow 
                key={item.id} 
                className={cn(
                  "border-border transition-colors group",
                  isTr && onTicketClick ? "hover:bg-primary/5 cursor-pointer" : "hover:bg-muted/10"
                )}
                onClick={() => isTr && onTicketClick && onTicketClick(item.ticket)}
              >
                <TableCell className="py-2 px-4 text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                  {dateFormatter.format(item.displayDate)}
                </TableCell>
                <TableCell className="py-2 px-4">
                  {isTr ? (
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 font-bold text-[9px] h-4 uppercase tracking-wider px-1">
                      {item.section?.name || item.sectionName}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground/30">—</span>
                  )}
                </TableCell>
                <TableCell className="py-2 px-4 text-sm text-foreground">
                  {isTr ? (item.purpose || item.description) : (item.description || "Vklad do pokladny")}
                </TableCell>
                <TableCell className="py-2 px-4 text-xs text-foreground font-medium">
                  {isTr ? (item.store || "—") : <span className="text-muted-foreground/30">—</span>}
                </TableCell>
                <TableCell className="py-2 px-4 text-right tabular-nums">
                  {isTr ? (
                    <div className="flex items-center justify-end gap-1.5">
                      {!item.isPaid && <AlertCircle className="w-3.5 h-3.5 text-warning" />}
                      <span className="font-bold text-destructive text-sm">
                        {Math.abs(Number(item.amount || item.finalAmount || item.estimatedAmount)).toLocaleString("cs-CZ")} Kč
                      </span>
                    </div>
                  ) : (
                    <span className="font-bold text-success text-sm">
                      +{Number(item.amount).toLocaleString("cs-CZ")} Kč
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-2 px-4 text-center">
                  {isTr ? (
                    <Badge className={cn(
                      "font-bold text-[9px] uppercase tracking-wider h-4 px-1",
                      item.expenseType === "MATERIAL" 
                        ? "bg-[oklch(0.60_0.20_280)] text-white hover:bg-[oklch(0.60_0.20_280)] border-none" 
                        : "bg-blue-100 text-blue-700 hover:bg-blue-100 border-none"
                    )}>
                      {item.expenseType === "MATERIAL" ? "Materiál" : "Služba"}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground/30">—</span>
                  )}
                </TableCell>
                <TableCell className="py-2 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-2">
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
                <TableCell className="py-2 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                  {isTr ? (
                    <div className="flex justify-center">
                      <Checkbox 
                        checked={item.isPaid}
                        onCheckedChange={() => handleTogglePaid(item.id, !!item.isPaid)}
                        disabled={loadingIds[item.id]}
                        className={cn(
                          "w-5 h-5 transition-all data-[state=checked]:bg-[oklch(0.60_0.16_150)] data-[state=checked]:border-[oklch(0.60_0.16_150)]",
                          !item.isPaid && "opacity-40"
                        )}
                      />
                    </div>
                  ) : <span className="text-muted-foreground/30">—</span>}
                </TableCell>
                <TableCell className="py-2 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                  {isTr ? (
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleToggleFiled(item.ticket?.id, !!item.ticket?.isFiled, item.id)}
                        disabled={loadingIds[item.id]}
                        className={cn(
                          "transition-all p-1 rounded-md hover:bg-muted/20",
                          item.ticket?.isFiled ? "text-[oklch(0.60_0.16_150)]" : "text-muted-foreground/40"
                        )}
                      >
                        {item.ticket?.isFiled ? (
                          <FolderCheck className="w-5 h-5" />
                        ) : (
                          <FolderX className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  ) : <span className="text-muted-foreground/30">—</span>}
                </TableCell>
                <TableCell className="py-2 px-0 text-center" onClick={(e) => e.stopPropagation()}>
                  <Checkbox 
                    id={`track-${item.id}`} 
                    checked={!!checkedIds[item.id]} 
                    onCheckedChange={() => toggleCheck(item.id)}
                    className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-md w-5 h-5 shadow-sm mx-auto opacity-30 group-hover:opacity-100 transition-all scale-110"
                  />
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
