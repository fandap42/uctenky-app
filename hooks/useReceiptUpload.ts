"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { uploadReceipt } from "@/lib/actions/receipts"
import { validateReceiptFile, isHeicFile, convertHeicToJpeg } from "@/lib/utils/file-validator"
import { MESSAGES } from "@/lib/constants/messages"

export interface UseReceiptUploadOptions {
  ticketId: string
  onSuccess?: () => void
}

export interface ReceiptUploadState {
  file: File | null
  preview: string | null
  uploading: boolean
  converting: boolean
  progress: number
  amount: string
  store: string
  date: string
}

export function useReceiptUpload({ ticketId, onSuccess }: UseReceiptUploadOptions) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [state, setState] = useState<ReceiptUploadState>({
    file: null,
    preview: null,
    uploading: false,
    converting: false,
    progress: 0,
    amount: "",
    store: "",
    date: new Date().toISOString().split('T')[0],
  })

  const updateState = useCallback((updates: Partial<ReceiptUploadState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const resetState = useCallback(() => {
    if (state.preview) {
      URL.revokeObjectURL(state.preview)
    }
    setState({
      file: null,
      preview: null,
      uploading: false,
      converting: false,
      progress: 0,
      amount: "",
      store: "",
      date: new Date().toISOString().split('T')[0],
    })
  }, [state.preview])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file
    const validation = validateReceiptFile(selectedFile)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    let processedFile = selectedFile

    // Convert HEIC if needed
    if (isHeicFile(selectedFile)) {
      try {
        updateState({ converting: true })
        toast.info(MESSAGES.UPLOAD.HEIC_CONVERTING)
        
        processedFile = await convertHeicToJpeg(selectedFile)
        toast.success(MESSAGES.UPLOAD.HEIC_SUCCESS)
      } catch (error) {
        console.error("HEIC conversion error:", error)
        toast.error(MESSAGES.UPLOAD.HEIC_ERROR)
        updateState({ converting: false })
        return
      } finally {
        updateState({ converting: false })
      }
    }

    updateState({
      file: processedFile,
      preview: URL.createObjectURL(processedFile),
    })
  }, [updateState])

  const handleUpload = useCallback(async () => {
    if (!state.file) {
      toast.error(MESSAGES.UPLOAD.SELECT_FILE)
      return
    }

    updateState({ uploading: true, progress: 10 })

    try {
      const formData = new FormData()
      formData.append("file", state.file)
      formData.append("ticketId", ticketId)
      formData.append("store", state.store)
      formData.append("amount", state.amount)
      formData.append("date", state.date)

      updateState({ progress: 50 })

      const result = await uploadReceipt(formData)

      updateState({ progress: 100 })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(MESSAGES.UPLOAD.SUCCESS)
        onSuccess?.()
        router.refresh()
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(error instanceof Error ? error.message : MESSAGES.UPLOAD.UPLOAD_FAILED)
    } finally {
      resetState()
    }
  }, [state.file, state.amount, state.store, state.date, ticketId, updateState, resetState, onSuccess, router])

  return {
    state,
    fileInputRef,
    updateState,
    resetState,
    handleFileChange,
    handleUpload,
  }
}
