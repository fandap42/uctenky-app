"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"

export async function updateNotificationSettings(data: { receiveEmails: boolean; receiveAdminEmails: boolean }) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Nejste přihlášeni" }
  }

  try {
    // Only admins can update the admin toggle successfully. We force false if they're not admin.
    const isUserAdmin = session.user.role === "ADMIN"

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        receiveEmails: data.receiveEmails,
        receiveAdminEmails: isUserAdmin ? data.receiveAdminEmails : false,
      },
    })

    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error) {
    logger.error({ err: error, userId: session.user.id }, "Failed to update notification settings")
    return { error: "Nepodařilo se uložit nastavení" }
  }
}
