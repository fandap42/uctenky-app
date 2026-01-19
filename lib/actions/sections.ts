"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCurrentSemester } from "@/lib/utils/semesters"

export async function updateSectionBudget(sectionId: string, budgetCap: number) {
  const session = await auth()

  if (!session?.user?.id) {
    return { error: "Nepřihlášený uživatel" }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, sectionId: true },
    })

    const isAllowed =
      user?.role === "ADMIN" ||
      (user?.role === "SECTION_HEAD" && user.sectionId === sectionId)

    if (!isAllowed) {
      return { error: "Nemáte oprávnění k této akci" }
    }

    const currentSemester = getCurrentSemester()

    // Update or create budget for the current semester
    await prisma.budget.upsert({
      where: {
        sectionId_fiscalYear: {
          sectionId,
          fiscalYear: currentSemester,
        },
      },
      update: {
        totalAmount: budgetCap,
      },
      create: {
        sectionId,
        fiscalYear: currentSemester,
        totalAmount: budgetCap,
      },
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/head")
    revalidatePath("/dashboard/admin")
    return { success: true }
  } catch (error) {
    console.error("Update budget error:", error)
    return { error: "Nepodařilo se aktualizovat rozpočet" }
  }
}
