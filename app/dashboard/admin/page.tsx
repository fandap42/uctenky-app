import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { SemesterStructuredList } from "@/components/dashboard/semester-structured-list"
import { getSemester } from "@/lib/utils/semesters"

import { getTicketsBySemester, getTicketSemesterTotals } from "@/lib/actions/tickets"

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

  // Get all unique semester keys from Tickets
  const ticketDates = await prisma.ticket.findMany({
    select: { createdAt: true, targetDate: true },
  })

  const semesterKeys = Array.from(new Set(
    ticketDates.map(d => getSemester(new Date(d.targetDate || d.createdAt)))
  ))

  const sortedKeys = sortSemesterKeys(semesterKeys)
  const currentSem = sortedKeys[0]

  // Get initial tickets (only for the expanded semester)
  const { transactions: initialTransactions = [] } = currentSem 
    ? await getTicketsBySemester(currentSem) 
    : { transactions: [] }

  // Fetch global ticket semester totals
  const totalsResult = await getTicketSemesterTotals()
  const semesterTotals = "totals" in totalsResult ? totalsResult.totals : {}

  const pendingCount = await prisma.ticket.count({
    where: { status: "PENDING_APPROVAL" }
  })
  const purchasedCount = await prisma.ticket.count({
    where: { 
      status: "APPROVED",
      receipts: { some: {} } // Has at least one receipt but still in APPROVED phase
    }
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2">Správa žádostí</h1>
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

      {/* Structured List */}
      <div className="space-y-4">
        <SemesterStructuredList
          initialTransactions={initialTransactions as any}
          semesterKeys={sortedKeys}
          semesterTotals={semesterTotals}
          isAdmin={true}
          showActions={true}
        />
      </div>
    </div>
  )
}
