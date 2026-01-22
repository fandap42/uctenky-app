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
          <h1 className="text-3xl font-black text-foreground mb-2">Správa účtenek</h1>
          <p className="text-muted-foreground">
            Přehled všech finančních operací pro administrátory
          </p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-sm border-l-4 border-l-[oklch(0.85_0.20_85)]">
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground font-bold uppercase tracking-wider text-xs">
              Čeká na schválení
            </CardDescription>
            <CardTitle className="text-4xl font-black text-foreground tabular-nums">
              {pendingTransactions.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-card border-border shadow-sm border-l-4 border-l-secondary">
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground font-bold uppercase tracking-wider text-xs">
              K ověření
            </CardDescription>
            <CardTitle className="text-4xl font-black text-foreground tabular-nums">
              {purchasedTransactions.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Structured Transactions List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Přehled žádostí</h2>
        <SemesterStructuredList
          transactions={transactions}
          isAdmin={true}
          showActions={true}
        />
      </div>
    </div>
  )
}
