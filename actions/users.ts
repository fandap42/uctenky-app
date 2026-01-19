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
