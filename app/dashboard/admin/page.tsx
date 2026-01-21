import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SemesterStructuredList } from "@/components/dashboard/semester-structured-list"

export const dynamic = "force-dynamic"

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
  const rawTransactionsList = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { id: true, fullName: true } },
      section: { select: { id: true, name: true } },
    },
  })

  // Serialize Decimals for Client Components
  const transactions = rawTransactionsList.map(t => ({
    ...t,
    estimatedAmount: Number(t.estimatedAmount),
    finalAmount: t.finalAmount ? Number(t.finalAmount) : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
  })) as any

  const pendingTransactions = (transactions as any[]).filter((t: any) => t.status === "PENDING")
  const purchasedTransactions = (transactions as any[]).filter((t: any) => t.status === "PURCHASED")

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Správa účtenek</h1>
          <p className="text-slate-400">
            Přehled všech finančních operací
          </p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Čeká na schválení
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-yellow-400">
              {pendingTransactions.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              K ověření
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-blue-400">
              {purchasedTransactions.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Structured Transactions List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Přehled žádostí</h2>
        <SemesterStructuredList
          transactions={transactions}
          isAdmin={true}
          showActions={true}
        />
      </div>
    </div>
  )
}
