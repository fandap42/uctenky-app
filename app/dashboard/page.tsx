import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RequestForm } from "@/components/requests/request-form"
import { ReceiptUpload } from "@/components/receipts/receipt-upload"

export const dynamic = "force-dynamic"

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

  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, role: true, sectionId: true },
  })

  // Get all user's transactions
  const transactions = await prisma.transaction.findMany({
    where: { requesterId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      section: { select: { id: true, name: true } },
    },
  })

  // Get stats
  const totalCount = transactions.length
  const pendingCount = transactions.filter((t) => t.status === "PENDING").length
  const totalSpent = transactions
    .filter((t) => t.status === "VERIFIED" || t.status === "PURCHASED")
    .reduce((sum, t) => sum + Number(t.finalAmount || t.estimatedAmount), 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Vítejte, {user?.fullName?.split(" ")[0] || "uživateli"}!
          </h1>
          <p className="text-slate-400">
            Přehled vašich finančních žádostí a aktivit
          </p>
        </div>
        <RequestForm />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Celkem žádostí
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-white">
              {totalCount}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 hover:border-yellow-500/50 transition-colors">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400">
              Čeká na schválení
            </CardDescription>
            <CardTitle className="text-4xl font-bold text-yellow-400">
              {pendingCount}
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
      </div>

      {/* All Transactions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Moje žádosti</CardTitle>
          <CardDescription className="text-slate-400">
            Seznam všech vašich finančních žádostí
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-xl bg-slate-900/50 border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${statusColors[tx.status]} text-white`}>
                          {statusLabels[tx.status]}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {tx.section?.name} • {new Date(tx.createdAt).toLocaleDateString("cs-CZ")}
                        </span>
                      </div>
                      <p className="font-medium text-white text-lg">{tx.purpose}</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Částka</p>
                        <p className="font-semibold text-white">
                          {Number(tx.finalAmount || tx.estimatedAmount).toLocaleString("cs-CZ")} Kč
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {tx.receiptUrl && (
                          <a
                            href={tx.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Zobrazit účtenku"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </a>
                        )}
                        {tx.status === "APPROVED" && !tx.receiptUrl && (
                          <ReceiptUpload transactionId={tx.id} />
                        )}
                      </div>
                    </div>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
