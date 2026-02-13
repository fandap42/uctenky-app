/**
 * Compute a Czech IBAN from domestic bank account components.
 *
 * Czech IBAN format: CZ + 2 check digits + 4-digit bank code + 6-digit prefix (zero-padded) + 10-digit account number (zero-padded)
 * Total: 24 characters
 *
 * Check digit algorithm (ISO 7064 mod 97-10):
 * 1. Construct numeric string = bankCode + prefix(6) + accountNumber(10) + "123500" (CZ => C=12, Z=35, + "00")
 * 2. Compute remainder = BigInt(numericString) % 97n
 * 3. Check digits = 98 - remainder, zero-padded to 2 digits
 */
export function computeCzechIBAN(
  bankCode: string,
  accountNumber: string,
  prefix?: string
): string {
  const paddedBankCode = bankCode.padStart(4, "0")
  const paddedPrefix = (prefix || "0").padStart(6, "0")
  const paddedAccount = accountNumber.padStart(10, "0")

  const numericString = `${paddedBankCode}${paddedPrefix}${paddedAccount}123500`
  const remainder = BigInt(numericString) % BigInt(97)
  const checkDigits = (BigInt(98) - remainder).toString().padStart(2, "0")

  return `CZ${checkDigits}${paddedBankCode}${paddedPrefix}${paddedAccount}`
}

export function validateCzechAccountNumber(
  accountNumber: string,
  bankCode: string,
  prefix?: string
): { valid: boolean; error?: string } {
  if (prefix && !/^\d{1,6}$/.test(prefix)) {
    return { valid: false, error: "Předčíslí musí být 1-6 číslic" }
  }
  if (!/^\d{1,10}$/.test(accountNumber)) {
    return { valid: false, error: "Číslo účtu musí být 1-10 číslic" }
  }
  if (!/^\d{4}$/.test(bankCode)) {
    return { valid: false, error: "Kód banky musí být přesně 4 číslice" }
  }
  return { valid: true }
}

export function formatCzechAccountNumber(
  accountNumber: string,
  bankCode: string,
  prefix?: string
): string {
  const prefixPart = prefix ? `${prefix}-` : ""
  return `${prefixPart}${accountNumber}/${bankCode}`
}
