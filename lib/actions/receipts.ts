"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { ReceiptStatus, ExpenseType } from "@prisma/client"
import { MESSAGES } from "@/lib/constants/messages"
import { uploadFile } from "@/lib/s3"
import { fileTypeFromBuffer } from "file-type"

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'pdf']
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf'
]

export async function uploadReceipt(formData: FormData) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: MESSAGES.AUTH.UNAUTHORIZED }
  }

  try {
    const file = formData.get("file") as File
    const ticketId = formData.get("ticketId") as string
    const amount = parseFloat(formData.get("amount") as string)
    const store = formData.get("store") as string
    const date = new Date(formData.get("date") as string)
    const expenseType = (formData.get("expenseType") as ExpenseType) || "MATERIAL"
    const note = formData.get("note") as string | null

    if (!ticketId || isNaN(amount) || !formData.get("date") || !file) {
      return { error: "Všechna povinná pole musí být vyplněna (soubor, částka, datum)" }
    }



    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { receipts: true }
    })

    if (!ticket) {
      return { error: "Žádost nebyla nalezena" }
    }

    const isOwner = ticket.requesterId === session.user.id
    const isAdmin = session.user.role === "ADMIN"

    if (ticket.status !== "APPROVED" && !isAdmin) {
      return { error: "Do této žádosti již nelze nahrávat účtenky" }
    }

    if (!isOwner && !isAdmin) {
      return { error: MESSAGES.AUTH.FORBIDDEN }
    }

    // Validate file extension
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return { error: MESSAGES.UPLOAD.INVALID_EXTENSION }
    }

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      return { error: MESSAGES.UPLOAD.FILE_TOO_LARGE }
    }

    // Convert file to buffer for magic byte validation
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validate file content (magic bytes) to prevent MIME spoofing
    const fileType = await fileTypeFromBuffer(buffer)
    if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType.mime)) {
      return { error: MESSAGES.UPLOAD.INVALID_CONTENT }
    }

    // Validation: Date
    const ticketCreatedAt = new Date(ticket.createdAt)
    const ticketDate = new Date(ticketCreatedAt < ticket.targetDate ? ticketCreatedAt : ticket.targetDate)
    if (date < ticketDate) {
      return { error: "Datum účtenky nesmí být starší než datum vytvoření žádosti" }
    }

    // Validation: Budget
    const currentTotal = ticket.receipts.reduce((sum, r) => sum + Number(r.amount), 0)
    const newTotal = currentTotal + amount
    if (newTotal > Number(ticket.budgetAmount) + 500) {
      return { error: `Celková částka účtenek překračuje schválený rozpočet o více než 500 Kč (Limit: ${Number(ticket.budgetAmount) + 500} Kč)` }
    }

    // Generate unique filename
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const key = `receipts/${year}/${month}/${ticketId}-${Date.now()}.${fileType.ext}`

    // Upload to MinIO
    const url = await uploadFile(buffer, key, fileType.mime)

    await prisma.receipt.create({
      data: {
        ticketId,
        store: store || "Neznámý obchod",
        date,
        amount,
        fileUrl: url,
        expenseType,
        note,
        status: "PENDING",
      }
    })

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("Upload receipt error:", error)
    return { error: "Nepodařilo se nahrát účtenku" }
  }
}

export async function updateReceiptStatus(
  receiptId: string,
  status: ReceiptStatus
) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  try {
    await prisma.receipt.update({
      where: { id: receiptId },
      data: { status },
    })

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("Update receipt status error:", error)
    return { error: MESSAGES.TRANSACTION.UPDATE_FAILED }
  }
}

export async function toggleReceiptPaid(
  receiptId: string,
  isPaid: boolean
) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  try {
    await prisma.receipt.update({
      where: { id: receiptId },
      data: { isPaid },
    })

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("Toggle receipt paid status error:", error)
    return { error: "Nepodařilo se změnit stav proplacení" }
  }
}

export async function toggleReceiptFiled(
  receiptId: string,
  isFiled: boolean
) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  try {
    await prisma.receipt.update({
      where: { id: receiptId },
      data: { isFiled },
    })

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("Toggle receipt filed status error:", error)
    return { error: "Nepodařilo se změnit stav zařazení" }
  }
}

export async function updateReceiptExpenseType(
  receiptId: string,
  expenseType: ExpenseType
) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  try {
    await prisma.receipt.update({
      where: { id: receiptId },
      data: { expenseType },
    })

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("Update receipt expense type error:", error)
    return { error: "Nepodařilo se změnit typ výdaje" }
  }
}



export async function payAllReceiptsInTicket(ticketId: string) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  try {
    await prisma.receipt.updateMany({
      where: { ticketId },
      data: { isPaid: true },
    })

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("Pay all receipts error:", error)
    return { error: "Nepodařilo se proplatit všechny účtenky" }
  }
}

export async function deleteReceipt(receiptId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: MESSAGES.AUTH.UNAUTHORIZED }
  }

  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: { ticket: true }
    })

    if (!receipt) {
      return { error: "Účtenka nebyla nalezena" }
    }

    const isAdmin = session.user.role === "ADMIN"
    const isOwner = receipt.ticket.requesterId === session.user.id
    
    // Allow owner to delete only if ticket is still in APPROVED phase (uploading)
    if (!isAdmin && !(isOwner && receipt.ticket.status === "APPROVED")) {
      return { error: MESSAGES.AUTH.FORBIDDEN }
    }

    await prisma.receipt.delete({
      where: { id: receiptId }
    })

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("Delete receipt error:", error)
    return { error: "Nepodařilo se smazat účtenku" }
  }
}

export async function updateReceiptDetails(
  receiptId: string,
  data: {
    store: string
    amount: number
    date: Date
    expenseType: ExpenseType
    note?: string | null
  }
) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  try {
    await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        store: data.store,
        amount: data.amount,
        date: data.date,
        expenseType: data.expenseType,
        note: data.note,
      },
    })

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("Update receipt details error:", error)
    return { error: MESSAGES.TRANSACTION.UPDATE_FAILED }
  }
}

export async function updateReceiptNote(
  receiptId: string,
  note: string
) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: MESSAGES.AUTH.UNAUTHORIZED }
  }

  try {
    await prisma.receipt.update({
      where: { id: receiptId },
      data: { note },
    })

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("Update receipt note error:", error)
    return { error: "Nepodařilo se uložit poznámku" }
  }
}
