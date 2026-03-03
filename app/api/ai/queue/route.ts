import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getDownloadPresignedUrl } from "@/lib/s3"

function isWorkerAuthorized(request: NextRequest): boolean {
  const secret = process.env.AI_WORKER_SECRET
  const providedSecret = request.headers.get("x-ai-worker-secret")
  return Boolean(secret && providedSecret && providedSecret === secret)
}

export async function GET(request: NextRequest) {
  if (!isWorkerAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const receipts = await prisma.receipt.findMany({
    where: { aiStatus: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: {
      id: true,
      fileUrl: true,
      createdAt: true,
      ticketId: true,
    },
  })

  const queue = await Promise.all(
    receipts.map(async (receipt) => ({
      id: receipt.id,
      ticketId: receipt.ticketId,
      createdAt: receipt.createdAt.toISOString(),
      imageUrl: receipt.fileUrl.startsWith("http")
        ? receipt.fileUrl
        : await getDownloadPresignedUrl(receipt.fileUrl, 600),
    }))
  )

  return NextResponse.json({ receipts: queue })
}
