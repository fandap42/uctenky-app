import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RequestForm } from "@/components/requests/request-form"
import { SemesterStructuredList } from "@/components/dashboard/semester-structured-list"
import { getSemester, sortSemesterKeys, getSemesterRange } from "@/lib/utils/semesters"

import { getSemesterTotals } from "@/lib/actions/transactions"

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

  // Fetch semester totals for the user
  const totalsResult = await getSemesterTotals({ requesterId: userId })
  const semesterTotals = "totals" in totalsResult ? totalsResult.totals : {}

  // Get all active sections for the form dropdown
  const sections = await prisma.section.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  // Get all unique semester keys for this user
  const transactionDates = await prisma.transaction.findMany({
    where: { requesterId: userId },
    select: { createdAt: true, dueDate: true },
  })

  const semesterKeys = Array.from(new Set(
    transactionDates.map(d => getSemester(new Date(d.dueDate || d.createdAt)))
  ))

  // Get current/latest semester matches
  const currentSem = sortSemesterKeys(semesterKeys)[0]
  
  // Get initial transactions (only for the expanded semester)
  const initialTransactionsRaw = currentSem ? await prisma.transaction.findMany({
    where: { 
      requesterId: userId,
      createdAt: { 
        gte: getSemesterRange(currentSem).start, 
        lte: getSemesterRange(currentSem).end 
      }
    },
    orderBy: { createdAt: "desc" },
    include: {
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

  // Stats for the current semester
  const semesterRange = currentSem ? getSemesterRange(currentSem) : null
  const semesterFilter = semesterRange ? {
    createdAt: { gte: semesterRange.start, lte: semesterRange.end }
  } : {}

  // Get pending count (all-time)
  const pendingCount = await prisma.transaction.count({
    where: { requesterId: userId, status: "PENDING" }
  })

  // Get total requests (current semester)
  const totalTransactionsCount = await prisma.transaction.count({
    where: { requesterId: userId, ...semesterFilter }
  })

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
              {totalTransactionsCount}
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
          initialTransactions={initialTransactions}
          semesterKeys={semesterKeys}
          semesterTotals={semesterTotals}
          showSection={true} 
          showRequester={false}
          showActions={true}
          filters={{ requesterId: userId }}
        />
      </div>
    </div>
  )
}
