import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SemesterStructuredList } from "@/components/dashboard/semester-structured-list"
import { getSemester, sortSemesterKeys, getSemesterRange } from "@/lib/utils/semesters"

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

  // Get all unique semester keys
  const transactionDates = await prisma.transaction.findMany({
    select: { createdAt: true, dueDate: true },
  })

  const semesterKeys = Array.from(new Set(
    transactionDates.map(d => getSemester(new Date(d.dueDate || d.createdAt)))
  ))

  const sortedKeys = sortSemesterKeys(semesterKeys)
  const currentSem = sortedKeys[0]

  // Get initial transactions (only for the expanded semester)
  const initialTransactionsRaw = currentSem ? await prisma.transaction.findMany({
    where: { 
      createdAt: { 
        gte: getSemesterRange(currentSem).start, 
        lte: getSemesterRange(currentSem).end 
      }
    },
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { id: true, fullName: true } },
      section: { select: { id: true, name: true } },
    },
  }) : []

  const initialTransactions = initialTransactionsRaw.map(t => ({
    ...t,
    estimatedAmount: Number(t.estimatedAmount),
    finalAmount: t.finalAmount ? Number(t.finalAmount) : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
  })) as any

  // Stats across all time
  const pendingCount = await prisma.transaction.count({
    where: { status: "PENDING" }
  })
  const purchasedCount = await prisma.transaction.count({
    where: { status: "PURCHASED" }
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2">Správa účtenek</h1>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[160px]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Čeká na schválení</h3>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-4xl font-black text-[oklch(0.75_0.15_85)] tabular-nums">
              {pendingCount}
            </span>
          </div>
        </Card>

        <Card className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[160px]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">K ověření</h3>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-4xl font-black text-foreground tabular-nums">
              {purchasedCount}
            </span>
          </div>
        </Card>
      </div>

      {/* Structured Transactions List */}
      <div className="space-y-4">
        <SemesterStructuredList
          initialTransactions={initialTransactions}
          semesterKeys={semesterKeys}
          isAdmin={true}
          showActions={true}
        />
      </div>
    </div>
  )
}
