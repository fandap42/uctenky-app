import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { uploadFile } from "@/lib/s3"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nepřihlášený uživatel" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const transactionId = formData.get("transactionId") as string

    if (!file) {
      return NextResponse.json(
        { error: "Nebyl nahrán žádný soubor" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Nahrajte prosím obrázek" },
        { status: 400 }
      )
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Soubor je příliš velký. Maximum je 5 MB." },
        { status: 400 }
      )
    }

    // Generate unique filename
    const extension = file.name.split(".").pop()
    const key = `receipts/${transactionId}-${Date.now()}.${extension}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to MinIO
    const url = await uploadFile(buffer, key, file.type)

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Nahrání se nezdařilo. Zkontrolujte, zda je MinIO spuštěno." },
      { status: 500 }
    )
  }
}
