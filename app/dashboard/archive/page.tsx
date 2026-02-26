import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getTickets, getArchivedSemesters } from "@/lib/actions/tickets"
import { isAdmin } from "@/lib/utils/roles"
import { ArchiveClient } from "./archive-client"

export const dynamic = "force-dynamic"

export default async function ArchivePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const userId = session.user.id
  const userRole = session.user.role || "MEMBER"
  const userSectionId = session.user.sectionId || null

  // Determine initial filters based on role
  const initialFilters = isAdmin(userRole) ? {} : { requesterId: userId }

  // Fetch available semesters and initial archived tickets
  const [{ semesters = [] }, { tickets: rawTickets = [] }] = await Promise.all([
    getArchivedSemesters(initialFilters),
    getTickets({ ...initialFilters, type: "historical" }),
  ])

  const tickets = rawTickets.map(t => ({
    ...t,
    budgetAmount: Number(t.budgetAmount),
    receipts: t.receipts.map(r => ({
      ...r,
      amount: Number(r.amount),
    })),
  }))

  return (
    <div className="pb-20 lg:pb-0 h-full">
      <div className="lg:h-[calc(100dvh-6rem)]">
        <ArchiveClient
          initialTickets={tickets}
          initialSemesters={semesters}
          currentUserId={userId}
          currentUserRole={userRole}
          currentUserSectionId={userSectionId}
        />
      </div>
    </div>
  )
}
