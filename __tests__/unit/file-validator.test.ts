import { describe, it, expect } from 'vitest'
import { validateReceiptFile, isHeicFile, ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from '@/lib/utils/file-validator'

describe('File Validator', () => {
  describe('validateReceiptFile', () => {
    it('should return error for null file', () => {
      const result = validateReceiptFile(null)
      expect(result.valid).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should return error for oversized file', () => {
      const file = new File(['x'.repeat(MAX_FILE_SIZE + 1)], 'large.jpg', { type: 'image/jpeg' })
      const result = validateReceiptFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('20 MB')
    })

    it('should accept valid JPEG file', () => {
      const file = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' })
      const result = validateReceiptFile(file)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept valid PNG file', () => {
      const file = new File(['test'], 'receipt.png', { type: 'image/png' })
      const result = validateReceiptFile(file)
      expect(result.valid).toBe(true)
    })

    it('should accept HEIC file', () => {
      const file = new File(['test'], 'photo.heic', { type: 'image/heic' })
      const result = validateReceiptFile(file)
      expect(result.valid).toBe(true)
    })

    it('should accept HEIF file', () => {
      const file = new File(['test'], 'photo.HEIF', { type: 'image/heif' })
      const result = validateReceiptFile(file)
      expect(result.valid).toBe(true)
    })

    it('should accept PDF file', () => {
      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' })
      const result = validateReceiptFile(file)
      expect(result.valid).toBe(true)
    })

    it('should reject exe disguised as image', () => {
      const file = new File(['test'], 'virus.exe', { type: 'image/jpeg' })
      const result = validateReceiptFile(file)
      expect(result.valid).toBe(false)
    })
  })

  describe('isHeicFile', () => {
    it('should return true for .heic files', () => {
      const file = new File(['test'], 'photo.heic', { type: 'image/heic' })
      expect(isHeicFile(file)).toBe(true)
    })

    it('should return true for .HEIC files (uppercase)', () => {
      const file = new File(['test'], 'PHOTO.HEIC', { type: 'image/heic' })
      expect(isHeicFile(file)).toBe(true)
    })

    it('should return true for .heif files', () => {
      const file = new File(['test'], 'photo.heif', { type: 'image/heif' })
      expect(isHeicFile(file)).toBe(true)
    })

    it('should return false for jpeg files', () => {
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
      expect(isHeicFile(file)).toBe(false)
    })
  })

  describe('ALLOWED_EXTENSIONS', () => {
    it('should include common image formats', () => {
      expect(ALLOWED_EXTENSIONS).toContain('jpg')
      expect(ALLOWED_EXTENSIONS).toContain('jpeg')
      expect(ALLOWED_EXTENSIONS).toContain('png')
      expect(ALLOWED_EXTENSIONS).toContain('gif')
      expect(ALLOWED_EXTENSIONS).toContain('webp')
    })

    it('should include HEIC/HEIF formats', () => {
      expect(ALLOWED_EXTENSIONS).toContain('heic')
      expect(ALLOWED_EXTENSIONS).toContain('heif')
    })

    it('should include PDF format', () => {
      expect(ALLOWED_EXTENSIONS).toContain('pdf')
    })
  })
})
