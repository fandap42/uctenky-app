import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { MESSAGES } from "@/lib/constants/messages"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, address_honey } = body

    // Honeypot check
    if (address_honey) {
      console.warn("Registration honeypot filled, bot detected")
      return NextResponse.json(
        { error: MESSAGES.SECURITY.BOT_DETECTED },
        { status: 400 }
      )
    }

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: MESSAGES.TRANSACTION.MISSING_FIELDS },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Heslo musí mít alespoň 8 znaků" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Uživatel s tímto emailem již existuje" },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: "MEMBER",
      },
    })

    return NextResponse.json({
      message: "Účet byl úspěšně vytvořen",
      userId: user.id,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Nastala chyba při registraci" },
      { status: 500 }
    )
  }
}
