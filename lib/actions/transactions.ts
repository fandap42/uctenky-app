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

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/head")
    revalidatePath("/dashboard/admin")
    revalidatePath("/dashboard/finance")
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

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/head")
    revalidatePath("/dashboard/admin")
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

    revalidatePath("/dashboard/admin")
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

    revalidatePath("/dashboard/admin")
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

    revalidatePath("/dashboard/admin")
    revalidatePath("/dashboard")
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

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/admin")
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

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/admin")
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

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/head")
    revalidatePath("/dashboard/admin")
    return { success: true }
  } catch (error) {
    console.error("Update transaction details error:", error)
    return { error: MESSAGES.TRANSACTION.UPDATE_FAILED }
  }
}

