import { describe, it, expect, vi, beforeEach } from "vitest"
import { Writable } from "node:stream"
import { Prisma } from "@prisma/client"

const { mockAuditCreate } = vi.hoisted(() => ({
  mockAuditCreate: vi.fn(),
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
        newPassword: "newSecretPassword",
        nested: {
          bankAccountNumber: "123456789",
          bankAccountPrefix: "19",
          passwordHash: "$2b$10$hash",
          accountNumber: "987654321",
        },
        headers: {
          authorization: "Bearer secret-token",
          cookie: "session=secret",
        },
      },
      "Test login event"
    )

    expect(chunks.length).toBe(1)
    const parsed = JSON.parse(chunks[0])
    expect(parsed.msg).toBe("Test login event")
    expect(parsed.userId).toBe("user_123")
    expect(parsed.password).toBe("[Redacted]")
    expect(parsed.newPassword).toBe("[Redacted]")
    expect(parsed.nested.bankAccountNumber).toBe("[Redacted]")
    expect(parsed.nested.bankAccountPrefix).toBe("[Redacted]")
    expect(parsed.nested.passwordHash).toBe("[Redacted]")
    expect(parsed.nested.accountNumber).toBe("[Redacted]")
    expect(parsed.headers.authorization).toBe("[Redacted]")
    expect(parsed.headers.cookie).toBe("[Redacted]")
  })

  it("respects log levels and filters out debug messages when level is info", () => {
    const chunks: string[] = []
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(chunk.toString())
        callback()
      },
    })

    const testLogger = createLogger({ level: "info" }, stream)
    testLogger.debug({ detail: "debug-only" }, "Should not appear")
    testLogger.warn({ detail: "warn-visible" }, "Should appear")

    expect(chunks.length).toBe(1)
    const parsed = JSON.parse(chunks[0])
    expect(parsed.msg).toBe("Should appear")
    expect(parsed.detail).toBe("warn-visible")
  })
})

describe("lib/audit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("persists an audit log entry to prisma.auditLog with metadata", async () => {
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

  it("stores Prisma.JsonNull when metadata is omitted", async () => {
    mockAuditCreate.mockResolvedValueOnce({ id: "audit_2" })

    await logAudit({
      actorId: "admin_1",
      action: "USER_PASSWORD_CHANGE",
      entityType: "User",
      entityId: "user_2",
    })

    expect(mockAuditCreate).toHaveBeenCalledWith({
      data: {
        actorId: "admin_1",
        actorEmail: null,
        action: "USER_PASSWORD_CHANGE",
        entityType: "User",
        entityId: "user_2",
        metadata: Prisma.JsonNull,
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
