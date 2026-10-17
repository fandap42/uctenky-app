import { describe, it, expect, vi, beforeEach } from "vitest"
import { Writable } from "node:stream"

const { mockAuditCreate, mockLoggerInfo, mockLoggerError } = vi.hoisted(() => ({
  mockAuditCreate: vi.fn(),
  mockLoggerInfo: vi.fn(),
  mockLoggerError: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      create: mockAuditCreate,
    },
  },
}))

import { createLogger } from "@/lib/logger"
import { logAudit } from "@/lib/audit"

describe("lib/logger", () => {
  it("writes structured JSON and redacts sensitive fields", () => {
    const chunks: string[] = []
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(chunk.toString())
        callback()
      },
    })

    const testLogger = createLogger({ level: "info" }, stream)
    testLogger.info(
      {
        userId: "user_123",
        password: "secretPassword",
        nested: {
          bankAccountNumber: "123456789",
          bankAccountPrefix: "19",
          passwordHash: "$2b$10$hash",
        },
      },
      "Test login event"
    )

    expect(chunks.length).toBe(1)
    const parsed = JSON.parse(chunks[0])
    expect(parsed.msg).toBe("Test login event")
    expect(parsed.userId).toBe("user_123")
    expect(parsed.password).toBe("[Redacted]")
    expect(parsed.nested.bankAccountNumber).toBe("[Redacted]")
    expect(parsed.nested.bankAccountPrefix).toBe("[Redacted]")
    expect(parsed.nested.passwordHash).toBe("[Redacted]")
  })
})

describe("lib/audit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLoggerInfo.mockReset()
    mockLoggerError.mockReset()
  })

  it("persists an audit log entry to prisma.auditLog", async () => {
    mockAuditCreate.mockResolvedValueOnce({ id: "audit_1" })

    await logAudit({
      actorId: "admin_1",
      actorEmail: "admin@4fis.cz",
      action: "TICKET_STATUS_CHANGE",
      entityType: "Ticket",
      entityId: "ticket_99",
      metadata: { from: "PENDING_APPROVAL", to: "APPROVED" },
    })

    expect(mockAuditCreate).toHaveBeenCalledTimes(1)
    expect(mockAuditCreate).toHaveBeenCalledWith({
      data: {
        actorId: "admin_1",
        actorEmail: "admin@4fis.cz",
        action: "TICKET_STATUS_CHANGE",
        entityType: "Ticket",
        entityId: "ticket_99",
        metadata: { from: "PENDING_APPROVAL", to: "APPROVED" },
      },
    })
  })

  it("does not throw if prisma.auditLog.create fails", async () => {
    mockAuditCreate.mockRejectedValueOnce(new Error("DB connection failed"))

    await expect(
      logAudit({
        actorId: "admin_1",
        action: "DEPOSIT_DELETE",
        entityType: "Deposit",
        entityId: "dep_1",
      })
    ).resolves.toBeUndefined()

    expect(mockAuditCreate).toHaveBeenCalledTimes(1)
  })
})
