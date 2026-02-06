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
  
  // HEIC/HEIF files are allowed (will be converted on client)
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

/**
 * Check if a file is HEIC/HEIF format
 */
export function isHeicFile(file: File): boolean {
  const fileName = file.name.toLowerCase()
  return fileName.endsWith('.heic') || fileName.endsWith('.heif')
}

/**
 * Convert HEIC file to JPEG
 * @param file - HEIC file to convert
 * @returns Converted JPEG file
 * @throws Error if conversion fails
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import('heic2any')).default
  
  const blob = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.95
  })

  // heic2any can return array or single blob
  const resultBlob = Array.isArray(blob) ? blob[0] : blob

  return new File(
    [resultBlob],
    file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
    { type: 'image/jpeg' }
  )
}
