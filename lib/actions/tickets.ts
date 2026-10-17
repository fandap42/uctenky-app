"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { TicketStatus } from "@prisma/client"
import { isHeadRole, getSectionForRole } from "@/lib/utils/roles"
import { MESSAGES } from "@/lib/constants/messages"
import { getSemester, getSemesterRange, getCurrentSemester, sortSemesterKeys } from "@/lib/utils/semesters"
import { sendEmail } from "@/lib/email"
import { escapeHtml } from "@/lib/utils/html"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit"

async function getHeadSectionId(role: string): Promise<string | null> {
  // Resolve user's section from HEAD role
  if (!isHeadRole(role)) return null
  const sectionName = getSectionForRole(role)
  if (!sectionName) return null
  const section = await prisma.section.findFirst({
    where: { name: sectionName, isActive: true },
    select: { id: true },
  })
  return section?.id ?? null
}

async function getCurrentUserRole(userId: string): Promise<string | null> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  return dbUser?.role ?? null
}

async function authorizeTicketFilters(
  user: { id: string; role?: string | null },
  filters: { requesterId?: string; sectionId?: string }
): Promise<{ requesterId?: string; sectionId?: string } | null> {
  const { requesterId, sectionId } = filters
  const role = await getCurrentUserRole(user.id)
  if (!role) {
    return null
  }

  if (role === "ADMIN") {
    return { requesterId, sectionId }
  }

  if (requesterId && requesterId !== user.id) {
    return null
  }

  if (sectionId) {
    const headSectionId = await getHeadSectionId(role)
    if (headSectionId !== sectionId) {
      return null
    }
  }

  if (!requesterId && !sectionId) {
    return { requesterId: user.id }
  }

  return { requesterId, sectionId }
}

async function notifyRequesterOfStatusChange(
  ticket: {
    purpose: string
    status: TicketStatus
    requester: { email: string; receiveEmails: boolean } | null
  },
  newStatus: TicketStatus
) {
  if (ticket.status === newStatus || !ticket.requester?.email || !ticket.requester.receiveEmails) {
    return
  }

  try {
    const purpose = escapeHtml(ticket.purpose)
    let subject = ""
    let msg = ""
    if (newStatus === "APPROVED") {
      if (ticket.status === "VERIFICATION") {
        subject = "Žádost byla vrácena z ověřování"
        msg = `Vaše žádost <b>${purpose}</b> byla administrátorem vrácena z ověřování zpět k úpravám.`
      } else {
        subject = "Žádost byla schválena"
        msg = `Vaše žádost <b>${purpose}</b> byla schválena.`
      }
    } else if (newStatus === "REJECTED") {
      subject = "Žádost byla zamítnuta"
      msg = `Vaše žádost <b>${purpose}</b> byla zamítnuta.`
    }

    if (subject) {
      await sendEmail({
        to: ticket.requester.email,
        subject,
        html: `<p>${msg}</p><p><a href="${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard">Zobrazit přehled</a></p>`
      })
    }
  } catch (e) {
    logger.error({ err: e, newStatus }, "Failed to send status update email")
  }
}

function isValidAmount(value: number): boolean {
  return Number.isFinite(value) && value > 0
}

function isValidDate(value: Date): boolean {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

export async function createTicket(formData: FormData) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: MESSAGES.AUTH.UNAUTHORIZED }
  }

  // Honeypot check for bots
  const honeypot = formData.get("full_name_honey") as string
  if (honeypot) {
    logger.warn({ userId: session.user.id }, "Honeypot filled on createTicket, bot detected")
    return { error: MESSAGES.SECURITY.BOT_DETECTED }
  }

  const purpose = formData.get("purpose") as string
  const budgetAmount = parseFloat(formData.get("budgetAmount") as string)
  const sectionId = formData.get("sectionId") as string
  const targetDateStr = formData.get("targetDate") as string
  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date()
  const requestedUserId = formData.get("requesterId") as string | null

  if (!isValidDate(targetDate)) {
    return { error: MESSAGES.TRANSACTION.INVALID_DATE }
  }

  const minTargetDate = new Date()
  minTargetDate.setHours(0, 0, 0, 0)
  minTargetDate.setDate(minTargetDate.getDate() + 7)

  const isAdmin = session.user.role === "ADMIN"
  if (!isAdmin && targetDate < minTargetDate) {
    return { error: MESSAGES.TRANSACTION.INVALID_TARGET_DATE }
  }

  if (isAdmin && requestedUserId && requestedUserId !== session.user.id) {
    const user = await prisma.user.findUnique({ where: { id: requestedUserId } })
    if (!user) {
      return { error: "Vybraný uživatel neexistuje" }
    }
  }

  if (!purpose?.trim() || isNaN(budgetAmount)) {
    return { error: MESSAGES.TRANSACTION.MISSING_FIELDS }
  }

  if (!isValidAmount(budgetAmount)) {
    return { error: MESSAGES.UPLOAD.INVALID_AMOUNT }
  }

  if (!sectionId) {
    return { error: MESSAGES.TRANSACTION.MISSING_SECTION }
  }

  const section = await prisma.section.findFirst({
    where: { id: sectionId, isActive: true },
    select: { id: true },
  })
  if (!section) {
    return { error: MESSAGES.TRANSACTION.MISSING_SECTION }
  }

  try {
    const createdTicket = await prisma.ticket.create({
      data: {
        requesterId:
          isAdmin && requestedUserId && requestedUserId.length > 0
            ? requestedUserId
            : session.user.id,
        sectionId,
        purpose,
        budgetAmount,
        targetDate,
        status: "PENDING_APPROVAL",
      },
    })

    await logAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "TICKET_CREATE",
      entityType: "Ticket",
      entityId: createdTicket.id,
      metadata: {
        purpose,
        budgetAmount,
        sectionId,
        requesterId: createdTicket.requesterId,
      },
    })

    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", receiveAdminEmails: true },
        select: { email: true }
      })
      const adminEmails = admins.map((a) => a.email).filter(Boolean) as string[]
      if (adminEmails.length > 0) {
        const requesterName =
          (session.user as { fullName?: string | null }).fullName ||
          session.user.name ||
          session.user.email ||
          "Neznámý uživatel"

        await sendEmail({
          to: adminEmails,
          subject: "Nová žádost ke schválení",
          html: `<p>Uživatel <b>${escapeHtml(requesterName)}</b> vytvořil novou žádost: <b>${escapeHtml(purpose)}</b>.</p><p><a href="${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard/zadosti">Zobrazit žádosti</a></p>`
        })
      }
    } catch (e) {
      logger.error({ err: e, ticketId: createdTicket.id }, "Failed to send create ticket email")
    }

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id }, "Create ticket error")
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

    await logAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "TICKET_STATUS_CHANGE",
      entityType: "Ticket",
      entityId: ticketId,
      metadata: {
        from: previousTicket?.status ?? null,
        to: status,
        isReturned: isReturningToApproved,
      },
    })

    if (previousTicket) {
      await notifyRequesterOfStatusChange(previousTicket, status)
    }

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id, ticketId, status }, "Update ticket status error")
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

    await logAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "TICKET_FILED_TOGGLE",
      entityType: "Ticket",
      entityId: ticketId,
      metadata: { isFiled },
    })

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id, ticketId, isFiled }, "Toggle ticket filed status error")
    return { error: "Nepodařilo se změnit stav zařazení" }
  }
}

export async function submitForVerification(ticketId: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: MESSAGES.AUTH.UNAUTHORIZED }
  }

  try {
    const requesterName =
      (session.user as { fullName?: string | null }).fullName ||
      session.user.name ||
      session.user.email ||
      "Neznámý uživatel"

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

    await logAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "TICKET_SUBMIT_VERIFICATION",
      entityType: "Ticket",
      entityId: ticketId,
      metadata: {
        from: ticket.status,
        to: "VERIFICATION",
        receiptCount: ticket.receipts.length,
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
          subject: "Žádost čeká na ověření",
          html: `<p>Uživatel <b>${escapeHtml(requesterName)}</b> zaslal žádost <b>${escapeHtml(ticket.purpose)}</b> k ověření.</p><p><a href="${process.env.AUTH_URL || 'http://localhost:3000'}/dashboard/pokladna">Zobrazit pokladnu</a></p>`
        })
      }
    } catch (e) {
      logger.error({ err: e, ticketId }, "Failed to send verification ticket email")
    }

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id, ticketId }, "Submit for verification error")
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
      select: { requesterId: true, status: true, purpose: true, budgetAmount: true },
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

    await logAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "TICKET_DELETE",
      entityType: "Ticket",
      entityId: ticketId,
      metadata: {
        purpose: ticket.purpose,
        budgetAmount: Number(ticket.budgetAmount),
        status: ticket.status,
      },
    })

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id, ticketId }, "Delete ticket error")
    return { error: MESSAGES.TRANSACTION.DELETE_FAILED }
  }
}

export async function assignTicketProcessor(ticketId: string, processorId: string | null) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  try {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { processingById: processorId },
    })

    await logAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "TICKET_ASSIGN_PROCESSOR",
      entityType: "Ticket",
      entityId: ticketId,
      metadata: { processorId },
    })

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id, ticketId, processorId }, "Assign ticket processor error")
    return { error: MESSAGES.TRANSACTION.UPDATE_FAILED }
  }
}

export async function getTickets(filters: {
  requesterId?: string
  sectionId?: string
  status?: TicketStatus | TicketStatus[]
  type?: 'active' | 'historical' | 'all'
  semesterKey?: string
} = {}) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: MESSAGES.AUTH.UNAUTHORIZED }
  }

  try {
    const authorizedFilters = await authorizeTicketFilters(session.user, filters)
    if (!authorizedFilters) {
      return { error: MESSAGES.AUTH.FORBIDDEN }
    }

    // Get current semester range to filter out old DONE tickets
    const currentSemester = getCurrentSemester()
    const { start: semesterStart } = getSemesterRange(currentSemester)

    const type = filters.type || 'active'

    // Optional semester date range filter
    const semesterDateFilter = filters.semesterKey
      ? (() => {
          const { start, end } = getSemesterRange(filters.semesterKey)
          return { targetDate: { gte: start, lte: end } }
        })()
      : undefined

    const tickets = await prisma.ticket.findMany({
      where: {
        ...(authorizedFilters.requesterId && { requesterId: authorizedFilters.requesterId }),
        ...(authorizedFilters.sectionId && { sectionId: authorizedFilters.sectionId }),
        ...(filters.status && {
          status: Array.isArray(filters.status)
            ? { in: filters.status }
            : filters.status,
        }),
        ...semesterDateFilter,
        ...(type === 'historical' ? {
          AND: [
            {
              OR: [
                { status: 'REJECTED' },
                {
                  AND: [
                    { status: 'DONE' },
                    { targetDate: { lt: semesterStart } }
                  ]
                }
              ]
            }
          ]
        } : type === 'active' ? {
          AND: [
            { status: { not: 'REJECTED' } },
            {
              OR: [
                { status: { not: 'DONE' } },
                {
                  AND: [
                    { status: 'DONE' },
                    { targetDate: { gte: semesterStart } }
                  ]
                }
              ]
            }
          ]
        } : {}) // 'all'
      },
      include: {
        requester: { select: { id: true, fullName: true, image: true } },
        processingBy: { select: { id: true, fullName: true, image: true } },
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
    logger.error({ err: error, userId: session.user.id }, "Get tickets error")
    return { error: "Nepodařilo se načíst žádosti" }
  }
}

export async function getArchivedSemesters(filters: { requesterId?: string; sectionId?: string } = {}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: MESSAGES.AUTH.UNAUTHORIZED, semesters: [] }
    }

    // Enforce authorization: non-admins can only query their own data
    const authorizedFilters = await authorizeTicketFilters(session.user, filters)
    if (!authorizedFilters) {
      return { error: MESSAGES.AUTH.UNAUTHORIZED, semesters: [] }
    }

    const currentSemester = getCurrentSemester()
    const { start: semesterStart } = getSemesterRange(currentSemester)

    const tickets = await prisma.ticket.findMany({
      where: {
        ...(authorizedFilters.requesterId && { requesterId: authorizedFilters.requesterId }),
        ...(authorizedFilters.sectionId && { sectionId: authorizedFilters.sectionId }),
        OR: [
          { status: 'REJECTED' },
          {
            AND: [
              { status: 'DONE' },
              { targetDate: { lt: semesterStart } }
            ]
          }
        ]
      },
      select: { targetDate: true },
    })

    const semesterKeys = new Set(tickets.map(t => getSemester(t.targetDate)))
    return { semesters: sortSemesterKeys(Array.from(semesterKeys)) }
  } catch (error) {
    logger.error({ err: error }, "Get archived semesters error")
    return { error: "Nepodařilo se načíst semestry", semesters: [] }
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

  if (!session?.user?.id) {
    return { error: MESSAGES.AUTH.UNAUTHORIZED }
  }

  // Honeypot check
  if (data.middle_name_honey) {
    logger.warn({ userId: session.user.id, ticketId }, "Honeypot filled on updateTicketDetails, bot detected")
    return { error: MESSAGES.SECURITY.BOT_DETECTED }
  }

  try {
    const previousTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { requester: true }
    })

    if (!previousTicket) {
      return { error: MESSAGES.TRANSACTION.NOT_FOUND }
    }

    const isAdmin = session.user.role === "ADMIN"
    const isOwner = previousTicket.requesterId === session.user.id

    if (!data.purpose?.trim()) {
      return { error: MESSAGES.TRANSACTION.MISSING_FIELDS }
    }

    if (!isValidAmount(data.budgetAmount)) {
      return { error: MESSAGES.UPLOAD.INVALID_AMOUNT }
    }

    if (!isValidDate(data.targetDate)) {
      return { error: MESSAGES.TRANSACTION.INVALID_DATE }
    }

    const minTargetDate = new Date()
    minTargetDate.setHours(0, 0, 0, 0)
    minTargetDate.setDate(minTargetDate.getDate() + 7)

    if (!isAdmin && data.targetDate < minTargetDate) {
      return { error: MESSAGES.TRANSACTION.INVALID_TARGET_DATE }
    }

    if (!isAdmin && !(isOwner && previousTicket.status === "PENDING_APPROVAL")) {
      return { error: MESSAGES.AUTH.FORBIDDEN }
    }

    const newStatus = isAdmin ? data.status : previousTicket.status
    const isReturningToApproved =
      previousTicket.status === "VERIFICATION" && newStatus === "APPROVED"

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        purpose: data.purpose,
        budgetAmount: data.budgetAmount,
        targetDate: data.targetDate,
        status: newStatus,
        note: data.note,
        isReturned: isReturningToApproved ? true : undefined,
      },
    })

    await logAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "TICKET_UPDATE_DETAILS",
      entityType: "Ticket",
      entityId: ticketId,
      metadata: {
        fromStatus: previousTicket.status,
        toStatus: newStatus,
        fromBudget: Number(previousTicket.budgetAmount),
        toBudget: data.budgetAmount,
        purpose: data.purpose,
      },
    })

    await notifyRequesterOfStatusChange(previousTicket, newStatus)

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id, ticketId }, "Update ticket details error")
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

  if (!session?.user?.id || (await getCurrentUserRole(session.user.id)) !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
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
        processingBy: { select: { id: true, fullName: true, image: true } },
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
    logger.error({ err: error, userId: session.user.id, semesterKey }, "Get tickets by semester error")
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

  if (!session?.user?.id || (await getCurrentUserRole(session.user.id)) !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
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
    logger.error({ err: error, userId: session.user.id }, "Get ticket semester totals error")
    return { error: "Nepodařilo se načíst součty semestrů" }
  }
}
