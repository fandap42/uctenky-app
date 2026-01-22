import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SemesterStructuredList } from "@/components/dashboard/semester-structured-list"
import { isHeadRole, isAdmin, getSectionForRole } from "@/lib/utils/roles"

export const dynamic = "force-dynamic"

export default async function SectionHeadDashboardPage() {
  const session = await auth()

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

  // Get section name from role mapping
  const sectionName = getSectionForRole(user.role)

  // If admin and no section mapping, show all (or redirect to admin page)
  if (!sectionName && isAdmin(user.role)) {
    redirect("/dashboard/admin")
  }

  // If no section found for role
  if (!sectionName) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2">Žádosti sekce</h1>
          <p className="text-muted-foreground font-medium">
            Vaše role není přiřazena k žádné sekci.
          </p>
        </div>
      </div>
    )
  }

  // Find section by name
  const section = await prisma.section.findFirst({
    where: { name: sectionName, isActive: true },
    select: { id: true, name: true },
  })

  if (!section) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2">Žádosti sekce</h1>
          <p className="text-muted-foreground font-medium">
            Sekce "{sectionName}" nebyla nalezena.
          </p>
        </div>
      </div>
    )
  }

  // Fetch section's transactions
  const rawTxList = await prisma.transaction.findMany({
    where: { sectionId: section.id },
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { id: true, fullName: true } },
    },
  })

  // Serialize Decimals for Client Components
  const transactions = rawTxList.map(t => ({
    ...t,
    estimatedAmount: Number(t.estimatedAmount),
    finalAmount: t.finalAmount ? Number(t.finalAmount) : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
  })) as any

  // Calculate spent
  const totalSpent = (transactions as any[])
    .filter((t: any) => t.status === "VERIFIED" || t.status === "PURCHASED")
    .reduce((sum: number, t: any) => sum + Number(t.finalAmount || t.estimatedAmount), 0)

  const pendingTransactions = (transactions as any[]).filter((t: any) => t.status === "PENDING")

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-foreground mb-2">
          Žádosti sekce: {section.name}
        </h1>
        <p className="text-muted-foreground font-medium">
          Správa a přehled všech žádostí vaší sekce
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-sm">
        <Card className="bg-card border-border shadow-sm border-l-4 border-l-[oklch(0.85_0.20_85)]">
          <CardHeader className="pb-2">
            <CardDescription className="text-muted-foreground font-bold uppercase tracking-wider text-xs">
              Čeká na schválení
            </CardDescription>
            <CardTitle className="text-4xl font-black text-foreground tabular-nums">
              {pendingTransactions.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Structured Transactions List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Přehled žádostí sekce</h2>
        <SemesterStructuredList
          transactions={transactions}
          showSection={false}
          showActions={true}
        />
      </div>
    </div>
  )
}
