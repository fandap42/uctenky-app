import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { s3Client, BUCKET_NAME } from "@/lib/s3"
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3"
import { MESSAGES } from "@/lib/constants/messages"
import { logger } from "@/lib/logger"

async function getAuthorizedFileUrl(request: NextRequest): Promise<string | NextResponse> {
  const session = await auth()

  if (!session?.user?.id) {
    return new NextResponse(MESSAGES.AUTH.UNAUTHORIZED, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const receiptId = searchParams.get("id")

  if (!receiptId) {
    return new NextResponse(MESSAGES.TRANSACTION.MISSING_ID, { status: 400 })
  }

  // Fetch receipt and its ticket to verify ownership/admin
  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
    include: {
      ticket: {
        select: { requesterId: true }
      }
    }
  })

  if (!receipt) {
    return new NextResponse("Receipt not found", { status: 404 })
  }

  const { fileUrl, ticket } = receipt
  const requesterId = ticket.requesterId

  const isOwner = requesterId === session.user.id
  const isAdmin = session.user.role === "ADMIN"

  if (!isOwner && !isAdmin) {
    return new NextResponse(MESSAGES.AUTH.FORBIDDEN, { status: 403 })
  }

  return fileUrl
}

function handleStorageError(error: unknown): NextResponse {
  // Handle specific S3 errors
  const errorName =
    error instanceof Error
      ? error.name
      : typeof error === "object" && error && "name" in error
        ? String((error as { name: unknown }).name)
        : ""

  if (errorName === "AbortError" || errorName === "TimeoutError") {
    return new NextResponse(null, { status: 499 })
  }

  if (errorName === "NoSuchKey" || errorName === "NotFound") {
    return new NextResponse("Receipt file not found in storage", { status: 404 })
  }

  logger.error({ err: error }, "Receipt streaming error")
  return new NextResponse("Internal Server Error", { status: 500 })
}

export async function GET(request: NextRequest) {
  try {
    const fileUrl = await getAuthorizedFileUrl(request)
    if (fileUrl instanceof NextResponse) return fileUrl

    // Handle legacy full URLs by proxying them via fetch
    if (fileUrl.startsWith("http")) {
      const response = await fetch(fileUrl, { signal: request.signal })
      if (!response.ok) return new NextResponse("Source file not found", { status: 404 })

      return new NextResponse(response.body, {
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
          "Cache-Control": "private, max-age=3600",
        },
      })
    }

    // For new "keys", stream directly from S3/Minio
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileUrl,
    })

    const s3Response = await s3Client.send(command, { abortSignal: request.signal })

    if (!s3Response.Body) {
      return new NextResponse("Empty response from storage", { status: 500 })
    }

    // Stream the body to the client
    const body = s3Response.Body.transformToWebStream()
    return new NextResponse(body, {
      headers: {
        "Content-Type": s3Response.ContentType || "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (error: unknown) {
    return handleStorageError(error)
  }
}

export async function HEAD(request: NextRequest) {
  try {
    const fileUrl = await getAuthorizedFileUrl(request)
    if (fileUrl instanceof NextResponse) return fileUrl

    if (fileUrl.startsWith("http")) {
      const response = await fetch(fileUrl, { method: "HEAD", signal: request.signal })
      if (!response.ok) return new NextResponse(null, { status: 404 })

      return new NextResponse(null, {
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
          "Cache-Control": "private, max-age=3600",
        },
      })
    }

    const s3Response = await s3Client.send(new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileUrl,
    }), { abortSignal: request.signal })

    return new NextResponse(null, {
      headers: {
        "Content-Type": s3Response.ContentType || "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (error: unknown) {
    return handleStorageError(error)
  }
}
