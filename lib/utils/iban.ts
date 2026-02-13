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

/**
 * Modulo 11 checksum per Vyhláška č. 169/2011 Sb., příloha.
 *
 * Weights by position from right: 1, 2, 4, 8, 5, 10, 9, 7, 3, 6
 * The weighted sum must be divisible by 11.
 *
 * @param digits - numeric string (max 10 digits)
 * @returns true if the checksum is valid
 */
const MODULO_11_WEIGHTS = [1, 2, 4, 8, 5, 10, 9, 7, 3, 6] as const

export function checkModulo11(digits: string): boolean {
  const padded = digits.padStart(10, "0")
  let sum = 0
  for (let i = 0; i < 10; i++) {
    sum += Number(padded[9 - i]) * MODULO_11_WEIGHTS[i]
  }
  return sum % 11 === 0
}

export function validateCzechAccountNumber(
  accountNumber: string,
  bankCode: string,
  prefix?: string
): { valid: boolean; error?: string } {
  // Format checks
  if (prefix && !/^\d{1,6}$/.test(prefix)) {
    return { valid: false, error: "Předčíslí musí být 1-6 číslic" }
  }
  if (!/^\d{2,10}$/.test(accountNumber)) {
    return { valid: false, error: "Číslo účtu musí být 2-10 číslic" }
  }
  if (!/^\d{4}$/.test(bankCode)) {
    return { valid: false, error: "Kód banky musí být přesně 4 číslice" }
  }

  // Account number must have at least 2 non-zero digits
  const nonZeroCount = accountNumber.replace(/0/g, "").length
  if (nonZeroCount < 2) {
    return { valid: false, error: "Číslo účtu musí obsahovat alespoň 2 nenulové číslice" }
  }

  // Modulo 11 check on prefix (if provided)
  if (prefix && !checkModulo11(prefix)) {
    return { valid: false, error: "Zadejte existující číslo účtu" }
  }

  // Modulo 11 check on account number
  if (!checkModulo11(accountNumber)) {
    return { valid: false, error: "Zadejte existující číslo účtu" }
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
