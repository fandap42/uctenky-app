"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { createDebtError } from "@/lib/actions/cash-register"
import { toast } from "sonner"
import { AlertCircle, Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface DebtErrorDialogProps {
  currentTotal: number
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DebtErrorDialog({ currentTotal, onSuccess, open: propOpen, onOpenChange: propOnOpenChange }: DebtErrorDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = propOpen !== undefined ? propOpen : internalOpen
  const setOpen = propOnOpenChange !== undefined ? propOnOpenChange : setInternalOpen
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState("")
  const [isAdding, setIsAdding] = useState(true)
  const [reason, setReason] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const honeypot = formData.get("phone_honey") as string
    const finalAmount = isAdding ? parseFloat(amount) : -parseFloat(amount)
    const result = await createDebtError(finalAmount, reason, honeypot)

    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(isAdding ? "Dluh byl přidán" : "Dluh byl odečten")
      setOpen(false)
      setAmount("")
      setReason("")
      setIsAdding(true)
      onSuccess?.()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-card border-border max-w-md rounded-[2.5rem]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-foreground">Oprava chybného dluhu</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            {/* Honeypot field - visually hidden, should not be filled by users */}
            <div className="hidden" aria-hidden="true">
              <Label htmlFor="phone_honey">Phone</Label>
              <Input
                id="phone_honey"
                name="phone_honey"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <div className="flex gap-3 bg-muted/30 p-1 rounded-2xl border border-border">
              <Button
                type="button"
                className={`flex-1 rounded-xl h-10 font-black ${isAdding ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-transparent text-muted-foreground hover:text-foreground"}`}
                variant={isAdding ? "default" : "ghost"}
                onClick={() => setIsAdding(true)}
              >
                <Plus className="w-4 h-4 mr-1" /> Přidat dluh
              </Button>
              <Button
                type="button"
                className={`flex-1 rounded-xl h-10 font-black ${!isAdding ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-transparent text-muted-foreground hover:text-foreground"}`}
                variant={!isAdding ? "default" : "ghost"}
                onClick={() => setIsAdding(false)}
              >
                <Minus className="w-4 h-4 mr-1" /> Odečíst dluh
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                Částka (Kč) *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="bg-background border-border rounded-xl font-bold h-12 tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                Důvod / Poznámka *
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Uveďte důvod manuální opravy dluhu..."
                required
                className="bg-background border-border rounded-xl font-bold min-h-[100px] resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-full font-bold border-border"
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              disabled={loading || !amount || !reason}
              className="rounded-full px-8 font-black bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? "Ukládám..." : isAdding ? "Potvrdit dluh" : "Potvrdit odečet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
