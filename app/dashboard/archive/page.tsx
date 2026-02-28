import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getTickets, getArchivedSemesters } from "@/lib/actions/tickets"
import { isAdmin, isHeadRole, getSectionForRole } from "@/lib/utils/roles"
import { ArchiveClient } from "./archive-client"

export const dynamic = "force-dynamic"

export default async function ArchivePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const userId = session.user.id
  const userRole = session.user.role || "MEMBER"

  // Resolve section ID from HEAD role (deprecated sectionId on user is no longer used)
  let headSectionId: string | null = null
  if (isHeadRole(userRole)) {
    const sectionName = getSectionForRole(userRole)
    if (sectionName) {
      const section = await prisma.section.findFirst({
        where: { name: sectionName, isActive: true },
        select: { id: true },
      })
      headSectionId = section?.id ?? null
    }
  }

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
          headSectionId={headSectionId}
        />
      </div>
    </div>
  )
}
