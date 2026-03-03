import { AiStatus, Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

function isWorkerAuthorized(request: NextRequest): boolean {
  const secret = process.env.AI_WORKER_SECRET
  const providedSecret = request.headers.get("x-ai-worker-secret")
  return Boolean(secret && providedSecret && providedSecret === secret)
}

export async function POST(request: NextRequest) {
  if (!isWorkerAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json() as {
    receiptId?: string
    aiData?: unknown
    aiStatus?: AiStatus
  }

  if (!body.receiptId) {
    return NextResponse.json({ error: "Missing receiptId" }, { status: 400 })
  }

  const nextStatus: AiStatus = body.aiStatus && ["PENDING", "COMPLETED", "FAILED"].includes(body.aiStatus)
    ? body.aiStatus
    : "COMPLETED"

  await prisma.receipt.update({
    where: { id: body.receiptId },
    data: {
      aiStatus: nextStatus,
      aiData: body.aiData === undefined ? undefined : body.aiData as Prisma.InputJsonValue,
    },
  })

  revalidatePath("/dashboard", "layout")
  return NextResponse.json({ success: true })
}
