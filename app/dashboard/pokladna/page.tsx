import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PokladnaClient } from "./client"
import { getAllCashRegisterData } from "@/lib/actions/cash-register"

export const dynamic = "force-dynamic"

export default async function PokladnaPage() {
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

  // Get all users for balance overview
  const users = await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      transactions: {
        where: { isPaid: false },
        select: {
          finalAmount: true,
          estimatedAmount: true,
        }
      }
    },
  })

  // Calculate dynamic balance for each user (sum of what org owes them)
  const usersWithBalance = users.map(u => {
    const balance = u.transactions.reduce((sum, t) => {
      const amount = t.finalAmount ? Number(t.finalAmount) : Number(t.estimatedAmount)
      return sum + amount
    }, 0)
    
    return {
      id: u.id,
      fullName: u.fullName,
      pokladnaBalance: balance
    }
  })

  // Get all transactions for the overview table (PURCHASED/VERIFIED) and serialize Decimals
  const rawTransactions = await prisma.transaction.findMany({
    where: {
      status: { in: ["PURCHASED", "VERIFIED"] }
    },
    include: {
      section: true,
      requester: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const transactions = rawTransactions.map(t => ({
    ...t,
    estimatedAmount: Number(t.estimatedAmount),
    finalAmount: t.finalAmount ? Number(t.finalAmount) : null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
  }))

  // Count unpaid transactions (APPROVED or PURCHASED with no payment yet)
  const unpaidCount = await prisma.transaction.count({
    where: { isPaid: false, status: { not: "REJECTED" } }
  })

  // Get cash register data
  const registerData = await getAllCashRegisterData()

  // Extract relevant pieces (handling potential error object from action)
  if ("error" in registerData) {
    throw new Error(registerData.error as string)
  }

  return (
    <PokladnaClient 
      initialBalance={registerData.currentBalance || 0}
      unpaidCount={unpaidCount}
      currentUsers={usersWithBalance}
      registerData={registerData}
    />
  )
}
