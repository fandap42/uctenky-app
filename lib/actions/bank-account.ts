"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { encrypt, decrypt } from "@/lib/utils/encryption"
import { validateCzechAccountNumber } from "@/lib/utils/iban"
import { MESSAGES } from "@/lib/constants/messages"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit"

export async function saveBankAccount(data: {
  prefix?: string
  accountNumber: string
  bankCode: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: MESSAGES.AUTH.UNAUTHORIZED }
  }

  const validation = validateCzechAccountNumber(
    data.accountNumber,
    data.bankCode,
    data.prefix
  )
  if (!validation.valid) {
    return { error: validation.error }
  }

  try {
    const encryptedNumber = encrypt(data.accountNumber)
    const encryptedPrefix = data.prefix ? encrypt(data.prefix) : null

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        bankAccountNumber: encryptedNumber,
        bankAccountPrefix: encryptedPrefix,
        bankCode: data.bankCode,
        hasCompletedOnboarding: true,
      },
    })

    await logAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "BANK_ACCOUNT_UPDATE",
      entityType: "BankAccount",
      entityId: session.user.id,
      metadata: {
        bankCode: data.bankCode,
        hasPrefix: Boolean(data.prefix),
      },
    })

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id }, "Save bank account error")
    return { error: MESSAGES.BANK_ACCOUNT.SAVE_FAILED }
  }
}

export async function getBankAccount() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: MESSAGES.AUTH.UNAUTHORIZED }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        bankAccountNumber: true,
        bankAccountPrefix: true,
        bankCode: true,
      },
    })

    if (!user || !user.bankAccountNumber) {
      return { bankAccount: null }
    }

    return {
      bankAccount: {
        accountNumber: decrypt(user.bankAccountNumber),
        prefix: user.bankAccountPrefix ? decrypt(user.bankAccountPrefix) : null,
        bankCode: user.bankCode,
      },
    }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id }, "Get bank account error")
    return { error: MESSAGES.BANK_ACCOUNT.LOAD_FAILED }
  }
}

export async function completeOnboarding() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: MESSAGES.AUTH.UNAUTHORIZED }
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { hasCompletedOnboarding: true },
    })

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id }, "Complete onboarding error")
    return { error: MESSAGES.ONBOARDING.COMPLETE_FAILED }
  }
}

export async function getUserBankAccountForQR(userId: string) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return { error: MESSAGES.AUTH.ADMIN_ONLY }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        bankAccountNumber: true,
        bankAccountPrefix: true,
        bankCode: true,
      },
    })

    if (!user || !user.bankAccountNumber || !user.bankCode) {
      return { hasBankAccount: false, bankAccount: null }
    }

    return {
      hasBankAccount: true,
      bankAccount: {
        accountNumber: decrypt(user.bankAccountNumber),
        prefix: user.bankAccountPrefix ? decrypt(user.bankAccountPrefix) : null,
        bankCode: user.bankCode,
      },
    }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id, targetUserId: userId }, "Get user bank account for QR error")
    return { error: MESSAGES.BANK_ACCOUNT.LOAD_FAILED }
  }
}
