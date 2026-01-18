import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SemesterStructuredList } from "@/components/dashboard/semester-structured-list"

export const dynamic = "force-dynamic"

export default async function SectionHeadDashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Get user's profile to check role and section
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, fullName: true, role: true, sectionId: true },
  })

  // Redirect if not section head or admin
  if (!user || (user.role !== "SECTION_HEAD" && user.role !== "ADMIN")) {
    redirect("/dashboard")
  }

  // If no section assigned, show message
  if (!user.sectionId) {
    return (
      <div className="space-y-8 p-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Žádosti sekce</h1>
          <p className="text-slate-400">
            Nemáte přiřazenou žádnou sekci. Kontaktujte administrátora.
          </p>
        </div>
      </div>
    )
  }

  // Fetch section's transactions
  const rawTxList = await prisma.transaction.findMany({
    where: { sectionId: user.sectionId },
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

  // Get section info
  const section = await prisma.section.findUnique({
    where: { id: user.sectionId },
    select: { id: true, name: true, budgetCap: true },
  })

  // Calculate spent (using ALL transactions for accurate budget)
  const totalSpent = (transactions as any[])
    .filter((t: any) => t.status === "VERIFIED" || t.status === "PURCHASED")
    .reduce((sum: number, t: any) => sum + Number(t.finalAmount || t.estimatedAmount), 0)

  const remaining = Number(section?.budgetCap || 0) - totalSpent

  const pendingTransactions = (transactions as any[]).filter((t: any) => t.status === "PENDING")

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Žádosti sekce: {section?.name || "Neznámá sekce"}
        </h1>
        <p className="text-slate-400">
          Správa a přehled všech žádostí vaší sekce
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Čeká na schválení
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-yellow-400">
              {pendingTransactions.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Zbývající rozpočet
            </CardDescription>
            <CardTitle className={`text-2xl font-bold ${remaining < 1000 ? "text-red-400" : "text-green-400"}`}>
              {remaining.toLocaleString("cs-CZ")} Kč
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500 italic">
              Z celkového limitu {Number(section?.budgetCap || 0).toLocaleString("cs-CZ")} Kč
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Vyčerpáno sekcí
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-green-400">
              {totalSpent.toLocaleString("cs-CZ")} Kč
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Structured Transactions List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Přehled žádostí sekce</h2>
        <SemesterStructuredList 
          transactions={transactions} 
          showSection={false} 
          showActions={true}
        />
      </div>
    </div>
  )
}
