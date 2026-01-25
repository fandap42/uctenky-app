import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { uploadFile } from "@/lib/s3"
import { prisma } from "@/lib/prisma"
import { fileTypeFromBuffer } from "file-type"
import { MESSAGES } from "@/lib/constants/messages"

// Allowed file extensions and MIME types for receipts
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif']
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif'
]

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: MESSAGES.AUTH.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const transactionId = formData.get("transactionId") as string

    // Verify transaction ownership
    if (!transactionId) {
      return NextResponse.json(
        { error: MESSAGES.TRANSACTION.MISSING_ID },
        { status: 400 }
      )
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { requesterId: true }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: MESSAGES.TRANSACTION.TRANSACTION_NOT_FOUND },
        { status: 404 }
      )
    }

    const isOwner = transaction.requesterId === session.user.id
    const isAdmin = session.user.role === "ADMIN"
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: MESSAGES.AUTH.FORBIDDEN },
        { status: 403 }
      )
    }

    if (!file) {
      return NextResponse.json(
        { error: MESSAGES.UPLOAD.NO_FILE },
        { status: 400 }
      )
    }

    // Validate file extension
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: MESSAGES.UPLOAD.INVALID_EXTENSION },
        { status: 400 }
      )
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: MESSAGES.UPLOAD.FILE_TOO_LARGE },
        { status: 400 }
      )
    }

    // Convert file to buffer early for magic byte validation
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validate file content (magic bytes) to prevent MIME spoofing
    const fileType = await fileTypeFromBuffer(buffer)
    if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType.mime)) {
      return NextResponse.json(
        { error: MESSAGES.UPLOAD.INVALID_CONTENT },
        { status: 400 }
      )
    }

    // Generate unique filename with year/month folder structure
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const key = `receipts/${year}/${month}/${transactionId}-${Date.now()}.${fileType.ext}`

    // Upload to MinIO (now returns the key instead of a signed URL)
    const url = await uploadFile(buffer, key, fileType.mime)

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: MESSAGES.UPLOAD.MINIO_ERROR },
      { status: 500 }
    )
  }
}
