import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { isHeadRole, isAdmin, getSectionForRole } from "@/lib/utils/roles"
import { getTickets } from "@/lib/actions/tickets"
import { SectionFilter } from "@/components/dashboard/section-filter"
import { SectionDashboardClient } from "./section-dashboard-client"

export const dynamic = "force-dynamic"

type SectionSummary = {
  id: string
  name: string
}

interface PageProps {
  searchParams: Promise<{ sectionId?: string }>
}

export default async function SectionHeadDashboardPage({ searchParams }: PageProps) {
  const session = await auth()
  const { sectionId } = await searchParams
  const selectedSectionId = sectionId ?? "all"

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
  let section: SectionSummary | null = null
  let allSections: SectionSummary[] = []
  const userIsAdmin = isAdmin(user.role)

  if (userIsAdmin) {
    allSections = await prisma.section.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    if (sectionId && sectionId !== "all") {
      section = allSections.find(s => s.id === sectionId) || null
    }

    if (!sectionId || sectionId === "all") {
      section = { id: "all", name: "Všechny sekce" }
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
          <h1 className="hidden md:block text-3xl font-black text-foreground mb-2">Žádosti sekce</h1>
          <p className="text-muted-foreground">Nebyla nalezena žádná aktivní sekce.</p>
        </div>
      </div>
    )
  }

  // Fetch tickets for the section (or all sections for admins)
  const { tickets: rawTickets = [] } = await getTickets({
    sectionId: section.id === "all" ? undefined : section.id,
  })

  // Explicitly serialize to ensure no Decimal objects pass through
  const tickets = rawTickets.map(t => ({
    ...t,
    budgetAmount: Number(t.budgetAmount),
    receipts: t.receipts.map(r => ({
      ...r,
      amount: Number(r.amount)
    }))
  }))

  // Stats for the section (kept for potential future use)
  // const pendingCount = tickets.filter(t => t.status === "PENDING_APPROVAL").length
  // const totalCount = tickets.length

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className={userIsAdmin ? "flex items-center justify-between" : "hidden md:flex items-center justify-between"}>
        <div>
          <h1 className="hidden md:block text-3xl font-black text-foreground mb-2">
            Žádosti sekce: {section.name}
          </h1>
        </div>
        {userIsAdmin && (
          <SectionFilter sections={allSections} currentSectionId={selectedSectionId} />
        )}
      </div>

      {/* Kanban Board */}
      <SectionDashboardClient 
        initialTickets={tickets}
        currentUserId={session.user.id}
        currentUserRole={user.role}
      />
    </div>
  )
}

