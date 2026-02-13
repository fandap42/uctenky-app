import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { uploadFile } from "@/lib/s3"
import { prisma } from "@/lib/prisma"
import { fileTypeFromBuffer } from "file-type"
import { MESSAGES } from "@/lib/constants/messages"
import { convertHeicBufferToJpeg } from "@/lib/utils/heic-conversion"

// Allowed file extensions and MIME types for receipts
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'pdf']
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf'
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
    const ticketId = formData.get("ticketId") as string

    // Verify ticket ownership
    if (!ticketId) {
      return NextResponse.json(
        { error: MESSAGES.TRANSACTION.MISSING_ID },
        { status: 400 }
      )
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { requesterId: true }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: "Žádost nebyla nalezena" },
        { status: 404 }
      )
    }

    const isOwner = ticket.requesterId === session.user.id
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

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: MESSAGES.UPLOAD.FILE_TOO_LARGE },
        { status: 400 }
      )
    }

    // Convert file to buffer early for magic byte validation
    const bytes = await file.arrayBuffer()
    const buffer: Buffer = Buffer.from(bytes)

    // Validate file content (magic bytes) to prevent MIME spoofing
    const fileType = await fileTypeFromBuffer(buffer)
    if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType.mime)) {
      return NextResponse.json(
        { error: MESSAGES.UPLOAD.INVALID_CONTENT },
        { status: 400 }
      )
    }

    let outputBuffer: Buffer = buffer
    let outputFileType = fileType

    const isHeic =
      fileType.mime === "image/heic" ||
      fileType.mime === "image/heif" ||
      fileType.ext === "heic" ||
      fileType.ext === "heif"

    if (isHeic) {
      try {
        outputBuffer = await convertHeicBufferToJpeg(buffer)
        outputFileType = { ext: "jpg", mime: "image/jpeg" }
      } catch (error) {
        console.error("HEIC conversion error:", error)
        return NextResponse.json(
          { error: MESSAGES.UPLOAD.HEIC_ERROR },
          { status: 400 }
        )
      }
    }

    // Generate unique filename with year/month folder structure
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const key = `receipts/${year}/${month}/${ticketId}-${Date.now()}.${outputFileType.ext}`

    // Upload to MinIO
    const url = await uploadFile(outputBuffer, key, outputFileType.mime)

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: MESSAGES.UPLOAD.MINIO_ERROR },
      { status: 500 }
    )
  }
}
