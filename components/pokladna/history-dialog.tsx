"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { History } from "lucide-react"

interface HistoryDialogProps {
  title: string
  transactions: Array<{ amount: number; reason: string; createdAt: Date | string; [key: string]: unknown }>
  type: "debt" | "cash"
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function HistoryDialog({ title, transactions, type, open: propOpen, onOpenChange: propOnOpenChange }: HistoryDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = propOpen !== undefined ? propOpen : internalOpen
  const setOpen = propOnOpenChange !== undefined ? propOnOpenChange : setInternalOpen

  const total = transactions.reduce((sum, item) => sum + Number(item.amount), 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold tabular-nums">
            Celkový stav: {total.toLocaleString("cs-CZ")} Kč
          </DialogDescription>
        </DialogHeader>
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-12 font-bold italic">Žádné záznamy</p>
        ) : (
          <div className="rounded-[1.5rem] border border-border overflow-hidden mt-4">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent bg-muted/30">
                  <TableHead className="py-3 px-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Datum</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Důvod</TableHead>
                  <TableHead className="py-3 px-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">
                    Částka
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((item) => (
                  <TableRow key={item.id} className="border-border hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3 px-4 text-sm text-foreground font-bold whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString("cs-CZ")}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-sm text-muted-foreground font-medium">
                      {item.reason}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <Badge
                        className={`${
                          item.amount >= 0 
                            ? "bg-destructive/10 text-destructive border-destructive/20" 
                            : "bg-success/10 text-success border-success/20"
                        } text-xs font-black tabular-nums border`}
                        variant="outline"
                      >
                        {item.amount >= 0 ? "+" : ""}
                        {item.amount.toLocaleString("cs-CZ")} Kč
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
