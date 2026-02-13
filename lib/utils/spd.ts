import { computeCzechIBAN } from "./iban"

interface SPDParams {
  bankCode: string
  accountNumber: string
  prefix?: string
  amount: number
  message?: string
}

/**
 * Generate an SPD (Short Payment Descriptor) string for Czech QR payments.
 * Format: SPD*1.0*ACC:IBAN*AM:amount*CC:CZK*MSG:message*
 *
 * See: https://qr-platba.cz/pro-vyvojare/specifikace-formatu/
 */
export function generateSPDString(params: SPDParams): string {
  const iban = computeCzechIBAN(params.bankCode, params.accountNumber, params.prefix)

  const formattedAmount = params.amount.toFixed(2).replace(/\.?0+$/, "")

  const message = params.message
    ? params.message.slice(0, 60).replace(/\*/g, "")
    : undefined

  let spd = `SPD*1.0*ACC:${iban}*AM:${formattedAmount}*CC:CZK`
  if (message) {
    spd += `*MSG:${message}`
  }

  return spd
}
