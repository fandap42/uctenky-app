"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { AppRole } from "@prisma/client"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit"

export async function getUsers() {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const users = await prisma.user.findMany({
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
    },
  })

  return users
}

export async function getSections() {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const sections = await prisma.section.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })

  return sections
}

export async function updateUser(
  userId: string,
  data: { role: AppRole }
) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  try {
    const previousUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    })

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: data.role,
      },
      select: { id: true, fullName: true, email: true, role: true, image: true },
    })

    await logAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "USER_ROLE_CHANGE",
      entityType: "User",
      entityId: userId,
      metadata: {
        targetEmail: updatedUser.email,
        fromRole: previousUser?.role ?? null,
        toRole: data.role,
      },
    })

    revalidatePath("/dashboard/users")
    return { success: true, user: updatedUser }
  } catch (error) {
    logger.error({ err: error, actorId: session.user.id, targetUserId: userId }, "Failed to update user")
    return { success: false, error: "Failed to update user" }
  }
}

export async function changeUserPassword(
  userId: string,
  newPassword: string
) {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Neoprávněný přístup" }
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Heslo musí mít alespoň 6 znaků" }
  }

  try {
    // Hash the password
    const bcrypt = await import("bcryptjs")
    const passwordHash = await bcrypt.hash(newPassword, 10)

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: { email: true },
    })

    await logAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "USER_PASSWORD_CHANGE",
      entityType: "User",
      entityId: userId,
      metadata: {
        targetEmail: updatedUser.email,
      },
    })

    revalidatePath("/dashboard/users")
    return { success: true }
  } catch (error) {
    logger.error({ err: error, actorId: session.user.id, targetUserId: userId }, "Failed to change password")
    return { success: false, error: "Nepodařilo se změnit heslo" }
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
      return { error: "Nemůžete smazat sami sebe" }
    }

    // Hard delete - tickets will be unlinked (requesterId set to null)
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
    })

    await logAudit({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: "USER_DELETE",
      entityType: "User",
      entityId: userId,
      metadata: {
        deletedEmail: deletedUser.email,
        deletedFullName: deletedUser.fullName,
        deletedRole: deletedUser.role,
      },
    })

    revalidatePath("/dashboard/users")
    return { success: true }
  } catch (error) {
    logger.error({ err: error, actorId: session.user.id, targetUserId: userId }, "Delete user error")
    return { error: "Nepodařilo se smazat uživatele" }
  }
}
