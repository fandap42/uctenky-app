"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { updateTransactionReceipt } from "@/lib/actions/transactions"
import { toast } from "sonner"

interface ReceiptUploadProps {
  transactionId: string
}

export function ReceiptUpload({ transactionId }: ReceiptUploadProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [finalAmount, setFinalAmount] = useState("")
  const [store, setStore] = useState("")
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith("image/")) {
        toast.error("Nahrajte prosím obrázek účtenky")
        return
      }
      // Validate file size (5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("Soubor je příliš velký. Maximum je 5 MB.")
        return
      }
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  async function handleUpload() {
    if (!file) {
      toast.error("Vyberte prosím soubor")
      return
    }

    setUploading(true)
    setProgress(10)

    try {
      // Upload file to API
      const formData = new FormData()
      formData.append("file", file)
      formData.append("transactionId", transactionId)

      setProgress(30)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload se nezdařil")
      }

      setProgress(70)

      const { url } = await response.json()

      // Update transaction with receipt URL
      const result = await updateTransactionReceipt(
        transactionId,
        url,
        finalAmount ? parseFloat(finalAmount) : undefined,
        store || undefined,
        purchaseDate ? new Date(purchaseDate) : undefined
      )

      setProgress(100)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Účtenka byla úspěšně nahrána")
        setOpen(false)
        router.refresh()
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(error instanceof Error ? error.message : "Nahrání se nezdařilo")
    } finally {
      setUploading(false)
      setProgress(0)
      setFile(null)
      setPreview(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
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
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Nahrát účtenku</DialogTitle>
          <DialogDescription className="text-slate-400">
            Nahrajte fotografii účtenky a zadejte skutečnou částku
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File input */}
          <div className="space-y-2">
            <Label htmlFor="receipt" className="text-slate-300">
              Účtenka (obrázek)
            </Label>
            <div
              className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <div className="space-y-2">
                  <img
                    src={preview}
                    alt="Náhled účtenky"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  <p className="text-sm text-slate-400">{file?.name}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 mx-auto text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-slate-400">Klikněte pro výběr obrázku</p>
                  <p className="text-xs text-slate-500">PNG, JPG do 5 MB</p>
                </div>
              )}
            </div>
            <Input
              ref={fileInputRef}
              id="receipt"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Store name */}
          <div className="space-y-2">
            <Label htmlFor="store" className="text-slate-300">
              Obchod
            </Label>
            <Input
              id="store"
              type="text"
              value={store}
              onChange={(e) => setStore(e.target.value)}
              placeholder="Např. Lidl, Alza..."
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          {/* Purchase date (real date from receipt) */}
          <div className="space-y-2">
            <Label htmlFor="purchaseDate" className="text-slate-300">
              Datum nákupu (z účtenky) *
            </Label>
            <Input
              id="purchaseDate"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          {/* Final amount */}
          <div className="space-y-2">
            <Label htmlFor="finalAmount" className="text-slate-300">
              Skutečná částka (Kč)
            </Label>
            <Input
              id="finalAmount"
              type="number"
              step="0.01"
              value={finalAmount}
              onChange={(e) => setFinalAmount(e.target.value)}
              placeholder="0.00"
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-slate-400">
                Nahrávání... {progress}%
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={uploading}
              className="text-slate-400 hover:text-white"
            >
              Zrušit
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {uploading ? "Nahrávám..." : "Nahrát"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
