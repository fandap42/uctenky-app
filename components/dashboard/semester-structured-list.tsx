"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSemester, monthNames } from "@/lib/utils/semesters"
import { CSVExportButton } from "./csv-export-button"
import { PaidStatusSelect } from "./paid-status-select"
import { ApprovalActions } from "@/components/requests/approval-actions"
import { EditTransactionDialog } from "./edit-transaction-dialog"
import { ReceiptUpload } from "@/components/receipts/receipt-upload"
import { DeleteButton } from "./delete-button"
import { deleteTransaction, removeReceipt } from "@/lib/actions/transactions"

interface Transaction {
  id: string
  purpose: string
  store?: string | null
  status: string
  isPaid: boolean
  estimatedAmount: any
  finalAmount: any
  receiptUrl: string | null
  createdAt: Date | string
  dueDate?: Date | null
  requester?: { id: string; fullName: string } | null
  section?: { id: string; name: string } | null
}

interface StructuredListProps {
  transactions: Transaction[]
  isAdmin?: boolean
  showActions?: boolean
  showSection?: boolean
  showRequester?: boolean
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-500",
  PENDING: "bg-yellow-500",
  APPROVED: "bg-green-500",
  PURCHASED: "bg-blue-500",
  VERIFIED: "bg-purple-500",
  REJECTED: "bg-red-500",
}

const statusLabels: Record<string, string> = {
  DRAFT: "Koncept",
  PENDING: "Čeká",
  APPROVED: "Schváleno",
  PURCHASED: "Účtenka",
  VERIFIED: "Ověřeno",
  REJECTED: "Zamítnuto",
}

export function SemesterStructuredList({
  transactions,
  isAdmin = false,
  showActions = false,
  showSection = true,
  showRequester = true,
}: StructuredListProps) {
  // 1. Group by Semester
  const semesters: Record<string, Record<number, Transaction[]>> = {}

  transactions.forEach((tx) => {
    const date = new Date(tx.createdAt)
    const semKey = getSemester(date)
    const monthKey = date.getMonth() + 1

    if (!semesters[semKey]) semesters[semKey] = {}
    if (!semesters[semKey][monthKey]) semesters[semKey][monthKey] = []
    
    semesters[semKey][monthKey].push(tx)
  })

  // 2. Sort semesters (newest first)
  const sortedSemKeys = Object.keys(semesters).sort((a, b) => {
    const yearA = parseInt(a.slice(2))
    const yearB = parseInt(b.slice(2))
    if (yearA !== yearB) return yearB - yearA
    return b.charAt(0).localeCompare(a.charAt(0))
  })

  return (
    <div className="space-y-12">
      {sortedSemKeys.map((semKey) => (
        <div key={semKey} className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white bg-slate-800 px-4 py-1 rounded-lg border border-slate-700">
              {semKey}
            </h2>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <div className="grid gap-6">
            {Object.keys(semesters[semKey])
              .map(Number)
              .sort((a, b) => b - a)
              .map((monthKey) => {
                const monthTxs = semesters[semKey][monthKey]
                return (
                  <Card key={`${semKey}-${monthKey}`} className="bg-slate-800/30 border-slate-700/50 overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-slate-800/50 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-medium text-slate-300">
                        {monthNames[monthKey]}
                      </CardTitle>
                      {isAdmin && (
                        <CSVExportButton 
                          transactions={monthTxs} 
                          filename={`export-${semKey}-${monthKey}.csv`}
                        />
                      )}
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700 hover:bg-transparent">
                            {showRequester && <TableHead className="text-slate-400 text-xs py-2">Žadatel</TableHead>}
                            {showSection && <TableHead className="text-slate-400 text-xs py-2">Sekce</TableHead>}
                            <TableHead className="text-slate-400 text-xs py-2">Účel</TableHead>
                            <TableHead className="text-slate-400 text-xs py-2">Obchod</TableHead>
                            <TableHead className="text-slate-400 text-xs py-2">Částka</TableHead>
                            <TableHead className="text-slate-400 text-xs py-2">Stav</TableHead>
                            <TableHead className="text-slate-400 text-xs py-2">Datum</TableHead>
                            {isAdmin && <TableHead className="text-slate-400 text-xs py-2 text-right">Proplaceno</TableHead>}
                            {(showActions || isAdmin) && <TableHead className="text-slate-400 text-xs py-2 text-right">Akce</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {monthTxs.map((tx) => (
                            <TableRow key={tx.id} className="border-slate-700/50 hover:bg-slate-700/20">
                              {showRequester && (
                                <TableCell className="py-2 text-sm text-white">
                                  {tx.requester?.fullName || "Neznámý"}
                                </TableCell>
                              )}
                              {showSection && (
                                <TableCell className="py-2 text-xs text-slate-400">
                                  {tx.section?.name || "-"}
                                </TableCell>
                              )}
                              <TableCell className="py-2">
                                <p className="text-sm text-white font-medium truncate max-w-[150px]">{tx.purpose}</p>
                              </TableCell>
                              <TableCell className="py-2 text-xs text-slate-500 italic">
                                {tx.store || "-"}
                              </TableCell>
                              <TableCell className="py-2 text-sm text-white whitespace-nowrap">
                                {Number(tx.finalAmount || tx.estimatedAmount).toLocaleString("cs-CZ")} Kč
                                {tx.receiptUrl && (
                                  <a href={tx.receiptUrl} target="_blank" rel="noopener" className="ml-1 text-blue-400">📎</a>
                                )}
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge className={`${statusColors[tx.status]} text-[10px] px-1.5 h-5 text-white`}>
                                  {statusLabels[tx.status]}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2 text-[10px] text-slate-400 whitespace-nowrap">
                                {new Date(tx.createdAt).toLocaleDateString("cs-CZ")}
                              </TableCell>
                              {isAdmin && (
                                <TableCell className="py-2 text-right">
                                  <PaidStatusSelect transactionId={tx.id} initialStatus={tx.isPaid} />
                                </TableCell>
                              )}
                              {(showActions || isAdmin) && (
                                <TableCell className="py-2 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {isAdmin && (
                                      <>
                                        {tx.receiptUrl && (
                                          <DeleteButton 
                                            onDelete={() => removeReceipt(tx.id)} 
                                            iconOnly 
                                            title="Odstranit účtenku?" 
                                            description="Žádost bude vrácena do stavu 'Schváleno'."
                                            className="text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10"
                                          />
                                        )}
                                        <EditTransactionDialog transaction={tx} />
                                        <DeleteButton onDelete={() => deleteTransaction(tx.id)} iconOnly />
                                      </>
                                    )}
                                    {!isAdmin && (
                                      <>
                                        {tx.status === "APPROVED" && <ReceiptUpload transactionId={tx.id} />}
                                        {(tx.status === "PENDING" || tx.status === "DRAFT") && (
                                          <DeleteButton onDelete={() => deleteTransaction(tx.id)} iconOnly />
                                        )}
                                      </>
                                    )}
                                    <ApprovalActions transactionId={tx.id} currentStatus={tx.status} />
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}
