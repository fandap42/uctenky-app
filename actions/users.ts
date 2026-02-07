"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { AppRole } from "@prisma/client"

export async function getUsers() {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const users = await prisma.user.findMany({
    orderBy: { fullName: "asc" },
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
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: data.role,
      },
    })

    revalidatePath("/dashboard/users")
    return { success: true, user: updatedUser }
  } catch (error) {
    console.error("Failed to update user:", error)
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

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })

    revalidatePath("/dashboard/users")
    return { success: true }
  } catch (error) {
    console.error("Failed to change password:", error)
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
    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath("/dashboard/users")
    return { success: true }
  } catch {
    return { error: "Nepodařilo se smazat uživatele" }
  }
}
