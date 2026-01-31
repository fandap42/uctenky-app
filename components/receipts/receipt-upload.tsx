
"use client"

import { useState } from "react"
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
import { uploadReceipt } from "@/lib/actions/receipts"
import { toast } from "sonner"
import { Upload, FileUp, Check, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReceiptUploadProps {
  ticketId: string
}

export function ReceiptUpload({ ticketId }: ReceiptUploadProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [store, setStore] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const router = useRouter()

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !amount || !date) return

    setIsLoading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("ticketId", ticketId)
    formData.append("amount", amount)
    formData.append("store", store)
    formData.append("date", date)

    const result = await uploadReceipt(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("HOTOVO: Účtenka byla uložena")
      setOpen(false)
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
      router.refresh()
    }
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-8 px-4 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full gap-2">
          <Upload className="w-4 h-4" />
          Nahrát účtenku
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[425px] rounded-[2.5rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-foreground">Doplňte účtenku</DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            Nahrajte fotografii nebo PDF účtenky a zadejte konečnou částku a datum.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Soubor účtenky *</Label>
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="receipt-file"
                  required={!file}
                />
                <Label
                  htmlFor="receipt-file"
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-2xl cursor-pointer transition-all",
                    preview 
                      ? "border-success bg-success/5 text-success" 
                      : "border-border hover:border-primary hover:bg-primary/5 text-muted-foreground"
                  )}
                >
                  {preview ? (
                    <>
                      <Check className="w-6 h-6 mb-1" />
                      <span className="text-xs font-bold">Vybráno</span>
                    </>
                  ) : (
                    <>
                      <FileUp className="w-6 h-6 mb-1" />
                      <span className="text-xs font-bold">Klikněte pro výběr souboru</span>
                    </>
                  )}
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Datum nákupu *</Label>
                <div className="relative">
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="bg-background border-border rounded-xl font-bold h-10 pl-9 pr-2 text-xs"
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Částka (Kč) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="bg-background border-border rounded-xl font-bold h-10 tabular-nums text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="store" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Obchod / Prodejce</Label>
              <Input
                id="store"
                placeholder="Např. Alza.cz"
                value={store}
                onChange={(e) => setStore(e.target.value)}
                className="bg-background border-border rounded-xl font-bold h-10 text-xs"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-full font-bold border-border h-10 px-6 text-xs"
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !file || !amount || !date}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-full px-8 h-10 text-xs"
            >
              {isLoading ? "Ukládám..." : "Uložit účtenku"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
