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

interface HistoryItem {
  id: string
  amount: number
  reason: string
  createdAt: string
}

interface HistoryDialogProps {
  title: string
  items: HistoryItem[]
  type: "debt" | "cash"
}

export function HistoryDialog({ title, items, type }: HistoryDialogProps) {
  const [open, setOpen] = useState(false)

  const total = items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`text-xs ${
            type === "debt"
              ? "text-red-400 hover:text-red-300"
              : "text-yellow-400 hover:text-yellow-300"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Historie
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Celkem: {total.toLocaleString("cs-CZ")} Kč
          </DialogDescription>
        </DialogHeader>
        {items.length === 0 ? (
          <p className="text-slate-400 text-center py-8">Žádné záznamy</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-400 text-xs">Datum</TableHead>
                <TableHead className="text-slate-400 text-xs">Důvod</TableHead>
                <TableHead className="text-slate-400 text-xs text-right">
                  Částka
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="border-slate-700/50">
                  <TableCell className="py-2 text-sm text-white whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString("cs-CZ")}
                  </TableCell>
                  <TableCell className="py-2 text-sm text-slate-300">
                    {item.reason}
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    <Badge
                      className={`${
                        item.amount >= 0 ? "bg-red-600" : "bg-green-600"
                      } text-xs`}
                    >
                      {item.amount >= 0 ? "+" : ""}
                      {item.amount.toLocaleString("cs-CZ")} Kč
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  )
}
