import nodemailer from "nodemailer"
import { logger } from "@/lib/logger"

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
    logger.warn({ subject, recipientCount: Array.isArray(to) ? to.length : 1 }, "SMTP credentials not fully configured. Simulating email sending.")
    logger.debug({ to, from: EMAIL_FROM, subject, html }, "Simulated email payload")
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
      html: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
  </head>
  <body>
    ${html}
  </body>
</html>`,
    })

    logger.info({ messageId: info.messageId, subject }, "Email sent successfully")
    return { success: true, messageId: info.messageId }
  } catch (error) {
    logger.error({ err: error, subject }, "Error sending email")
    return { success: false, error: "Nepodařilo se odeslat email" }
  }
}
