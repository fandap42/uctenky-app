import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { s3Client, BUCKET_NAME } from "@/lib/s3"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { MESSAGES } from "@/lib/constants/messages"

export async function GET(request: NextRequest) {
  try {
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

    // Handle legacy full URLs by proxying them via fetch
    if (fileUrl.startsWith("http")) {
      const response = await fetch(fileUrl)
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

    const s3Response = await s3Client.send(command)

    if (!s3Response.Body) {
      return new NextResponse("Empty response from storage", { status: 500 })
    }

    // Stream the body to the client
    return new NextResponse(s3Response.Body as any, {
      headers: {
        "Content-Type": s3Response.ContentType || "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (error: any) {
    // Handle specific S3 errors
    if (error.name === "NoSuchKey") {
      return new NextResponse("Receipt file not found in storage", { status: 404 })
    }
    
    console.error("Receipt streaming error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
