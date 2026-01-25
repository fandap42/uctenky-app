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
      tickets: {
        select: {
          receipts: {
            where: { isPaid: false, status: "APPROVED" },
            select: { amount: true }
          }
        }
      }
    },
  })

  const usersWithBalance = users.map(u => {
    const balance = u.tickets.reduce((sum, ticket) => {
      const ticketSum = ticket.receipts.reduce((s, r) => s + Number(r.amount), 0)
      return sum + ticketSum
    }, 0)
    
    return {
      id: u.id,
      fullName: u.fullName,
      pokladnaBalance: balance
    }
  })

  // Fetch unique semester keys from both receipts and deposits
  const receiptDates = await prisma.receipt.findMany({
    select: { date: true, createdAt: true }
  })
  const depositDates = await prisma.deposit.findMany({
    select: { date: true }
  })

  const semesterKeys = Array.from(new Set([
    ...receiptDates.map(d => getSemester(new Date(d.date || d.createdAt))),
    ...depositDates.map(d => getSemester(new Date(d.date)))
  ]))

  const sortedKeys = sortSemesterKeys(semesterKeys)
  const currentSem = sortedKeys[0]

  // Get initial semester data
  const initialSemesterData = currentSem ? await getPokladnaSemesterData(currentSem) : { openingBalance: 0, deposits: [], receipts: [] }

  // Count unpaid receipts (across all time)
  const unpaidCount = await prisma.receipt.count({
    where: { isPaid: false, status: "APPROVED" }
  })

  // Get context
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
      semesterKeys={sortedKeys}
      initialSemesterData={initialSemesterData}
    />
  )
}
