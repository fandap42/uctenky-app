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
import { AlertCircle, ImageIcon, StickyNote } from "lucide-react"
import { cn } from "@/lib/utils"
import { EditNoteDialog } from "@/components/dashboard/edit-note-dialog"

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
}

export function OverviewTable({ 
  transactions, 
  deposits,
  pageSize = "all",
  currentPage = 1
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
            <TableHead className="py-2 px-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-center w-[80px]">Přílohy</TableHead>
            <TableHead className="py-2 px-0 text-center w-12">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground/30"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((item) => {
            const isTr = item.displayType === "TRANSACTION"
            return (
              <TableRow key={item.id} className="border-border hover:bg-muted/10 transition-colors group">
                <TableCell className="py-2 px-4 text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                  {dateFormatter.format(item.displayDate)}
                </TableCell>
                <TableCell className="py-2 px-4">
                  {isTr ? (
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 font-bold text-[9px] h-4 uppercase tracking-wider px-1">
                      {item.section?.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground/30">—</span>
                  )}
                </TableCell>
                <TableCell className="py-2 px-4 text-sm text-foreground">
                  {isTr ? item.purpose : (item.description || "Vklad do pokladny")}
                </TableCell>
                <TableCell className="py-2 px-4 text-xs text-foreground font-medium">
                  {isTr ? (item.store || "—") : <span className="text-muted-foreground/30">—</span>}
                </TableCell>
                <TableCell className="py-2 px-4 text-right tabular-nums">
                  {isTr ? (
                    <div className="flex items-center justify-end gap-1.5">
                      {!item.isPaid && <AlertCircle className="w-3.5 h-3.5 text-warning" />}
                      <span className="font-bold text-destructive text-sm">
                        -{Number(item.finalAmount || item.estimatedAmount).toLocaleString("cs-CZ")} Kč
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
                <TableCell className="py-2 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {isTr ? (
                      <EditNoteDialog transactionId={item.id} initialNote={item.note} />
                    ) : (
                      <div className="w-4" />
                    )}
                    {isTr && item.receiptUrl ? (
                      <a 
                        href={item.receiptUrl} 
                        target="_blank" 
                        rel="noopener" 
                        className="text-primary/60 hover:text-primary transition-colors"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-2 px-0 text-center">
                  <Checkbox 
                    id={`track-${item.id}`} 
                    checked={!!checkedIds[item.id]} 
                    onCheckedChange={() => toggleCheck(item.id)}
                    className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-md w-5 h-5 shadow-sm mx-auto opacity-60 group-hover:opacity-100 transition-all scale-110"
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
