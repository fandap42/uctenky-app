import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SemesterStructuredList } from "@/components/dashboard/semester-structured-list"
import { isHeadRole, isAdmin, getSectionForRole } from "@/lib/utils/roles"
import { getSemester, sortSemesterKeys, getSemesterRange } from "@/lib/utils/semesters"

import { getSemesterTotals } from "@/lib/actions/transactions"
import { SectionFilter } from "@/components/dashboard/section-filter"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ sectionId?: string }>
}

export default async function SectionHeadDashboardPage({ searchParams }: PageProps) {
  const session = await auth()
  const { sectionId } = await searchParams

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Get user's profile to check role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, fullName: true, role: true },
  })

  // Redirect if not HEAD_* or admin
  if (!user || (!isHeadRole(user.role) && !isAdmin(user.role))) {
    redirect("/dashboard")
  }

  // Handle section selection
  let section = null
  let allSections: any[] = []
  const userIsAdmin = isAdmin(user.role)

  if (userIsAdmin) {
    allSections = await prisma.section.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    if (sectionId) {
      section = allSections.find(s => s.id === sectionId) || null
    }
    
    // Default to first section if nothing selected
    if (!section && allSections.length > 0) {
      section = allSections[0]
    }
  } else {
    const sectionName = getSectionForRole(user.role)
    if (sectionName) {
      section = await prisma.section.findFirst({
        where: { name: sectionName, isActive: true },
        select: { id: true, name: true },
      })
    }
  }

  if (!section) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2">Žádosti sekce</h1>
          <p className="text-muted-foreground">Nebyla nalezena žádná aktivní sekce.</p>
        </div>
      </div>
    )
  }

  // Fetch unique semester keys for this section
  const transactionDates = await prisma.transaction.findMany({
    where: { sectionId: section.id },
    select: { createdAt: true, dueDate: true },
  })

  const semesterKeys = Array.from(new Set(
    transactionDates.map(d => getSemester(new Date(d.dueDate || d.createdAt)))
  ))

  const sortedKeys = sortSemesterKeys(semesterKeys)
  const currentSem = sortedKeys[0]

  // Fetch initial transactions for the latest semester
  const initialTransactionsRaw = currentSem ? await prisma.transaction.findMany({
    where: { 
      sectionId: section.id,
      createdAt: { 
        gte: getSemesterRange(currentSem).start, 
        lte: getSemesterRange(currentSem).end 
      }
    },
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { id: true, fullName: true } },
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

  // Fetch semester totals for the section
  const totalsResult = await getSemesterTotals({ sectionId: section.id })
  const semesterTotals = "totals" in totalsResult ? totalsResult.totals : {}

  // Stats for the section
  const totalSectionRequests = await prisma.transaction.count({
    where: { sectionId: section.id }
  })

  const pendingCount = await prisma.transaction.count({
    where: { sectionId: section.id, status: "PENDING" }
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2">
            Žádosti sekce: {section.name}
          </h1>
        </div>
        {userIsAdmin && (
          <SectionFilter sections={allSections} currentSectionId={section.id} />
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border shadow-sm rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[160px]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Celkem žádostí sekce</h3>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-4xl font-black text-foreground tabular-nums">
              {totalSectionRequests}
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
        <h2 className="text-xl font-semibold text-foreground">Přehled žádostí sekce</h2>
        <SemesterStructuredList
          initialTransactions={initialTransactions}
          semesterKeys={semesterKeys}
          semesterTotals={semesterTotals}
          showSection={false}
          showActions={false}
          isAdmin={false}
          filters={{ sectionId: section.id }}
        />
      </div>
    </div>
  )
}
