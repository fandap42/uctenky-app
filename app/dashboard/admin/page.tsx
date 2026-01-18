import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ApprovalActions } from "@/components/requests/approval-actions"
import { BudgetProgress } from "@/components/dashboard/budget-progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CollapsibleBudget } from "@/components/dashboard/collapsible-budget"
import { EditBudgetDialog } from "@/components/dashboard/edit-budget-dialog"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'

const statusLabels: Record<string, string> = {
  DRAFT: "Koncept",
  PENDING: "Čeká na schválení",
  APPROVED: "Schváleno",
  PURCHASED: "Nakoupeno",
  VERIFIED: "Ověřeno",
  REJECTED: "Zamítnuto",
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-500",
  PENDING: "bg-yellow-500",
  APPROVED: "bg-green-500",
  PURCHASED: "bg-blue-500",
  VERIFIED: "bg-purple-500",
  REJECTED: "bg-red-500",
}

export default async function FinanceDashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Get user's profile to check role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, fullName: true, role: true },
  })

  // Redirect if not admin
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Fetch all transactions
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { id: true, fullName: true } },
      section: { select: { id: true, name: true } },
    },
  })

  // Fetch all sections with budget info
  const sections = await prisma.section.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })

  // Calculate spent and pending per section
  const sectionStats = sections.map((section) => {
    const sectionTransactions = transactions.filter(
      (t) => t.section?.id === section.id
    )

    const spent = sectionTransactions
      .filter((t) => t.status === "VERIFIED" || t.status === "PURCHASED")
      .reduce((sum, t) => sum + Number(t.finalAmount || t.estimatedAmount), 0)

    const pending = sectionTransactions
      .filter((t) => t.status === "PENDING" || t.status === "APPROVED")
      .reduce((sum, t) => sum + Number(t.estimatedAmount), 0)

    return {
      ...section,
      spent,
      pending,
    }
  })

  const pendingTransactions = transactions.filter((t) => t.status === "PENDING")
  const purchasedTransactions = transactions.filter((t) => t.status === "PURCHASED")

  // Calculate totals
  const totalSpent = transactions
    .filter((t) => t.status === "VERIFIED" || t.status === "PURCHASED")
    .reduce((sum, t) => sum + Number(t.finalAmount || t.estimatedAmount), 0)

  const totalBudget = sections.reduce((sum, s) => sum + Number(s.budgetCap), 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Správa účtenek</h1>
        <p className="text-slate-400">
          Přehled všech finančních operací a rozpočtů
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700 hover:border-yellow-500/50 transition-colors">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Čeká na schválení
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-yellow-400">
              {pendingTransactions.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              K ověření
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-blue-400">
              {purchasedTransactions.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 hover:border-green-500/50 transition-colors">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Celkem vyčerpáno
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-green-400">
              {totalSpent.toLocaleString("cs-CZ")} Kč
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Celkový rozpočet
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-white">
              {totalBudget.toLocaleString("cs-CZ")} Kč
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Budget Progress per Section (Collapsible) */}
      <CollapsibleBudget>
        {sectionStats.length > 0 ? (
          sectionStats.map((section) => (
            <BudgetProgress
              key={section.id}
              sectionName={section.name}
              budgetCap={Number(section.budgetCap)}
              spent={section.spent}
              pending={section.pending}
              action={
                <EditBudgetDialog 
                  sectionId={section.id} 
                  sectionName={section.name} 
                  currentBudget={Number(section.budgetCap)}
                  trigger={
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-500 hover:text-blue-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </Button>
                  }
                />
              }
            />
          ))
        ) : (
          <p className="text-center text-slate-400 py-4">
            Žádné sekce nebyly nalezeny
          </p>
        )}
      </CollapsibleBudget>

      {/* Transactions List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Všechny žádosti</h2>
        <TransactionTable transactions={transactions} showActions />
      </div>
    </div>
  )
}

interface Transaction {
  id: string
  purpose: string
  status: string
  estimatedAmount: unknown
  finalAmount: unknown
  receiptUrl: string | null
  createdAt: Date
  dueDate: Date | null
  requester: { id: string; fullName: string } | null
  section: { id: string; name: string } | null
}

function TransactionTable({
  transactions,
  showActions = false,
}: {
  transactions: Transaction[]
  showActions?: boolean
}) {
  if (transactions.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-12 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto text-slate-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-slate-400">Žádné žádosti v této kategorii</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-400">Žadatel</TableHead>
              <TableHead className="text-slate-400">Sekce</TableHead>
              <TableHead className="text-slate-400">Účel</TableHead>
              <TableHead className="text-slate-400">Částka</TableHead>
              <TableHead className="text-slate-400">Stav</TableHead>
              <TableHead className="text-slate-400">Předpokládané datum</TableHead>
              <TableHead className="text-slate-400">Datum vytvoření</TableHead>
              {showActions && <TableHead className="text-slate-400 text-right">Akce</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id} className="border-slate-700 hover:bg-slate-700/50">
                <TableCell className="font-medium text-white">
                  {tx.requester?.fullName || "Neznámý"}
                </TableCell>
                <TableCell className="text-slate-300">
                  {tx.section?.name || "Neznámá"}
                </TableCell>
                <TableCell className="text-slate-300 max-w-[200px] truncate">
                  {tx.purpose}
                </TableCell>
                <TableCell className="text-white">
                  {tx.finalAmount
                    ? `${Number(tx.finalAmount).toLocaleString("cs-CZ")} Kč`
                    : `${Number(tx.estimatedAmount).toLocaleString("cs-CZ")} Kč`}
                  {tx.receiptUrl && (
                    <a
                      href={tx.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-400 hover:text-blue-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 inline"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={`${statusColors[tx.status]} text-white`}>
                    {statusLabels[tx.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-400">
                  {tx.dueDate ? new Date(tx.dueDate).toLocaleDateString("cs-CZ") : "-"}
                </TableCell>
                <TableCell className="text-slate-400">
                  {new Date(tx.createdAt).toLocaleDateString("cs-CZ")}
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <ApprovalActions transactionId={tx.id} currentStatus={tx.status} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
