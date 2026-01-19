"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { TransStatus } from "@prisma/client"

export async function createTransaction(formData: FormData) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Nepřihlášený uživatel" }
  }

  // Get user's section
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { sectionId: true },
  })

  if (!user?.sectionId) {
    return { error: "Uživatel není přiřazen k žádné sekci" }
  }

  const purpose = formData.get("purpose") as string
  const store = formData.get("store") as string
  const estimatedAmount = parseFloat(formData.get("estimatedAmount") as string)
  const dueDateStr = formData.get("dueDate") as string
  const dueDate = dueDateStr ? new Date(dueDateStr) : null
  const status = (formData.get("status") as TransStatus) || "DRAFT"

  if (!purpose || !estimatedAmount) {
    return { error: "Vyplňte všechna povinná pole" }
  }

  try {
    await prisma.transaction.create({
      data: {
        requesterId: session.user.id,
        sectionId: user.sectionId,
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
    return { error: "Nepodařilo se vytvořit žádost" }
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
      return { error: "Nemáte oprávnění k této akci. Pouze administrátor může schvalovat žádosti." }
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
    return { error: "Nepodařilo se aktualizovat žádost" }
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
      return { error: "Žádost nebyla nalezena" }
    }

    const isAdmin = session.user.role === "ADMIN"
    if (transaction.requesterId !== session.user.id && !isAdmin) {
      return { error: "Nemáte oprávnění k této akci" }
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
    return { error: "Nepodařilo se nahrát účtenku" }
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
    return { error: "Nepodařilo se aktualizovat stav proplacení" }
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
    return { error: "Nepodařilo se aktualizovat typ výdaje" }
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
      return { error: "Žádost nebyla nalezena" }
    }

    const isAdmin = session.user.role === "ADMIN"
    const isOwner = transaction.requesterId === session.user.id
    const isDeletableByOwner = isOwner && (transaction.status === "DRAFT" || transaction.status === "PENDING")

    if (!isAdmin && !isDeletableByOwner) {
      return { error: "Nemáte oprávnění k smazání této žádosti v jejím aktuálním stavu." }
    }

    await prisma.transaction.delete({
      where: { id: transactionId },
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/admin")
    return { success: true }
  } catch (error) {
    console.error("Delete transaction error:", error)
    return { error: "Nepodařilo se smazat žádost" }
  }
}

export async function removeReceipt(transactionId: string) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: "Oprávnění pouze pro administrátora" }
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
    return { error: "Nepodařilo se odstranit účtenku" }
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
  }
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
    return { error: "Nepodařilo se aktualizovat žádost" }
  }
}

export async function deleteUser(userId: string) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: "Oprávnění pouze pro administrátora" }
  }

  try {
    // Check if user is deleting themselves
    if (session.user.id === userId) {
      return { error: "Nelze smazat vlastní účet" }
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath("/dashboard/users")
    return { success: true }
  } catch (error) {
    return { error: "Nepodařilo se smazat uživatele. Uživatel pravděpodobně má existující žádosti." }
  }
}
