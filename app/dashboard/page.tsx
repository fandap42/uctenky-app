import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    select: { id: true, fullName: true, role: true },
  })

  // Get all active sections for the form dropdown
  const sections = await prisma.section.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
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
          <h1 className="text-3xl font-black text-foreground mb-2">
            Přehled
          </h1>
        </div>
        <RequestForm sections={sections} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[160px]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Celkem žádostí</h3>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-4xl font-black text-foreground tabular-nums">
              {totalCount}
            </span>
          </div>
        </Card>

        <Card className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[160px]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Čeká na schválení</h3>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-4xl font-black text-[oklch(0.75_0.15_85)] tabular-nums">
              {pendingCount}
            </span>
          </div>
        </Card>
      </div>

      {/* Structured Transactions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Moje žádosti</h2>
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
