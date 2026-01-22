import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PokladnaClient } from "./client"
import { getAllCashRegisterData, getPokladnaSemesterData } from "@/lib/actions/cash-register"
import { getSemester, sortSemesterKeys } from "@/lib/utils/semesters"

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

  // Fetch unique semester keys from both transactions and deposits
  const transactionDates = await prisma.transaction.findMany({
    where: { status: { in: ["PURCHASED", "VERIFIED"] } },
    select: { dueDate: true, createdAt: true }
  })
  const depositDates = await prisma.deposit.findMany({
    select: { date: true }
  })

  const semesterKeys = Array.from(new Set([
    ...transactionDates.map(d => getSemester(new Date(d.dueDate || d.createdAt))),
    ...depositDates.map(d => getSemester(new Date(d.date)))
  ]))

  const sortedKeys = sortSemesterKeys(semesterKeys)
  const currentSem = sortedKeys[0]

  // Get initial semester data (for the expanded one)
  const initialSemesterData = currentSem ? await getPokladnaSemesterData(currentSem) : { openingBalance: 0, deposits: [], transactions: [] }

  // Count unpaid transactions (across all time)
  const unpaidCount = await prisma.transaction.count({
    where: { isPaid: false, status: { not: "REJECTED" } }
  })

  // Get context (totals, debt errors, etc. - without fetching ALL transactions again)
  const registerData = await getAllCashRegisterData()

  if ("error" in registerData) {
    throw new Error(registerData.error as string)
  }

  return (
    <PokladnaClient 
      initialBalance={registerData.currentBalance || 0}
      unpaidCount={unpaidCount}
      currentUsers={usersWithBalance}
      registerData={registerData}
      semesterKeys={semesterKeys}
      initialSemesterData={initialSemesterData}
    />
  )
}
