"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateTransactionReceipt } from "@/lib/actions/transactions"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"

interface ReceiptUploadProps {
  transactionId: string
  trigger?: React.ReactNode
}

export function ReceiptUpload({ transactionId, trigger }: ReceiptUploadProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedFile) {
      toast.error("Vyberte prosím soubor")
      return
    }

    setIsLoading(true)
    setUploadProgress(10)

    const formData = new FormData(e.currentTarget)
    const finalAmount = formData.get("finalAmount")
      ? parseFloat(formData.get("finalAmount") as string)
      : undefined

    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `${transactionId}-${Date.now()}.${fileExt}`

      setUploadProgress(30)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        toast.error("Nepodařilo se nahrát soubor")
        setIsLoading(false)
        return
      }

      setUploadProgress(70)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(uploadData.path)

      setUploadProgress(85)

      // Update transaction with receipt URL
      const result = await updateTransactionReceipt(
        transactionId,
        urlData.publicUrl,
        finalAmount
      )

      setUploadProgress(100)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Účtenka byla úspěšně nahrána")
        setOpen(false)
        setSelectedFile(null)
        setPreview(null)
        router.refresh()
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Nastala neočekávaná chyba")
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            variant="outline"
            className="border-green-500 text-green-500 hover:bg-green-500/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Nahrát účtenku
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            Nahrát účtenku
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Nahrajte fotografii nebo scan účtenky a zadejte skutečnou částku.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpload} className="space-y-6 mt-4">
          {/* File upload area */}
          <div
            className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {preview ? (
              <div className="space-y-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded-lg shadow-lg"
                />
                <p className="text-sm text-slate-400">
                  Klikněte pro změnu souboru
                </p>
              </div>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-slate-500 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-slate-300 mb-1">
                  Klikněte nebo přetáhněte soubor
                </p>
                <p className="text-sm text-slate-500">
                  PNG, JPG, JPEG do 5MB
                </p>
              </>
            )}
          </div>

          {/* Final amount input */}
          <div className="space-y-2">
            <Label htmlFor="finalAmount" className="text-slate-300">
              Skutečná částka (Kč)
            </Label>
            <Input
              id="finalAmount"
              name="finalAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="Zadejte skutečnou částku z účtenky"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>

          {/* Upload progress */}
          {isLoading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Nahrávání...</span>
                <span className="text-slate-400">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              disabled={isLoading}
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !selectedFile}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {isLoading ? "Nahrávám..." : "Nahrát účtenku"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
