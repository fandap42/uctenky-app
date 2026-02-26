import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getTickets } from "@/lib/actions/tickets"
import { TicketDashboardClient } from "./ticket-dashboard-client"
import { RequestFormClient } from "@/components/requests/request-form-client"

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
  const tickets = rawTickets.map(t => ({
    ...t,
    budgetAmount: Number(t.budgetAmount),
    receipts: t.receipts.map(r => ({
      ...r,
      amount: Number(r.amount)
    }))
  }))

  return (
    <div className="pb-20 lg:pb-0 h-full">
      <div className="lg:h-[calc(100dvh-6rem)]">
        <TicketDashboardClient
          initialTickets={tickets}
          currentUserId={userId}
          currentUserRole={userRole}
          headerAction={<RequestFormClient key="request-form" sections={sections} />}
        />
      </div>
    </div>
  )
}

function isAdmin(role: string) {
  return role === "ADMIN"
}

