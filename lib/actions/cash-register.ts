"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { MESSAGES } from "@/lib/constants/messages"
import { getSemesterRange } from "@/lib/utils/semesters"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit"

// ============== DEPOSITS ==============

export async function createDeposit(
  amount: number,
  description: string | null,
  date: Date,
  honeypot?: string
) {
  const session = await auth()

  if (honeypot) {
    logger.warn({ userId: session?.user?.id }, "Deposit honeypot filled, bot detected")
    return { error: MESSAGES.SECURITY.BOT_DETECTED }
  }

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  try {
    const created = await prisma.deposit.create({
      data: {
        amount,
        description,
        date,
      },
    })

    await logAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "DEPOSIT_CREATE",
      entityType: "Deposit",
      entityId: created.id,
      metadata: {
        amount,
        description,
        date: date.toISOString(),
      },
    })

    revalidatePath("/dashboard/pokladna")
    return { success: true }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id }, "Create deposit error")
    return { error: "Nepodařilo se vytvořit vklad" } // This can stay or be moved to MESSAGES if I want to be 100% thorough
  }
}

export async function deleteDeposit(depositId: string) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  try {
    const deleted = await prisma.deposit.delete({
      where: { id: depositId },
    })

    await logAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "DEPOSIT_DELETE",
      entityType: "Deposit",
      entityId: depositId,
      metadata: {
        amount: Number(deleted.amount),
        description: deleted.description,
      },
    })

    revalidatePath("/dashboard/pokladna")
    return { success: true }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id, depositId }, "Delete deposit error")
    return { error: "Nepodařilo se smazat vklad" }
  }
}

export async function updateDeposit(
  depositId: string,
  amount: number,
  date: Date,
  description?: string | null
) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  try {
    await prisma.deposit.update({
      where: { id: depositId },
      data: {
        amount,
        date,
        ...(description !== undefined && { description }),
      },
    })

    await logAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "DEPOSIT_UPDATE",
      entityType: "Deposit",
      entityId: depositId,
      metadata: {
        amount,
        description: description ?? null,
        date: date.toISOString(),
      },
    })

    revalidatePath("/dashboard/pokladna")
    return { success: true }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id, depositId }, "Update deposit error")
    return { error: MESSAGES.CASH_REGISTER.UPDATE_DEPOSIT_FAILED }
  }
}

// ============== DEBT ERRORS ==============

export async function createDebtError(amount: number, reason: string, honeypot?: string) {
  const session = await auth()

  if (honeypot) {
    logger.warn({ userId: session?.user?.id }, "Debt error honeypot filled, bot detected")
    return { error: MESSAGES.SECURITY.BOT_DETECTED }
  }

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  if (!reason.trim()) {
    return { error: "Důvod je povinný" }
  }

  try {
    const created = await prisma.debtError.create({
      data: {
        amount,
        reason,
      },
    })

    await logAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "DEBT_ERROR_CREATE",
      entityType: "DebtError",
      entityId: created.id,
      metadata: { amount, reason },
    })

    revalidatePath("/dashboard/pokladna")
    return { success: true }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id }, "Create debt error")
    return { error: "Nepodařilo se přidat dluh z chyb" }
  }
}

export async function deleteDebtError(debtErrorId: string) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: "Oprávnění pouze pro administrátora" }
  }

  try {
    const deleted = await prisma.debtError.delete({
      where: { id: debtErrorId },
    })

    await logAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "DEBT_ERROR_DELETE",
      entityType: "DebtError",
      entityId: debtErrorId,
      metadata: {
        amount: Number(deleted.amount),
        reason: deleted.reason,
      },
    })

    revalidatePath("/dashboard/pokladna")
    return { success: true }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id, debtErrorId }, "Delete debt error")
    return { error: "Nepodařilo se smazat záznam" }
  }
}

// ============== CASH ON HAND ==============

export async function createCashOnHand(amount: number, reason: string, honeypot?: string) {
  const session = await auth()

  if (honeypot) {
    logger.warn({ userId: session?.user?.id }, "Cash on hand honeypot filled, bot detected")
    return { error: MESSAGES.SECURITY.BOT_DETECTED }
  }

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  if (!reason.trim()) {
    return { error: "Důvod je povinný" }
  }

  try {
    const created = await prisma.cashOnHand.create({
      data: {
        amount,
        reason,
      },
    })

    await logAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "CASH_ON_HAND_CREATE",
      entityType: "CashOnHand",
      entityId: created.id,
      metadata: { amount, reason },
    })

    revalidatePath("/dashboard/pokladna")
    return { success: true }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id }, "Create cash on hand error")
    return { error: "Nepodařilo se přidat hotovost" }
  }
}

export async function deleteCashOnHand(cashOnHandId: string) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: "Oprávnění pouze pro administrátora" }
  }

  try {
    const deleted = await prisma.cashOnHand.delete({
      where: { id: cashOnHandId },
    })

    await logAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "CASH_ON_HAND_DELETE",
      entityType: "CashOnHand",
      entityId: cashOnHandId,
      metadata: {
        amount: Number(deleted.amount),
        reason: deleted.reason,
      },
    })

    revalidatePath("/dashboard/pokladna")
    return { success: true }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id, cashOnHandId }, "Delete cash on hand error")
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

    // Get ALL receipts
    const receipts = await prisma.receipt.findMany({
      include: {
        ticket: {
          include: {
            section: { select: { name: true } },
            requester: { select: { fullName: true, image: true } },
            processingBy: { select: { id: true, fullName: true, image: true } },
            receipts: true
          }
        }
      },
      orderBy: { date: "desc" },
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
    
    const paidReceipts = receipts.filter((r) => r.isPaid)
    const totalPaidExpenses = paidReceipts.reduce(
      (sum, r) => sum + Number(r.amount),
      0
    )
    
    // Count unpaid
    const unpaidCount = receipts.filter((r) => !r.isPaid && r.status === "APPROVED").length

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
      receipts: receipts.map((r) => {
        const { ticket, ...receipt } = r
        return {
          ...receipt,
          amount: Number(receipt.amount),
          date: receipt.date.toISOString(),
          createdAt: receipt.createdAt.toISOString(),
          updatedAt: receipt.updatedAt.toISOString(),
          // Flatten some fields for backward compatibility
          sectionName: ticket.section.name,
          requesterName: ticket.requester?.fullName || "Smazaný uživatel",
          purpose: ticket.purpose,
          // Explicitly serialize the nested ticket to avoid Decimal crash
          ticket: {
            ...ticket,
            budgetAmount: Number(ticket.budgetAmount),
            createdAt: ticket.createdAt.toISOString(),
            updatedAt: ticket.updatedAt.toISOString(),
            targetDate: ticket.targetDate.toISOString(),
            receipts: (ticket.receipts || []).map((tr) => ({
              ...tr,
              amount: Number(tr.amount),
              date: tr.date.toISOString(),
              createdAt: tr.createdAt.toISOString(),
              updatedAt: tr.updatedAt.toISOString(),
            }))
          }
        }
      }),
      totalDebtErrors,
      totalCashOnHand,
      totalDeposits,
      currentBalance,
      unpaidCount,
      realCash,
    }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id }, "Get all cash register data error")
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

    // Get paid receipts up to target date
    const receipts = await prisma.receipt.findMany({
      where: {
        isPaid: true,
        date: { lte: targetDate },
      },
    })

    const totalDeposits = deposits.reduce(
      (sum, d) => sum + Number(d.amount),
      0
    )
    const totalExpenses = receipts.reduce(
      (sum, r) => sum + Number(r.amount),
      0
    )

    return { balance: totalDeposits - totalExpenses }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id }, "Get balance at date error")
    return { error: "Nepodařilo se vypočítat zůstatek" }
  }
}

export async function getPokladnaSemesterData(semesterKey: string) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: "Oprávnění pouze pro administrátora" }
  }

  const { start, end } = getSemesterRange(semesterKey)

  try {
    // 1. Get opening balance (deposits - paid receipts BEFORE this semester)
    const prevDeposits = await prisma.deposit.aggregate({
      where: { date: { lt: start } },
      _sum: { amount: true },
    })
    const prevExpenses = await prisma.receipt.aggregate({
      where: {
        isPaid: true,
        date: { lt: start },
      },
      _sum: { amount: true },
    })

    const openingBalance =
      Number(prevDeposits._sum.amount || 0) -
      Number(prevExpenses._sum.amount || 0)

    // 2. Get deposits within this semester
    const deposits = await prisma.deposit.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: { date: "asc" },
    })

    // 3. Get receipts within this semester
    const receipts = await prisma.receipt.findMany({
      where: {
        date: { gte: start, lte: end },
      },
      include: {
        ticket: {
          include: {
            section: { select: { name: true } },
            requester: { select: { fullName: true, image: true } },
            processingBy: { select: { id: true, fullName: true, image: true } },
            receipts: true
          }
        }
      },
      orderBy: { date: "asc" },
    })

    return {
      openingBalance,
      deposits: deposits.map((d) => ({
        ...d,
        amount: Number(d.amount),
        date: d.date.toISOString(),
        createdAt: d.createdAt.toISOString(),
      })),
      receipts: receipts.map((r) => {
        const { ticket, ...receipt } = r
        return {
          ...receipt,
          amount: Number(receipt.amount),
          date: receipt.date.toISOString(),
          createdAt: receipt.createdAt.toISOString(),
          updatedAt: receipt.updatedAt.toISOString(),
          sectionName: ticket.section.name,
          requesterName: ticket.requester?.fullName || "Smazaný uživatel",
          purpose: ticket.purpose,
          // Explicitly serialize the nested ticket to avoid Decimal crash
          ticket: {
            ...ticket,
            budgetAmount: Number(ticket.budgetAmount),
            createdAt: ticket.createdAt.toISOString(),
            updatedAt: ticket.updatedAt.toISOString(),
            targetDate: ticket.targetDate.toISOString(),
            receipts: (ticket.receipts || []).map((tr) => ({
              ...tr,
              amount: Number(tr.amount),
              date: tr.date.toISOString(),
              createdAt: tr.createdAt.toISOString(),
              updatedAt: tr.updatedAt.toISOString(),
            }))
          }
        }
      }),
    }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id, semesterKey }, "Get pokladna semester data error")
    return { error: "Nepodařilo se načíst data pokladny pro daný semestr" }
  }
}
