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
  const estimatedAmount = parseFloat(formData.get("estimatedAmount") as string)
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
        estimatedAmount,
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
    // Get user role and section
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, sectionId: true },
    })

    // Get the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { sectionId: true, requesterId: true, status: true },
    })

    if (!transaction) {
      return { error: "Žádost nebyla nalezena" }
    }

    // Check permissions
    const canUpdate =
      user?.role === "FINANCE" ||
      (user?.role === "SECTION_HEAD" && user.sectionId === transaction.sectionId) ||
      (transaction.requesterId === session.user.id &&
        (transaction.status === "DRAFT" || transaction.status === "APPROVED"))

    if (!canUpdate) {
      return { error: "Nemáte oprávnění k této akci" }
    }

    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status },
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/member")
    revalidatePath("/dashboard/head")
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
  finalAmount?: number
) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Nepřihlášený uživatel" }
  }

  try {
    // Verify the user owns this transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { requesterId: true, status: true },
    })

    if (!transaction) {
      return { error: "Žádost nebyla nalezena" }
    }

    if (transaction.requesterId !== session.user.id) {
      return { error: "Nemáte oprávnění k této akci" }
    }

    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        receiptUrl,
        finalAmount: finalAmount ?? undefined,
        status: "PURCHASED",
      },
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/member")
    revalidatePath("/dashboard/head")
    revalidatePath("/dashboard/finance")
    return { success: true }
  } catch (error) {
    console.error("Update transaction receipt error:", error)
    return { error: "Nepodařilo se nahrát účtenku" }
  }
}

export async function deleteTransaction(transactionId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Nepřihlášený uživatel" }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "FINANCE") {
      return { error: "Nemáte oprávnění k této akci" }
    }

    await prisma.transaction.delete({
      where: { id: transactionId },
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/member")
    revalidatePath("/dashboard/head")
    revalidatePath("/dashboard/finance")
    return { success: true }
  } catch (error) {
    console.error("Delete transaction error:", error)
    return { error: "Nepodařilo se smazat žádost" }
  }
}
