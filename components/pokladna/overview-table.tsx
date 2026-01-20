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

interface Transaction {
  id: string
  purpose: string
  store?: string | null
  estimatedAmount: number
  finalAmount: number | null
  isPaid: boolean
  expenseType: string
  dueDate: string | null
  section?: { name: string } | null
}

interface Deposit {
  id: string
  amount: number
  description: string | null
  date: string
}

interface OverviewTableProps {
  transactions: Transaction[]
  deposits: Deposit[]
}

type RowItem = {
  id: string
  date: Date
  type: "transaction" | "deposit"
  section: string
  purpose: string
  store: string
  amount: number
  expenseType: string
  isPaid?: boolean
}

export function OverviewTable({ transactions, deposits }: OverviewTableProps) {
  // Temporary checkbox state - resets on refresh
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  // Combine transactions and deposits into a single table
  const rows: RowItem[] = []

  // Add transactions
  transactions.forEach((t) => {
    rows.push({
      id: t.id,
      date: new Date(t.dueDate || new Date()),
      type: "transaction",
      section: t.section?.name || "-",
      purpose: t.purpose,
      store: t.store || "-",
      amount: t.finalAmount || t.estimatedAmount,
      expenseType: t.expenseType,
      isPaid: t.isPaid,
    })
  })

  // Add deposits
  deposits.forEach((d) => {
    rows.push({
      id: d.id,
      date: new Date(d.date),
      type: "deposit",
      section: "-",
      purpose: d.description || "Vklad",
      store: "-",
      amount: d.amount,
      expenseType: "-",
    })
  })

  // Sort by date
  rows.sort((a, b) => a.date.getTime() - b.date.getTime())

  function toggleCheck(id: string) {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        Žádné záznamy v tomto měsíci
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700 hover:bg-transparent">
            <TableHead className="text-slate-400 text-xs py-2 w-[100px]">
              Datum
            </TableHead>
            <TableHead className="text-slate-400 text-xs py-2">Sekce</TableHead>
            <TableHead className="text-slate-400 text-xs py-2">Účel</TableHead>
            <TableHead className="text-slate-400 text-xs py-2">Obchod</TableHead>
            <TableHead className="text-slate-400 text-xs py-2 text-right">
              Částka
            </TableHead>
            <TableHead className="text-slate-400 text-xs py-2">Typ</TableHead>
            <TableHead className="text-slate-400 text-xs py-2 w-[50px] text-center">
              ✓
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className={`border-slate-700/50 hover:bg-slate-700/20 ${
                checkedItems.has(row.id) ? "bg-green-900/20" : ""
              }`}
            >
              <TableCell className="py-2 text-sm text-white whitespace-nowrap">
                {row.date.toLocaleDateString("cs-CZ")}
              </TableCell>
              <TableCell className="py-2 text-sm text-white">
                {row.section}
              </TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-2">
                  {row.type === "deposit" && (
                    <Badge className="bg-green-600 text-[10px] px-1.5 h-5">
                      Vklad
                    </Badge>
                  )}
                  <p className="text-sm text-white font-medium truncate max-w-[200px]">
                    {row.purpose}
                  </p>
                </div>
              </TableCell>
              <TableCell className="py-2 text-sm text-white">
                {row.store}
              </TableCell>
              <TableCell
                className={`py-2 text-sm font-medium text-right whitespace-nowrap ${
                  row.type === "deposit" ? "text-green-400" : "text-white"
                }`}
              >
                {row.type === "deposit" ? "+" : "-"}
                {row.amount.toLocaleString("cs-CZ")} Kč
              </TableCell>
              <TableCell className="py-2">
                {row.type === "transaction" ? (
                  <Badge
                    className={`text-[10px] px-1.5 h-5 ${
                      row.expenseType === "MATERIAL"
                        ? "bg-purple-600"
                        : "bg-blue-600"
                    }`}
                  >
                    {row.expenseType === "MATERIAL" ? "Materiál" : "Služba"}
                  </Badge>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </TableCell>
              <TableCell className="py-2 text-center">
                <Checkbox
                  checked={checkedItems.has(row.id)}
                  onCheckedChange={() => toggleCheck(row.id)}
                  className="border-slate-500 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
