"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { encrypt, decrypt } from "@/lib/utils/encryption"
import { validateCzechAccountNumber } from "@/lib/utils/iban"
import { MESSAGES } from "@/lib/constants/messages"

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

    revalidatePath("/dashboard", "layout")
    return { success: true }
  } catch (error) {
    console.error("Save bank account error:", error)
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
    console.error("Get bank account error:", error)
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
    console.error("Complete onboarding error:", error)
    return { error: "Nepodařilo se dokončit onboarding" }
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
    console.error("Get user bank account for QR error:", error)
    return { error: MESSAGES.BANK_ACCOUNT.LOAD_FAILED }
  }
}
