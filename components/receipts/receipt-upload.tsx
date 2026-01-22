
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
import { updateTransactionReceipt } from "@/lib/actions/transactions"
import { toast } from "sonner"
import { Upload, FileUp, Check, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReceiptUploadProps {
  transactionId: string
}

export function ReceiptUpload({ transactionId }: ReceiptUploadProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fileUrl, setFileUrl] = useState("")
  const [finalAmount, setFinalAmount] = useState("")
  const [store, setStore] = useState("")
  const [purchaseDate, setPurchaseDate] = useState("")
  const router = useRouter()

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("transactionId", transactionId)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        setFileUrl(data.url)
        toast.success("Soubor byl úspěšně nahrán")
      } else {
        toast.error(data.error || "Nahrávání se nezdařilo")
      }
    } catch {
      toast.error("Nastala chyba při nahrávání")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fileUrl || !finalAmount || !purchaseDate) return

    setIsLoading(true)
    const result = await updateTransactionReceipt(
      transactionId,
      fileUrl,
      parseFloat(finalAmount),
      store,
      new Date(purchaseDate)
    )

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("HOTOVO: Účtenka byla uložena")
      setOpen(false)
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
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
                  required={!fileUrl}
                />
                <Label
                  htmlFor="receipt-file"
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-2xl cursor-pointer transition-all",
                    fileUrl 
                      ? "border-success bg-success/5 text-success" 
                      : "border-border hover:border-primary hover:bg-primary/5 text-muted-foreground"
                  )}
                >
                  {fileUrl ? (
                    <>
                      <Check className="w-6 h-6 mb-1" />
                      <span className="text-xs font-bold">Nahráno</span>
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
                <Label htmlFor="purchaseDate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Datum nákupu *</Label>
                <div className="relative">
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
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
                  value={finalAmount}
                  onChange={(e) => setFinalAmount(e.target.value)}
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
              disabled={isLoading || !fileUrl || !finalAmount || !purchaseDate}
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
