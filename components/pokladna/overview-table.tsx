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
import { cn } from "@/lib/utils"

const dateFormatter = new Intl.DateTimeFormat("cs-CZ", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

interface OverviewTableProps {
  transactions: any[]
  deposits: any[]
}

export function OverviewTable({ transactions, deposits }: OverviewTableProps) {
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

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 border-border hover:bg-transparent">
            <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground w-[120px]">Datum</TableHead>
            <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Sekce</TableHead>
            <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground min-w-[200px]">Účel</TableHead>
            <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Obchod</TableHead>
            <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Částka</TableHead>
            <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Typ</TableHead>
            <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Vklady</TableHead>
            <TableHead className="py-4 px-6 w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {combinedData.map((item) => {
            const isTr = item.displayType === "TRANSACTION"
            return (
              <TableRow key={item.id} className="border-border hover:bg-muted/30 transition-colors group">
                <TableCell className="py-4 px-6 font-bold text-muted-foreground text-sm whitespace-nowrap">
                  {dateFormatter.format(item.displayDate)}
                </TableCell>
                <TableCell className="py-4 px-6">
                  {isTr ? (
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 font-black text-[10px] uppercase tracking-wider">
                      {item.section?.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground/30">—</span>
                  )}
                </TableCell>
                <TableCell className="py-4 px-6 font-bold text-foreground">
                  {isTr ? item.purpose : (item.description || "Vklad do pokladny")}
                </TableCell>
                <TableCell className="py-4 px-6 text-muted-foreground font-medium">
                  {isTr ? (item.store || "—") : <span className="text-muted-foreground/30">—</span>}
                </TableCell>
                <TableCell className="py-4 px-6 text-right tabular-nums">
                  {isTr ? (
                    <span className="font-black text-destructive text-base">
                      -{Number(item.finalAmount || item.estimatedAmount).toLocaleString("cs-CZ")} Kč
                    </span>
                  ) : (
                    <span className="text-muted-foreground/30">—</span>
                  )}
                </TableCell>
                <TableCell className="py-4 px-6 text-center">
                  {isTr ? (
                    <Badge className={cn(
                      "font-black text-[10px] uppercase tracking-wider h-5",
                      item.expenseType === "MATERIAL" 
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-100 border-none" 
                        : "bg-blue-100 text-blue-700 hover:bg-blue-100 border-none"
                    )}>
                      {item.expenseType === "MATERIAL" ? "Materiál" : "Služba"}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground/30">—</span>
                  )}
                </TableCell>
                <TableCell className="py-4 px-6 text-right tabular-nums">
                  {!isTr ? (
                    <span className="font-black text-success text-base">
                      +{Number(item.amount).toLocaleString("cs-CZ")} Kč
                    </span>
                  ) : (
                    <span className="text-muted-foreground/30">—</span>
                  )}
                </TableCell>
                <TableCell className="py-4 px-6 text-right">
                  <Checkbox 
                    id={`track-${item.id}`} 
                    checked={!!checkedIds[item.id]} 
                    onCheckedChange={() => toggleCheck(item.id)}
                    className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-md w-5 h-5 shadow-none"
                  />
                </TableCell>
              </TableRow>
            )
          })}
          {combinedData.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-20 text-center text-muted-foreground italic">
                Žádné záznamy o vkladech ani účtenkách nebyly nalezeny
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
