/**
 * File validation utility for receipt uploads
 */

import { MESSAGES } from "@/lib/constants/messages"

export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'pdf']
export const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate a file for receipt upload
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 */
export function validateReceiptFile(file: File | null): ValidationResult {
  if (!file) {
    return { valid: false, error: MESSAGES.UPLOAD.SELECT_FILE }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: MESSAGES.UPLOAD.FILE_TOO_LARGE }
  }

  // Check file extension
  const fileName = file.name.toLowerCase()
  const extension = fileName.split('.').pop()
  
  // HEIC/HEIF files are allowed (may be converted on server)
  if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
    return { valid: true }
  }

  // PDF files are allowed
  if (fileName.endsWith('.pdf')) {
    return { valid: true }
  }

  // Check regular image types
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: MESSAGES.UPLOAD.INVALID_IMAGE }
  }

  if (!file.type.startsWith('image/')) {
    return { valid: false, error: MESSAGES.UPLOAD.INVALID_IMAGE }
  }

  return { valid: true }
}

