import nodemailer from "nodemailer"

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
    console.warn("SMTP credentials not fully configured. Simulating email sending.")
    console.log("------------------------------------------")
    console.log(`To: ${to}`)
    console.log(`From: ${EMAIL_FROM}`)
    console.log(`Subject: ${subject}`)
    console.log(`Body: ${html}`)
    console.log("------------------------------------------")
    return { success: true, message: "Email simulation successful" }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: parseInt(SMTP_PORT, 10) === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })

    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
    })

    console.log("Message sent: %s", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: "Nepodařilo se odeslat email" }
  }
}
