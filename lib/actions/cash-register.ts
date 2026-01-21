"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { MESSAGES } from "@/lib/constants/messages"

// ============== DEPOSITS ==============

export async function createDeposit(
  amount: number,
  description: string | null,
  date: Date,
  honeypot?: string
) {
  const session = await auth()

  if (honeypot) {
    console.warn("Deposit honeypot filled, bot detected")
    return { error: MESSAGES.SECURITY.BOT_DETECTED }
  }

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  try {
    await prisma.deposit.create({
      data: {
        amount,
        description,
        date,
      },
    })

    revalidatePath("/dashboard/pokladna")
    return { success: true }
  } catch (error) {
    console.error("Create deposit error:", error)
    return { error: "Nepodařilo se vytvořit vklad" } // This can stay or be moved to MESSAGES if I want to be 100% thorough
  }
}

export async function deleteDeposit(depositId: string) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  try {
    await prisma.deposit.delete({
      where: { id: depositId },
    })

    revalidatePath("/dashboard/pokladna")
    return { success: true }
  } catch (error) {
    console.error("Delete deposit error:", error)
    return { error: "Nepodařilo se smazat vklad" }
  }
}

// ============== DEBT ERRORS ==============

export async function createDebtError(amount: number, reason: string, honeypot?: string) {
  const session = await auth()

  if (honeypot) {
    console.warn("Debt error honeypot filled, bot detected")
    return { error: MESSAGES.SECURITY.BOT_DETECTED }
  }

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  if (!reason.trim()) {
    return { error: "Důvod je povinný" }
  }

  try {
    await prisma.debtError.create({
      data: {
        amount,
        reason,
      },
    })

    revalidatePath("/dashboard/pokladna")
    return { success: true }
  } catch (error) {
    console.error("Create debt error:", error)
    return { error: "Nepodařilo se přidat dluh z chyb" }
  }
}

export async function deleteDebtError(debtErrorId: string) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: "Oprávnění pouze pro administrátora" }
  }

  try {
    await prisma.debtError.delete({
      where: { id: debtErrorId },
    })

    revalidatePath("/dashboard/pokladna")
    return { success: true }
  } catch (error) {
    console.error("Delete debt error:", error)
    return { error: "Nepodařilo se smazat záznam" }
  }
}

// ============== CASH ON HAND ==============

export async function createCashOnHand(amount: number, reason: string, honeypot?: string) {
  const session = await auth()

  if (honeypot) {
    console.warn("Cash on hand honeypot filled, bot detected")
    return { error: MESSAGES.SECURITY.BOT_DETECTED }
  }

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  if (!reason.trim()) {
    return { error: "Důvod je povinný" }
  }

  try {
    await prisma.cashOnHand.create({
      data: {
        amount,
        reason,
      },
    })

    revalidatePath("/dashboard/pokladna")
    return { success: true }
  } catch (error) {
    console.error("Create cash on hand error:", error)
    return { error: "Nepodařilo se přidat hotovost" }
  }
}

export async function deleteCashOnHand(cashOnHandId: string) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: "Oprávnění pouze pro administrátora" }
  }

  try {
    await prisma.cashOnHand.delete({
      where: { id: cashOnHandId },
    })

    revalidatePath("/dashboard/pokladna")
    return { success: true }
  } catch (error) {
    console.error("Delete cash on hand error:", error)
    return { error: "Nepodařilo se smazat záznam" }
  }
}

// ============== DATA RETRIEVAL ==============

export async function getAllCashRegisterData() {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: "Oprávnění pouze pro administrátora" }
  }

  try {
    // Get ALL deposits
    const deposits = await prisma.deposit.findMany({
      orderBy: { date: "desc" },
    })

    // Get ALL debt errors
    const debtErrors = await prisma.debtError.findMany({
      orderBy: { createdAt: "desc" },
    })

    // Get ALL cash on hand
    const cashOnHand = await prisma.cashOnHand.findMany({
      orderBy: { createdAt: "desc" },
    })

    // Get ALL receipts (PURCHASED or VERIFIED with receipt)
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { status: "PURCHASED" },
          { status: "VERIFIED" },
        ],
      },
      include: {
        section: { select: { name: true } },
        requester: { select: { fullName: true } },
      },
      orderBy: { dueDate: "desc" },
    })

    // Calculate totals
    const totalDebtErrors = debtErrors.reduce(
      (sum, d) => sum + Number(d.amount),
      0
    )
    const totalCashOnHand = cashOnHand.reduce(
      (sum, c) => sum + Number(c.amount),
      0
    )
    const totalDeposits = deposits.reduce(
      (sum, d) => sum + Number(d.amount),
      0
    )
    const paidTransactions = transactions.filter((t) => t.isPaid)
    const totalPaidExpenses = paidTransactions.reduce(
      (sum, t) => sum + Number(t.finalAmount || t.estimatedAmount),
      0
    )
    
    // Count unpaid
    const unpaidCount = transactions.filter((t) => !t.isPaid).length

    // Current balance
    const currentBalance = totalDeposits - totalPaidExpenses

    // Real cash = current balance - debt errors - cash on hand
    const realCash = currentBalance - totalDebtErrors - totalCashOnHand

    return {
      deposits: deposits.map((d) => ({
        ...d,
        amount: Number(d.amount),
        date: d.date.toISOString(),
        createdAt: d.createdAt.toISOString(),
      })),
      debtErrors: debtErrors.map((d) => ({
        ...d,
        amount: Number(d.amount),
        createdAt: d.createdAt.toISOString(),
      })),
      cashOnHand: cashOnHand.map((c) => ({
        ...c,
        amount: Number(c.amount),
        createdAt: c.createdAt.toISOString(),
      })),
      transactions: transactions.map((t) => ({
        ...t,
        estimatedAmount: Number(t.estimatedAmount),
        finalAmount: t.finalAmount ? Number(t.finalAmount) : null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        dueDate: t.dueDate?.toISOString() || null,
      })),
      totalDebtErrors,
      totalCashOnHand,
      totalDeposits,
      currentBalance,
      unpaidCount,
      realCash,
    }
  } catch (error) {
    console.error("Get all cash register data error:", error)
    return { error: "Nepodařilo se načíst data pokladny" }
  }
}

// Helper function to calculate balance at a specific date
export async function getBalanceAtDate(targetDate: Date) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: "Oprávnění pouze pro administrátora" }
  }

  try {
    // Get deposits up to target date
    const deposits = await prisma.deposit.findMany({
      where: {
        date: { lte: targetDate },
      },
    })

    // Get paid transactions up to target date
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { status: "PURCHASED" },
          { status: "VERIFIED" },
        ],
        isPaid: true,
        dueDate: { lte: targetDate },
      },
    })

    const totalDeposits = deposits.reduce(
      (sum, d) => sum + Number(d.amount),
      0
    )
    const totalExpenses = transactions.reduce(
      (sum, t) => sum + Number(t.finalAmount || t.estimatedAmount),
      0
    )

    return { balance: totalDeposits - totalExpenses }
  } catch (error) {
    console.error("Get balance at date error:", error)
    return { error: "Nepodařilo se vypočítat zůstatek" }
  }
}
