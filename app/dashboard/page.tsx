import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

const statusLabels: Record<string, string> = {
  DRAFT: "Koncept",
  PENDING: "Čeká na schválení",
  APPROVED: "Schváleno",
  PURCHASED: "Nakoupeno",
  VERIFIED: "Ověřeno",
  REJECTED: "Zamítnuto",
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-500",
  PENDING: "bg-yellow-500",
  APPROVED: "bg-green-500",
  PURCHASED: "bg-blue-500",
  VERIFIED: "bg-purple-500",
  REJECTED: "bg-red-500",
}

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id

  const user = userId ? await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, role: true, sectionId: true },
  }) : null

  // Get recent transactions
  const transactions = userId ? await prisma.transaction.findMany({
    where: { requesterId: userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      purpose: true,
      status: true,
      estimatedAmount: true,
      createdAt: true,
    },
  }) : []

  // Get stats
  const totalTransactions = userId ? await prisma.transaction.count({
    where: { requesterId: userId },
  }) : 0

  const pendingTransactions = userId ? await prisma.transaction.count({
    where: { requesterId: userId, status: "PENDING" },
  }) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Vítejte, {user?.fullName?.split(" ")[0] || "uživateli"}!
        </h1>
        <p className="text-slate-400">
          Zde je přehled vašich finančních aktivit
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Celkem žádostí
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-white">
              {totalTransactions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Všechny vaše žádosti</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 hover:border-yellow-500/50 transition-colors">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Čeká na schválení
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-yellow-400">
              {pendingTransactions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Žádosti ke schválení</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 hover:border-green-500/50 transition-colors">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">Vaše role</CardDescription>
            <CardTitle className="text-2xl font-bold text-white">
              {user?.role === "MEMBER" && "Člen"}
              {user?.role === "SECTION_HEAD" && "Vedoucí sekce"}
              {user?.role === "FINANCE" && "Finance"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">Vaše oprávnění v systému</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Poslední žádosti</CardTitle>
          <CardDescription className="text-slate-400">
            Vaše nejnovější finanční žádosti
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((tx: { id: string; purpose: string; createdAt: Date; estimatedAmount: { toString(): string } | number; status: string }) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-white">{tx.purpose}</p>
                    <p className="text-sm text-slate-400">
                      {new Date(tx.createdAt).toLocaleDateString("cs-CZ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-white">
                      {Number(tx.estimatedAmount).toLocaleString("cs-CZ")} Kč
                    </span>
                    <Badge className={`${statusColors[tx.status]} text-white`}>
                      {statusLabels[tx.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto mb-4 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p>Zatím nemáte žádné žádosti</p>
              <p className="text-sm mt-2">
                Vytvořte svou první žádost v sekci &quot;Moje žádosti&quot;
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
