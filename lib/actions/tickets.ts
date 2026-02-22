"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { TicketStatus } from "@prisma/client"
import { MESSAGES } from "@/lib/constants/messages"
import { getSemester, getSemesterRange, getCurrentSemester } from "@/lib/utils/semesters"
import { sendEmail } from "@/lib/email"

export async function createTicket(formData: FormData) {
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
  const budgetAmount = parseFloat(formData.get("budgetAmount") as string)
  const sectionId = formData.get("sectionId") as string
  const targetDateStr = formData.get("targetDate") as string
  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date()

  if (!purpose || isNaN(budgetAmount)) {
    return { error: MESSAGES.TRANSACTION.MISSING_FIELDS }
  }

  if (!sectionId) {
    return { error: MESSAGES.TRANSACTION.MISSING_SECTION }
  }

  try {
    await prisma.ticket.create({
      data: {
        requesterId: session.user.id,
        sectionId,
        purpose,
        budgetAmount,
        targetDate,
        status: "PENDING_APPROVAL",
      },
    })

    try {
      const admins = await prisma.user.findMany({ 
        where: { role: "ADMIN", receiveAdminEmails: true }, 
        select: { email: true } 
      })
      const adminEmails = admins.map((a) => a.email).filter(Boolean) as string[]
      if (adminEmails.length > 0) {
        await sendEmail({
          to: adminEmails,
          subject: "Nová žádost ke schválení",
          html: `<p>Uživatel <b>${(session.user as { fullName?: string | null }).fullName || session.user.name || session.user.email}</b> vytvořil novou žádost: <b>${purpose}</b>.</p><p><a href="${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard/zadosti">Zobrazit žádosti</a></p>`
        })
      }
    } catch (e) {
      console.error("Failed to send create ticket email", e)
    }

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("Create ticket error:", error)
    return { error: "Nepodařilo se vytvořit žádost" }
  }
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  try {
    const previousTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { requester: true }
    })

    const isReturningToApproved =
      previousTicket?.status === "VERIFICATION" && status === "APPROVED"

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status,
        isReturned: isReturningToApproved ? true : undefined,
      },
    })

    if (
      previousTicket &&
      previousTicket.status !== status &&
      previousTicket.requester?.email &&
      (previousTicket.requester as unknown as { receiveEmails?: boolean })?.receiveEmails
    ) {
      try {
        let subject = ""
        let msg = ""
        if (status === "APPROVED") {
          if (previousTicket.status === "VERIFICATION") {
            subject = "Žádost byla vrácena z ověřování"
            msg = `Vaše žádost <b>${previousTicket.purpose}</b> byla administrátorem vrácena z ověřování zpět k úpravám.`
          } else {
            subject = "Žádost byla schválena"
            msg = `Vaše žádost <b>${previousTicket.purpose}</b> byla schválena.`
          }
        } else if (status === "REJECTED") {
          subject = "Žádost byla zamítnuta"
          msg = `Vaše žádost <b>${previousTicket.purpose}</b> byla zamítnuta.`
        }

        if (subject) {
          await sendEmail({
            to: previousTicket.requester.email,
            subject,
            html: `<p>${msg}</p><p><a href="${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard">Zobrazit přehled</a></p>`
          })
        }
      } catch (e) {
        console.error("Failed to send status update email", e)
      }
    }

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("Update ticket status error:", error)
    return { error: MESSAGES.TRANSACTION.UPDATE_FAILED }
  }
}

export async function toggleTicketFiled(
  ticketId: string,
  isFiled: boolean
) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  try {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { isFiled },
    })

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("Toggle ticket filed status error:", error)
    return { error: "Nepodařilo se změnit stav zařazení" }
  }
}

export async function submitForVerification(ticketId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: MESSAGES.AUTH.UNAUTHORIZED }
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { receipts: true },
    })

    if (!ticket) {
      return { error: "Žádost nebyla nalezena" }
    }

    if (ticket.requesterId !== session.user.id && session.user.role !== "ADMIN") {
      return { error: MESSAGES.AUTH.FORBIDDEN }
    }

    if (ticket.receipts.length === 0) {
      return { error: "Před odesláním ke kontrole je nutné nahrát alespoň jednu účtenku" }
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "VERIFICATION", isReturned: false },
    })

    try {
      const admins = await prisma.user.findMany({ 
        where: { role: "ADMIN", receiveAdminEmails: true }, 
        select: { email: true } 
      })
      const adminEmails = admins.map((a) => a.email).filter(Boolean) as string[]
      if (adminEmails.length > 0) {
        await sendEmail({
          to: adminEmails,
          subject: "Žádost čeká na ověření",
          html: `<p>Uživatel zaslal žádost <b>${ticket.purpose}</b> k ověření.</p><p><a href="${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard/pokladna">Zobrazit pokladnu</a></p>`
        })
      }
    } catch (e) {
      console.error("Failed to send verification ticket email", e)
    }

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("Submit for verification error:", error)
    return { error: "Nepodařilo se odeslat ke kontrole" }
  }
}

export async function deleteTicket(ticketId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: MESSAGES.AUTH.UNAUTHORIZED }
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { requesterId: true, status: true },
    })

    if (!ticket) {
      return { error: MESSAGES.TRANSACTION.NOT_FOUND }
    }

    const isAdmin = session.user.role === "ADMIN"
    const isOwner = ticket.requesterId === session.user.id
    const isDeletable = isAdmin || (isOwner && ticket.status === "PENDING_APPROVAL")

    if (!isDeletable) {
      return { error: MESSAGES.TRANSACTION.DELETE_FORBIDDEN }
    }

    await prisma.ticket.delete({
      where: { id: ticketId },
    })

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("Delete ticket error:", error)
    return { error: MESSAGES.TRANSACTION.DELETE_FAILED }
  }
}

export async function getTickets(filters: {
  requesterId?: string
  sectionId?: string
  status?: TicketStatus | TicketStatus[]
} = {}) {
  try {
    // Get current semester range to filter out old DONE tickets
    const currentSemester = getCurrentSemester()
    const { start: semesterStart } = getSemesterRange(currentSemester)

    const tickets = await prisma.ticket.findMany({
      where: {
        ...(filters.requesterId && { requesterId: filters.requesterId }),
        ...(filters.sectionId && { sectionId: filters.sectionId }),
        ...(filters.status && {
          status: Array.isArray(filters.status)
            ? { in: filters.status }
            : filters.status,
        }),
        // Hide DONE tickets from previous semesters (based on target date)
        OR: [
          { status: { not: "DONE" } },
          { 
            AND: [
              { status: "DONE" },
              { targetDate: { gte: semesterStart } }
            ]
          }
        ]
      },
      include: {
        requester: { select: { id: true, fullName: true, image: true } },
        section: { select: { id: true, name: true } },
        receipts: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return { 
      tickets: tickets.map(t => ({
        ...t,
        budgetAmount: Number(t.budgetAmount),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        targetDate: t.targetDate.toISOString(),
        receipts: t.receipts.map(r => ({
          ...r,
          amount: Number(r.amount),
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          date: r.date.toISOString(),
        }))
      }))
    }
  } catch (error) {
    console.error("Get tickets error:", error)
    return { error: "Nepodařilo se načíst žádosti" }
  }
}

export async function updateTicketDetails(
  ticketId: string,
  data: {
    purpose: string
    budgetAmount: number
    targetDate: Date
    status: TicketStatus
    note?: string
    middle_name_honey?: string
  }
) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  // Honeypot check
  if (data.middle_name_honey) {
    return { error: MESSAGES.SECURITY.BOT_DETECTED }
  }

  try {
    const previousTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { requester: true }
    })

    const isReturningToApproved =
      previousTicket?.status === "VERIFICATION" && data.status === "APPROVED"

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        purpose: data.purpose,
        budgetAmount: data.budgetAmount,
        targetDate: data.targetDate,
        status: data.status,
        note: data.note,
        isReturned: isReturningToApproved ? true : undefined,
      },
    })

    if (
      previousTicket &&
      previousTicket.status !== data.status &&
      previousTicket.requester?.email &&
      (previousTicket.requester as unknown as { receiveEmails?: boolean })?.receiveEmails
    ) {
      try {
        let subject = ""
        let msg = ""
        if (data.status === "APPROVED") {
          if (previousTicket.status === "VERIFICATION") {
            subject = "Žádost byla vrácena z ověřování"
            msg = `Vaše žádost <b>${previousTicket.purpose}</b> byla administrátorem vrácena z ověřování zpět k úpravám.`
          } else {
            subject = "Žádost byla schválena"
            msg = `Vaše žádost <b>${previousTicket.purpose}</b> byla schválena.`
          }
        } else if (data.status === "REJECTED") {
          subject = "Žádost byla zamítnuta"
          msg = `Vaše žádost <b>${previousTicket.purpose}</b> byla zamítnuta.`
        }

        if (subject) {
          await sendEmail({
            to: previousTicket.requester.email,
            subject,
            html: `<p>${msg}</p><p><a href="${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard">Zobrazit přehled</a></p>`
          })
        }
      } catch (e) {
        console.error("Failed to send status update email", e)
      }
    }

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("Update ticket details error:", error)
    return { error: MESSAGES.TRANSACTION.UPDATE_FAILED }
  }
}


export async function getTicketsBySemester(
  semesterKey: string,
  filters: {
    requesterId?: string
    sectionId?: string
    status?: TicketStatus | TicketStatus[]
  } = {}
) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: MESSAGES.AUTH.UNAUTHORIZED }
  }

  const { start, end } = getSemesterRange(semesterKey)

  try {
    const tickets = await prisma.ticket.findMany({
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
        requester: { select: { id: true, fullName: true, image: true } },
        section: { select: { id: true, name: true } },
        receipts: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const serialized = tickets.map((t) => ({
      ...t,
      budgetAmount: Number(t.budgetAmount),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      targetDate: t.targetDate.toISOString(),
      receipts: t.receipts.map(r => ({
        ...r,
        amount: Number(r.amount),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        date: r.date.toISOString(),
      }))
    }))

    return { transactions: serialized } // Keeping 'transactions' key for backward compatibility in the component
  } catch (error) {
    console.error("Get tickets by semester error:", error)
    return { error: "Nepodařilo se načíst žádosti pro daný semestr" }
  }
}

export async function getTicketSemesterTotals(
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
    const tickets = await prisma.ticket.findMany({
      where: {
        ...(filters.requesterId && { requesterId: filters.requesterId }),
        ...(filters.sectionId && { sectionId: filters.sectionId }),
        status: { not: "PENDING_APPROVAL" }, // Only count if approved or further
      },
      include: {
        receipts: true,
      },
    })

    const totals: Record<string, number> = {}

    tickets.forEach((t) => {
      const key = getSemester(new Date(t.createdAt))
      // Total is sum of receipts, or 0 if none
      const amount = t.receipts.reduce((sum, r) => sum + Number(r.amount), 0)
      totals[key] = (totals[key] || 0) + amount
    })

    return { totals }
  } catch (error) {
    console.error("Get ticket semester totals error:", error)
    return { error: "Nepodařilo se načíst součty semestrů" }
  }
}
