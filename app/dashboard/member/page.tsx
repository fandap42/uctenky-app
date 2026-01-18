import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RequestForm } from "@/components/requests/request-form"
import { ReceiptUpload } from "@/components/receipts/receipt-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

export default async function MemberDashboardPage() {
  const session = await auth()
  const userId = session?.user?.id

  // Fetch user's transactions
  const transactions = userId ? await prisma.transaction.findMany({
    where: { requesterId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      section: { select: { id: true, name: true } },
    },
  }) : []

  const pendingTransactions = transactions.filter(
    (t: { status: string }) => t.status === "PENDING" || t.status === "DRAFT"
  )
  
  const approvedTransactions = transactions.filter(
    (t: { status: string }) => t.status === "APPROVED"
  )
  
  const completedTransactions = transactions.filter(
    (t: { status: string }) => t.status === "PURCHASED" || t.status === "VERIFIED" || t.status === "REJECTED"
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Moje žádosti</h1>
          <p className="text-slate-400">
            Spravujte své žádosti o finanční náhrady
          </p>
        </div>
        <RequestForm />
      </div>

      {/* Tabs for filtering */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-white"
          >
            Všechny ({transactions.length})
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-white"
          >
            Čekající ({pendingTransactions.length})
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-white"
          >
            Ke zpracování ({approvedTransactions.length})
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-white"
          >
            Dokončené ({completedTransactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <TransactionList transactions={transactions} />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <TransactionList transactions={pendingTransactions} />
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <TransactionList transactions={approvedTransactions} showUpload />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <TransactionList transactions={completedTransactions} />
        </TabsContent>
      </Tabs>

      {/* Floating Action Button for mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <RequestForm
          trigger={
            <button className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center text-white hover:scale-110 transition-transform">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          }
        />
      </div>
    </div>
  )
}

interface Transaction {
  id: string
  purpose: string
  status: string
  estimatedAmount: { toString(): string } | number
  finalAmount: { toString(): string } | number | null
  receiptUrl: string | null
  createdAt: Date
  updatedAt: Date
  section: { id: string; name: string } | null
}

function TransactionList({
  transactions,
  showUpload = false,
}: {
  transactions: Transaction[]
  showUpload?: boolean
}) {
  if (transactions.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-12 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto text-slate-500 mb-4"
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
          <p className="text-slate-400">Žádné žádosti v této kategorii</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.map((tx) => (
        <Card
          key={tx.id}
          className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors"
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-white text-lg">{tx.purpose}</CardTitle>
                <CardDescription className="text-slate-400">
                  {tx.section?.name || "Neznámá sekce"} •{" "}
                  {new Date(tx.createdAt).toLocaleDateString("cs-CZ", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </CardDescription>
              </div>
              <Badge className={`${statusColors[tx.status]} text-white`}>
                {statusLabels[tx.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Odhadovaná částka</p>
                  <p className="text-lg font-semibold text-white">
                    {Number(tx.estimatedAmount).toLocaleString("cs-CZ")} Kč
                  </p>
                </div>
                {tx.finalAmount && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Skutečná částka</p>
                    <p className="text-lg font-semibold text-green-400">
                      {Number(tx.finalAmount).toLocaleString("cs-CZ")} Kč
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {tx.receiptUrl && (
                  <a
                    href={tx.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Zobrazit účtenku
                  </a>
                )}
                {(showUpload || tx.status === "APPROVED") && !tx.receiptUrl && (
                  <ReceiptUpload transactionId={tx.id} />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
