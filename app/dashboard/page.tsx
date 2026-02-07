import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { RequestForm } from "@/components/requests/request-form"
import { getTickets } from "@/lib/actions/tickets"
import { TicketDashboardClient } from "./ticket-dashboard-client"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id
  const userRole = session?.user?.role || "MEMBER"

  if (!userId) {
    return null
  }

  // Get all active sections for the form dropdown
  const sections = await prisma.section.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  // Fetch tickets based on role
  // If ADMIN, fetch all. If MEMBER, fetch only theirs.
  const filters = isAdmin(userRole) ? {} : { requesterId: userId }
  const { tickets: rawTickets = [] } = await getTickets(filters)

  // Explicitly serialize to ensure no Decimal objects pass through
  type SerializedTicket = {
    id: string
    purpose: string
    budgetAmount: number
    status: (typeof rawTickets)[number]['status']
    requesterId: string
    requester: { fullName: string }
    sectionId: string
    section: { name: string }
    receipts: Array<{ amount: number } & Omit<(typeof rawTickets)[number]['receipts'][number], 'amount'>>
    createdAt: (typeof rawTickets)[number]['createdAt']
    targetDate: (typeof rawTickets)[number]['targetDate']
    isFiled?: boolean
  }
  
  const tickets: SerializedTicket[] = rawTickets.map(t => ({
    ...t,
    budgetAmount: Number(t.budgetAmount),
    receipts: t.receipts.map(r => ({
      ...r,
      amount: Number(r.amount)
    }))
  }))

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2">
            Přehled
          </h1>
        </div>
        <RequestForm sections={sections} />
      </div>

      <TicketDashboardClient 
        initialTickets={tickets} 
        currentUserId={userId}
        currentUserRole={userRole}
      />
    </div>
  )
}

function isAdmin(role: string) {
  return role === "ADMIN"
}

