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
  const { tickets = [] } = await getTickets(filters)

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-foreground mb-1 tracking-tight">
            Pracovní plocha
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Správa vašich žádostí a účtenek v reálném čase.
          </p>
        </div>
        <RequestForm sections={sections} />
      </div>

      <TicketDashboardClient 
        initialTickets={tickets as any} 
        currentUserId={userId}
        currentUserRole={userRole}
      />
    </div>
  )
}

function isAdmin(role: string) {
  return role === "ADMIN"
}

