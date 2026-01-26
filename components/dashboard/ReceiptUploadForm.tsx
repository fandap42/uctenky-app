"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { uploadReceipt } from "@/lib/actions/receipts"
import { validateReceiptFile, isHeicFile, convertHeicToJpeg } from "@/lib/utils/file-validator"
import { Upload, X, Loader2, Camera } from "lucide-react"
import { ExpenseType } from "@prisma/client"

interface ReceiptUploadFormProps {
  ticketId: string
  onSuccess?: () => void
}

export function ReceiptUploadForm({ ticketId, onSuccess }: ReceiptUploadFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [converting, setConverting] = useState(false)
  
  const [store, setStore] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [expenseType, setExpenseType] = useState<ExpenseType>("MATERIAL")

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const validation = validateReceiptFile(selectedFile)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    let processedFile = selectedFile
    if (isHeicFile(selectedFile)) {
      try {
        setConverting(true)
        toast.info("Převádím HEIC na JPEG...")
        processedFile = await convertHeicToJpeg(selectedFile)
      } catch (error) {
        toast.error("Chyba při převodu HEIC souboru")
        return
      } finally {
        setConverting(false)
      }
    }

    setFile(processedFile)
    setPreview(URL.createObjectURL(processedFile))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !store || !amount || !date) {
      toast.error("Prosím vyplňte všechna pole a vyberte soubor")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("ticketId", ticketId)
      formData.append("store", store)
      formData.append("amount", amount)
      formData.append("date", date)
      formData.append("expenseType", expenseType)

      const result = await uploadReceipt(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Účtenka byla úspěšně nahrána")
        setFile(null)
        setPreview(null)
        setStore("")
        setAmount("")
        onSuccess?.()
        router.refresh()
      }
    } catch (error: any) {
      toast.error(error.message || "Nastala chyba při nahrávání")
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-muted/50 p-6 rounded-[2rem] border border-border/50">
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-[1.5rem] p-4 transition-colors hover:border-primary/50 relative min-h-[120px]">
          {preview ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden group">
              <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                 <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-full">
                    Změnit
                 </Button>
                 <Button type="button" variant="destructive" size="sm" onClick={() => { setFile(null); setPreview(null); }} className="rounded-full">
                    Smazat
                 </Button>
              </div>
            </div>
          ) : (
            <div 
              className="flex flex-col items-center gap-2 cursor-pointer w-full py-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">Klikněte pro nahrání účtenky</p>
              <p className="text-[10px] text-muted-foreground">JPG, PNG, PDF nebo HEIC (max 10MB)</p>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,application/pdf,.heic" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase ml-1">Obchod</Label>
            <Input 
              value={store} 
              onChange={(e) => setStore(e.target.value)} 
              placeholder="Např. Albert, Alza..."
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase ml-1">Částka (Kč)</Label>
            <Input 
              type="number" 
              step="0.01"
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              placeholder="0.00"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase ml-1">Datum nákupu</Label>
            <Input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="rounded-xl"
            />
          </div>

        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full rounded-2xl h-12 font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
        disabled={uploading || converting}
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Nahrávám...
          </>
        ) : converting ? (
           <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Převádím HEIC...
          </>
        ) : (
          "Nahrát účtenku"
        )}
      </Button>
    </form>
  )
}
