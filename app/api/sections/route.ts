import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const sections = await prisma.section.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    })
    return NextResponse.json(sections)
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch sections")
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 })
  }
}
