import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BudgetProgress } from "@/components/dashboard/budget-progress"
import { CollapsibleBudget } from "@/components/dashboard/collapsible-budget"
import { EditBudgetDialog } from "@/components/dashboard/edit-budget-dialog"
import { Button } from "@/components/ui/button"
import { SemesterStructuredList } from "@/components/dashboard/semester-structured-list"
import { getCurrentSemester } from "@/lib/utils/semesters"

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

  const currentSemester = getCurrentSemester()

  // Fetch all transactions
  const rawTransactionsList = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { id: true, fullName: true } },
      section: { select: { id: true, name: true } },
    },
  })

  // Serialize Decimals for Client Components
  const transactions = rawTransactionsList.map(t => ({
    ...t,
    estimatedAmount: Number(t.estimatedAmount),
    finalAmount: t.finalAmount ? Number(t.finalAmount) : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
  })) as any

  // Fetch all sections with budget info from Budget table
  const sections = await prisma.section.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      budgets: {
        where: { fiscalYear: currentSemester },
        take: 1,
      },
    },
  })

  // Calculate spent and pending per section (on all transactions)
  const allRawTransactions = await prisma.transaction.findMany()
  const sectionStats = sections.map((section) => {
    const sectionTransactions = allRawTransactions.filter(
      (t) => t.sectionId === section.id
    )

    const spent = sectionTransactions
      .filter((t) => t.status === "VERIFIED" || t.status === "PURCHASED")
      .reduce((sum, t) => sum + Number(t.finalAmount || t.estimatedAmount), 0)

    const pending = sectionTransactions
      .filter((t) => t.status === "PENDING" || t.status === "APPROVED")
      .reduce((sum, t) => sum + Number(t.estimatedAmount), 0)

    // Get budget from Budget table for current semester
    const budgetAmount = section.budgets[0] ? Number(section.budgets[0].totalAmount) : 0

    return {
      ...section,
      spent,
      pending,
      budgetAmount,
    }
  })

  // Stats for the stats cards
  const totalVerified = (transactions as any[])
    .filter((t: any) => t.status === "VERIFIED")
    .reduce((sum: number, t: any) => sum + Number(t.finalAmount || t.estimatedAmount || 0), 0)

  const pendingTransactions = (transactions as any[]).filter((t: any) => t.status === "PENDING")
  const purchasedTransactions = (transactions as any[]).filter((t: any) => t.status === "PURCHASED")

  const totalSpent = (transactions as any[])
    .filter((t: any) => t.status === "VERIFIED" || t.status === "PURCHASED")
    .reduce((sum: number, t: any) => sum + Number(t.finalAmount || t.estimatedAmount), 0)

  const totalBudget = sectionStats.reduce((sum, s) => sum + s.budgetAmount, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Správa účtenek</h1>
          <p className="text-slate-400">
            Přehled všech finančních operací a rozpočtů
          </p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              K ověření
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-blue-400">
              {purchasedTransactions.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 hover:border-green-500/50 transition-colors">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Celkem vyčerpáno
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-green-400">
              {totalSpent.toLocaleString("cs-CZ")} Kč
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Celkový rozpočet
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-white">
              {totalBudget.toLocaleString("cs-CZ")} Kč
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Budget Progress (Collapsible) */}
      <CollapsibleBudget>
        {sectionStats.length > 0 ? (
          sectionStats.map((section) => (
            <BudgetProgress
              key={section.id}
              sectionName={section.name}
              budgetCap={section.budgetAmount}
              spent={section.spent}
              pending={section.pending}
              action={
                <EditBudgetDialog
                  sectionId={section.id}
                  sectionName={section.name}
                  currentBudget={section.budgetAmount}
                  trigger={
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-500 hover:text-blue-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </Button>
                  }
                />
              }
            />
          ))
        ) : (
          <p className="text-center text-slate-400 py-4">
            Žádné sekce nebyly nalezeny
          </p>
        )}
      </CollapsibleBudget>

      {/* Structured Transactions List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Přehled žádostí</h2>
        <SemesterStructuredList
          transactions={transactions}
          isAdmin={true}
          showActions={true}
        />
      </div>
    </div>
  )
}
