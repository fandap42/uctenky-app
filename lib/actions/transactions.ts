"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { TransStatus } from "@prisma/client"
import { MESSAGES } from "@/lib/constants/messages"

export async function createTransaction(formData: FormData) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: MESSAGES.AUTH.UNAUTHORIZED }
  }

  // Honeypot check for bots
  const honeypot = formData.get("full_name_honey") as string
  if (honeypot) {
    console.warn("Honeypot filled, bot detected")
    return { error: MESSAGES.SECURITY.BOT_DETECTED }
  }

  const purpose = formData.get("purpose") as string
  const store = formData.get("store") as string
  const estimatedAmount = parseFloat(formData.get("estimatedAmount") as string)
  const sectionId = formData.get("sectionId") as string
  const dueDateStr = formData.get("dueDate") as string
  const dueDate = dueDateStr ? new Date(dueDateStr) : null
  const status = (formData.get("status") as TransStatus) || "DRAFT"

  if (!purpose || !estimatedAmount) {
    return { error: MESSAGES.TRANSACTION.MISSING_FIELDS }
  }

  if (!sectionId) {
    return { error: MESSAGES.TRANSACTION.MISSING_SECTION }
  }

  try {
    await prisma.transaction.create({
      data: {
        requesterId: session.user.id,
        sectionId,
        purpose,
        store: store || undefined,
        estimatedAmount,
        dueDate,
        status,
      },
    })

    revalidatePath("/dashboard/member")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Create transaction error:", error)
    return { error: MESSAGES.TRANSACTION.CREATE_FAILED }
  }
}

export async function updateTransactionStatus(
  transactionId: string,
  status: TransStatus
) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Nepřihlášený uživatel" }
  }

  try {
    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return { error: MESSAGES.TRANSACTION.ADMIN_APPROVAL_REQUIRED }
    }

    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status },
    })

    return { success: true }
  } catch (error) {
    console.error("Update transaction status error:", error)
    return { error: MESSAGES.TRANSACTION.UPDATE_FAILED }
  }
}

export async function updateTransactionReceipt(
  transactionId: string,
  receiptUrl: string,
  finalAmount?: number,
  store?: string,
  purchaseDate?: Date
) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Nepřihlášený uživatel" }
  }

  try {
    // Verify the user owns this transaction or is ADMIN
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { requesterId: true, status: true },
    })

    if (!transaction) {
      return { error: MESSAGES.TRANSACTION.NOT_FOUND }
    }

    const isAdmin = session.user.role === "ADMIN"
    if (transaction.requesterId !== session.user.id && !isAdmin) {
      return { error: MESSAGES.AUTH.FORBIDDEN }
    }

    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        receiptUrl,
        finalAmount: finalAmount ?? undefined,
        store: store ?? undefined,
        dueDate: purchaseDate ?? undefined,
        status: "PURCHASED",
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Update transaction receipt error:", error)
    return { error: MESSAGES.TRANSACTION.RECEIPT_UPLOAD_FAILED }
  }
}

export async function updateTransactionPaidStatus(
  transactionId: string,
  isPaid: boolean
) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Nepřihlášený uživatel" }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return { error: "Nemáte oprávnění k této akci" }
    }

    await prisma.transaction.update({
      where: { id: transactionId },
      data: { isPaid },
    })

    return { success: true }
  } catch (error) {
    console.error("Update transaction paid status error:", error)
    return { error: MESSAGES.TRANSACTION.PAID_STATUS_FAILED }
  }
}

export async function updateTransactionFiledStatus(
  transactionId: string,
  isFiled: boolean
) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Nepřihlášený uživatel" }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return { error: "Nemáte oprávnění k této akci" }
    }

    await prisma.transaction.update({
      where: { id: transactionId },
      data: { isFiled },
    })

    return { success: true }
  } catch (error) {
    console.error("Update transaction filed status error:", error)
    return { error: MESSAGES.TRANSACTION.FILED_STATUS_FAILED }
  }
}

export async function updateTransactionExpenseType(
  transactionId: string,
  expenseType: "MATERIAL" | "SERVICE"
) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Nepřihlášený uživatel" }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return { error: "Nemáte oprávnění k této akci" }
    }

    await prisma.transaction.update({
      where: { id: transactionId },
      data: { expenseType } as any,
    })

    return { success: true }
  } catch (error) {
    console.error("Update transaction expense type error:", error)
    return { error: MESSAGES.TRANSACTION.EXPENSE_TYPE_FAILED }
  }
}

export async function deleteTransaction(transactionId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Nepřihlášený uživatel" }
  }

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { requesterId: true, status: true },
    })

    if (!transaction) {
      return { error: MESSAGES.TRANSACTION.NOT_FOUND }
    }

    const isAdmin = session.user.role === "ADMIN"
    const isOwner = transaction.requesterId === session.user.id
    const isDeletableByOwner = isOwner && (transaction.status === "DRAFT" || transaction.status === "PENDING")

    if (!isAdmin && !isDeletableByOwner) {
      return { error: MESSAGES.TRANSACTION.DELETE_FORBIDDEN }
    }

    await prisma.transaction.delete({
      where: { id: transactionId },
    })

    return { success: true }
  } catch (error) {
    console.error("Delete transaction error:", error)
    return { error: MESSAGES.TRANSACTION.DELETE_FAILED }
  }
}

export async function removeReceipt(transactionId: string) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  try {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        receiptUrl: null,
        finalAmount: null,
        status: "APPROVED", // Revert to approved status
      },
    })

    return { success: true }
  } catch (error) {
    return { error: MESSAGES.TRANSACTION.RECEIPT_REMOVE_FAILED }
  }
}

export async function updateTransactionDetails(
  transactionId: string,
  data: {
    purpose?: string
    store?: string
    estimatedAmount?: number
    finalAmount?: number
    dueDate?: Date | null
    status?: TransStatus
    middle_name_honey?: string
  }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: MESSAGES.AUTH.UNAUTHORIZED }
  }

  // Honeypot check
  if (data.middle_name_honey) {
    console.warn("Update transaction honeypot filled, bot detected")
    return { error: MESSAGES.SECURITY.BOT_DETECTED }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "ADMIN") {
      return { error: MESSAGES.AUTH.FORBIDDEN }
    }

    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        ...data,
        store: data.store || null,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Update transaction details error:", error)
    return { error: MESSAGES.TRANSACTION.UPDATE_FAILED }
  }
}

import { getSemester, getSemesterRange } from "@/lib/utils/semesters"

export async function getTransactionsBySemester(
  semesterKey: string,
  filters: {
    requesterId?: string
    sectionId?: string
    status?: TransStatus | TransStatus[]
  } = {}
) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: MESSAGES.AUTH.UNAUTHORIZED }
  }

  const { start, end } = getSemesterRange(semesterKey)

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        ...(filters.requesterId && { requesterId: filters.requesterId }),
        ...(filters.sectionId && { sectionId: filters.sectionId }),
        ...(filters.status && {
          status: Array.isArray(filters.status)
            ? { in: filters.status }
            : filters.status,
        }),
      },
      include: {
        requester: { select: { id: true, fullName: true } },
        section: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    // Serialize Decimals and Dates
    const serialized = transactions.map((t) => ({
      ...t,
      estimatedAmount: Number(t.estimatedAmount),
      finalAmount: t.finalAmount ? Number(t.finalAmount) : null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    }))

    return { transactions: serialized }
  } catch (error) {
    console.error("Get transactions by semester error:", error)
    return { error: "Nepodařilo se načíst transakce pro daný semestr" }
  }
}
export async function getSemesterTotals(
  filters: {
    requesterId?: string
    sectionId?: string
  } = {}
) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: MESSAGES.AUTH.UNAUTHORIZED }
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        ...(filters.requesterId && { requesterId: filters.requesterId }),
        ...(filters.sectionId && { sectionId: filters.sectionId }),
        status: { notIn: ["REJECTED", "DRAFT"] },
      },
      select: {
        estimatedAmount: true,
        finalAmount: true,
        createdAt: true,
        dueDate: true,
      },
    })

    const totals: Record<string, number> = {}

    transactions.forEach((t) => {
      const key = getSemester(new Date(t.dueDate || t.createdAt))
      const amount = t.finalAmount ? Number(t.finalAmount) : Number(t.estimatedAmount)
      totals[key] = (totals[key] || 0) + amount
    })

    return { totals }
  } catch (error) {
    console.error("Get semester totals error:", error)
    return { error: "Nepodařilo se načíst součty semestrů" }
  }
}
