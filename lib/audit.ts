import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { Prisma } from "@prisma/client"

export type AuditEntityType =
  | "Ticket"
  | "Receipt"
  | "Deposit"
  | "DebtError"
  | "CashOnHand"
  | "User"
  | "BankAccount"

export type AuditAction =
  | "TICKET_CREATE"
  | "TICKET_STATUS_CHANGE"
  | "TICKET_FILED_TOGGLE"
  | "TICKET_SUBMIT_VERIFICATION"
  | "TICKET_DELETE"
  | "TICKET_ASSIGN_PROCESSOR"
  | "TICKET_UPDATE_DETAILS"
  | "RECEIPT_UPLOAD"
  | "RECEIPT_STATUS_CHANGE"
  | "RECEIPT_PAID_TOGGLE"
  | "RECEIPT_FILED_TOGGLE"
  | "RECEIPT_EXPENSE_TYPE_CHANGE"
  | "RECEIPT_PAY_ALL"
  | "RECEIPT_DELETE"
  | "RECEIPT_UPDATE_DETAILS"
  | "RECEIPT_UPDATE_NOTE"
  | "DEPOSIT_CREATE"
  | "DEPOSIT_UPDATE"
  | "DEPOSIT_DELETE"
  | "DEBT_ERROR_CREATE"
  | "DEBT_ERROR_DELETE"
  | "CASH_ON_HAND_CREATE"
  | "CASH_ON_HAND_DELETE"
  | "BANK_ACCOUNT_UPDATE"
  | "USER_CREATE"
  | "USER_ROLE_CHANGE"
  | "USER_PASSWORD_CHANGE"
  | "USER_DELETE"

export interface AuditLogInput {
  actorId?: string | null
  actorEmail?: string | null
  action: AuditAction
  entityType: AuditEntityType
  entityId?: string | null
  metadata?: Record<string, unknown> | null
}

/**
 * Records a domain audit event into the database (`audit_logs`) and outputs
 * a structured info log via Pino. Never throws so that an audit logging failure
 * cannot break a completed business transaction.
 */
export async function logAudit(input: AuditLogInput): Promise<void> {
  const { actorId, actorEmail, action, entityType, entityId, metadata } = input

  logger.info(
    {
      audit: true,
      actorId: actorId ?? null,
      action,
      entityType,
      entityId: entityId ?? null,
      metadata: metadata ?? undefined,
    },
    `[audit] ${action} on ${entityType}${entityId ? ` (${entityId})` : ""}`
  )

  try {
    await prisma.auditLog.create({
      data: {
        actorId: actorId ?? null,
        actorEmail: actorEmail ?? null,
        action,
        entityType,
        entityId: entityId ?? null,
        metadata: metadata
          ? (metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    })
  } catch (err) {
    logger.error(
      {
        err,
        actorId: actorId ?? null,
        action,
        entityType,
        entityId: entityId ?? null,
      },
      "[audit] Failed to persist audit log entry to database"
    )
  }
}
