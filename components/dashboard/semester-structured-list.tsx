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
import { getSemester, sortSemesterKeys, monthNames } from "@/lib/utils/semesters"
import { PaidStatusSelect } from "./paid-status-select"
import { FiledStatusSelect } from "./filed-status-select"
import { ExpenseTypeSelect } from "./expense-type-select"
import { ApprovalActions } from "@/components/requests/approval-actions"
import { EditTransactionDialog } from "./edit-transaction-dialog"
import { ReceiptUpload } from "@/components/receipts/receipt-upload"
import { DeleteButton } from "./delete-button"
import { deleteTransaction, removeReceipt } from "@/lib/actions/transactions"
import { CollapsibleSemester } from "./collapsible-semester"
import { getTransactionsBySemester } from "@/lib/actions/transactions"

interface Transaction {
  id: string
  purpose: string
  store?: string | null
  status: string
  isPaid: boolean
  isFiled: boolean
  expenseType: string
  estimatedAmount: any
  finalAmount: any
  receiptUrl: string | null
  createdAt: Date | string
  dueDate?: Date | null
  requester?: { id: string; fullName: string } | null
  section?: { id: string; name: string } | null
}

interface StructuredListProps {
  initialTransactions?: Transaction[] // For the first expanded semester
  semesterKeys: string[]
  isAdmin?: boolean
  showActions?: boolean
  showSection?: boolean
  showRequester?: boolean
  filters?: {
    requesterId?: string
    sectionId?: string
    status?: any
  }
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-muted",
  PENDING: "bg-[oklch(0.75_0.15_85)]",
  APPROVED: "bg-[oklch(0.60_0.16_150)]",
  PURCHASED: "bg-primary",
  VERIFIED: "bg-[oklch(0.55_0.15_290)]",
  REJECTED: "bg-destructive",
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
  initialTransactions = [],
  semesterKeys,
  isAdmin = false,
  showActions = false,
  showSection = true,
  showRequester = true,
  filters = {},
}: StructuredListProps) {
  const sortedKeys = sortSemesterKeys(semesterKeys)

  const renderSemesterContent = (data: { transactions: Transaction[] }) => {
    const { transactions } = data
    const monthGroups: Record<number, Transaction[]> = {}

    transactions.forEach((tx) => {
      const date = new Date(tx.dueDate || tx.createdAt)
      const year = date.getFullYear()
      const month = date.getUTCMonth() + 1
      const sortKey = year * 100 + month
      if (!monthGroups[sortKey]) monthGroups[sortKey] = []
      monthGroups[sortKey].push(tx)
    })

    const sortedMonthKeys = Object.keys(monthGroups)
      .map(Number)
      .sort((a, b) => b - a)

    return (
      <div className="grid gap-6">
        {sortedMonthKeys.map((monthKey) => {
          const monthTxs = monthGroups[monthKey]
          const month = monthKey % 100
          return (
            <Card key={monthKey} className="bg-card border-border overflow-hidden">
              <CardHeader className="py-3 px-4 bg-muted/30 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {monthNames[month]}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      {showRequester && <TableHead className="py-2">Žadatel</TableHead>}
                      {showSection && <TableHead className="py-2">Sekce</TableHead>}
                      <TableHead className="py-2">Datum</TableHead>
                      <TableHead className="py-2">Účel</TableHead>
                      <TableHead className="py-2">Obchod</TableHead>
                      <TableHead className="py-2">Částka</TableHead>
                      <TableHead className="py-2">Stav</TableHead>
                      {isAdmin && <TableHead className="py-2">Typ</TableHead>}
                      {isAdmin && <TableHead className="py-2">Proplaceno</TableHead>}
                      {isAdmin && <TableHead className="py-2">Založeno</TableHead>}
                      {(showActions || isAdmin) && <TableHead className="py-2 text-right">Akce</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthTxs.map((tx) => (
                      <TableRow key={tx.id} className="border-border hover:bg-muted/50">
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
                          {new Date(tx.dueDate || tx.createdAt).toLocaleDateString("cs-CZ")}
                        </TableCell>
                        <TableCell className="py-2">
                          <p className="text-sm text-foreground font-medium truncate max-w-[150px]">{tx.purpose}</p>
                        </TableCell>
                        <TableCell className="py-2 text-sm text-foreground">
                          {tx.store || "-"}
                        </TableCell>
                        <TableCell className="py-2 text-sm text-foreground whitespace-nowrap tabular-nums font-semibold">
                          {Number(tx.finalAmount || tx.estimatedAmount).toLocaleString("cs-CZ")} Kč
                          {tx.receiptUrl && (
                            <a href={tx.receiptUrl} target="_blank" rel="noopener" className="ml-1 text-primary">📎</a>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge className={`${statusColors[tx.status]} text-[10px] px-1.5 h-5 text-white`}>
                            {statusLabels[tx.status]}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="py-2">
                            <ExpenseTypeSelect transactionId={tx.id} initialType={tx.expenseType || "MATERIAL"} />
                          </TableCell>
                        )}
                        {isAdmin && (
                          <TableCell className="py-2">
                            <PaidStatusSelect transactionId={tx.id} initialStatus={tx.isPaid} />
                          </TableCell>
                        )}
                        {isAdmin && (
                          <TableCell className="py-2">
                            <FiledStatusSelect transactionId={tx.id} initialStatus={tx.isFiled} />
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
                                      variant="undo"
                                      title="Odstranit účtenku?"
                                      description="Žádost bude vrácena do stavu 'Schváleno'."
                                      className="text-[oklch(0.75_0.15_85)] hover:text-[oklch(0.65_0.15_85)] hover:bg-[oklch(0.75_0.15_85)]/10"
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
                              {isAdmin && <ApprovalActions transactionId={tx.id} currentStatus={tx.status} />}
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
    )
  }

  return (
    <div className="space-y-12">
      {sortedKeys.map((key, index) => (
        <CollapsibleSemester
          key={key}
          semesterKey={key}
          defaultExpanded={index === 0}
          initialData={index === 0 ? { transactions: initialTransactions } : undefined}
          fetchData={() => getTransactionsBySemester(key, filters)}
          renderContent={renderSemesterContent}
        />
      ))}
      {sortedKeys.length === 0 && (
        <div className="py-20 text-center text-muted-foreground italic font-medium">
          Žádné žádosti k zobrazení
        </div>
      )}
    </div>
  )
}
