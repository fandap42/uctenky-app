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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export default async function SectionHeadDashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Get user's profile to check role and section
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, fullName: true, role: true, sectionId: true },
  })

  // Redirect if not section head or admin
  if (!user || (user.role !== "SECTION_HEAD" && user.role !== "ADMIN")) {
    redirect("/dashboard")
  }

  // If no section assigned, show message
  if (!user.sectionId) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Žádosti sekce</h1>
          <p className="text-slate-400">
            Nemáte přiřazenou žádnou sekci. Kontaktujte administrátora.
          </p>
        </div>
      </div>
    )
  }

  // Fetch section's transactions
  const transactions = await prisma.transaction.findMany({
    where: { sectionId: user.sectionId },
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { id: true, fullName: true } },
      section: { select: { id: true, name: true } },
    },
  })

  // Get section info
  const section = await prisma.section.findUnique({
    where: { id: user.sectionId },
    select: { id: true, name: true, budgetCap: true },
  })

  const pendingTransactions = transactions.filter((t: { status: string }) => t.status === "PENDING")
  const purchasedTransactions = transactions.filter((t: { status: string }) => t.status === "PURCHASED")

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Žádosti sekce: {section?.name || "Neznámá sekce"}
        </h1>
        <p className="text-slate-400">
          Spravujte žádosti členů vaší sekce
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-slate-400">
                Rozpočet sekce
              </CardDescription>
              {section && (
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
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {section?.budgetCap ? Number(section.budgetCap).toLocaleString("cs-CZ") : 0} Kč
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-white"
          >
            Čekající ({pendingTransactions.length})
          </TabsTrigger>
          <TabsTrigger
            value="purchased"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-white"
          >
            K ověření ({purchasedTransactions.length})
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-white"
          >
            Všechny ({transactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <TransactionTable transactions={pendingTransactions} showActions />
        </TabsContent>

        <TabsContent value="purchased">
          <TransactionTable transactions={purchasedTransactions} showActions />
        </TabsContent>

        <TabsContent value="all">
          <TransactionTable transactions={transactions} />
        </TabsContent>
      </Tabs>
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
                <TableCell className="text-slate-300">{tx.purpose}</TableCell>
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
