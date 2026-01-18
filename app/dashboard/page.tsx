import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RequestForm } from "@/components/requests/request-form"
import { SemesterStructuredList } from "@/components/dashboard/semester-structured-list"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, role: true, sectionId: true },
  })

  // Get all user's transactions
  const rawTransactions = await prisma.transaction.findMany({
    where: { requesterId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      section: { select: { id: true, name: true } },
    },
  })

  // Serialize Decimals for Client Components
  const transactions = rawTransactions.map(t => ({
    ...t,
    estimatedAmount: Number(t.estimatedAmount),
    finalAmount: t.finalAmount ? Number(t.finalAmount) : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
  })) as any

  // Get stats
  const totalCount = transactions.length
  const pendingCount = (transactions as any[]).filter((t: any) => t.status === "PENDING").length
  // Calculate spent (using ALL transactions for accurate budget)
  const totalSpent = (transactions as any[])
    .filter((t: any) => t.status === "VERIFIED" || t.status === "PURCHASED")
    .reduce((sum: number, t: any) => sum + Number(t.finalAmount || t.estimatedAmount), 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Vítejte, {user?.fullName?.split(" ")[0] || "uživateli"}!
          </h1>
          <p className="text-slate-400">
            Přehled vašich finančních žádostí a aktivit
          </p>
        </div>
        <RequestForm />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Celkem žádostí
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-white">
              {totalCount}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 hover:border-yellow-500/50 transition-colors">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Čeká na schválení
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-yellow-400">
              {pendingCount}
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
      </div>

      {/* Structured Transactions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Moje žádosti</h2>
        </div>
        <SemesterStructuredList 
          transactions={transactions} 
          showSection={true} 
          showRequester={false}
          showActions={true}
        />
      </div>
    </div>
  )
}
