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

  // Fetch unique semester keys
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

  // Get initial semester data and serialize it
  // We need to return 'transactions' instead of 'receipts' to match client expectation
  // OR we fix the client to expect 'receipts'. Let's normalize here to be safe first.
  let initialSemesterDataRaw = currentSem 
    ? await getPokladnaSemesterData(currentSem) 
    : { openingBalance: 0, deposits: [], receipts: [] }

  if ("error" in initialSemesterDataRaw) {
    console.error("Error fetching semester data:", initialSemesterDataRaw.error)
    initialSemesterDataRaw = { openingBalance: 0, deposits: [], receipts: [] }
  }

  // Normalize data for client props
  // Normalize data for client props
  const initialSemesterData = {
    openingBalance: Number(initialSemesterDataRaw.openingBalance || 0),
    deposits: (initialSemesterDataRaw.deposits || []).map((d: any) => ({
      ...d,
      amount: Number(d.amount)
    })),
    transactions: (initialSemesterDataRaw.receipts || []).map((r: any) => ({
      ...r,
      amount: Number(r.amount),
      // Deep serialize nested ticket if present
      ticket: r.ticket ? {
          ...r.ticket,
          budgetAmount: Number(r.ticket.budgetAmount)
      } : undefined
    })) 
  }

  // Count unpaid receipts
  const unpaidCount = await prisma.receipt.count({
    where: { isPaid: false, status: "APPROVED" }
  })

  // Get context
  const registerData = await getAllCashRegisterData()

  if ("error" in registerData) {
    throw new Error(registerData.error as string)
  }

  // Serialize registerData manually to ensure no Decimal objects slip through
  // getAllCashRegisterData returns plain objects but let's be safe with a deep clone/parse
  // equivalent to just passing it if we trust the action, but user specifically asked to FIX the serialization crash.
  // The JSON.parse(JSON.stringify()) method is a catch-all for Prisma Decimal -> String/Number conversion if configured,
  // but Prisma default behavior for Decimal is to keep it as Decimal object or string.
  // We will map it manually to be 100% sure as requested.
  const serializedRegisterData = {
    ...registerData,
    currentBalance: Number(registerData.currentBalance),
    totalDebtErrors: Number(registerData.totalDebtErrors),
    totalCashOnHand: Number(registerData.totalCashOnHand),
    realCash: Number(registerData.realCash),
    // We need to map arrays too if they contain Decimals
    deposits: registerData.deposits?.map((d: any) => ({ ...d, amount: Number(d.amount) })),
    debtErrors: registerData.debtErrors?.map((d: any) => ({ ...d, amount: Number(d.amount) })),
    cashOnHand: registerData.cashOnHand?.map((c: any) => ({ ...c, amount: Number(c.amount) })),
    receipts: registerData.receipts?.map((r: any) => ({ 
      ...r, 
      amount: Number(r.amount),
      // Deep serialize nested ticket to fix Decimal crash
      ticket: r.ticket ? {
        ...r.ticket,
        budgetAmount: Number(r.ticket.budgetAmount)
      } : undefined
    })),
  }

  return (
    <PokladnaClient 
      initialBalance={serializedRegisterData.currentBalance || 0}
      unpaidCount={unpaidCount}
      currentUsers={usersWithBalance}
      registerData={serializedRegisterData}
      semesterKeys={sortedKeys}
      initialSemesterData={initialSemesterData}
    />
  )
}
