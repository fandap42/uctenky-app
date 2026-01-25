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
import { Textarea } from "@/components/ui/textarea"
import { updateTransactionDetails } from "@/lib/actions/transactions"
import { toast } from "sonner"
import { TransStatus } from "@prisma/client"

interface EditTransactionDialogProps {
  transaction: {
    id: string
    purpose: string
    store?: string | null
    estimatedAmount: any
    finalAmount?: any
    dueDate?: Date | null
    status: string
    note?: string | null
  }
}

export function EditTransactionDialog({ transaction }: EditTransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const purpose = formData.get("purpose") as string
    const store = formData.get("store") as string
    const estimatedAmount = parseFloat(formData.get("estimatedAmount") as string)
    const finalAmountStr = formData.get("finalAmount") as string
    const finalAmount = finalAmountStr ? parseFloat(finalAmountStr) : undefined
    const dueDateStr = formData.get("dueDate") as string
    const dueDate = dueDateStr ? new Date(dueDateStr) : null
    const status = formData.get("status") as TransStatus
    const note = formData.get("note") as string
    const honeypot = formData.get("middle_name_honey") as string

    const result = await updateTransactionDetails(transaction.id, {
      purpose,
      store,
      estimatedAmount,
      finalAmount,
      dueDate,
      status,
      note,
      middle_name_honey: honeypot,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("HOTOVO: Údaje byly upraveny")
      setOpen(false)
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Upravit žádost</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Změňte libovolné údaje o žádosti. Jen pro administrátory.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="purpose" className="text-foreground">Účel *</Label>
              <Input
                id="purpose"
                name="purpose"
                defaultValue={transaction.purpose}
                required
                className="bg-background border-border text-foreground"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="store" className="text-foreground">Obchod</Label>
              <Input
                id="store"
                name="store"
                defaultValue={transaction.store || ""}
                className="bg-background border-border text-foreground"
                autoComplete="off"
              />
            </div>
            {/* Honeypot field - visually hidden, should not be filled by users */}
            <div className="hidden" aria-hidden="true">
              <Label htmlFor="middle_name_honey">Middle Name</Label>
              <Input
                id="middle_name_honey"
                name="middle_name_honey"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedAmount" className="text-foreground">Odhad (Kč) *</Label>
              <Input
                id="estimatedAmount"
                name="estimatedAmount"
                type="number"
                step="0.01"
                defaultValue={Number(transaction.estimatedAmount)}
                required
                className="bg-background border-border text-foreground tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finalAmount" className="text-foreground">Konečná částka (Kč)</Label>
              <Input
                id="finalAmount"
                name="finalAmount"
                type="number"
                step="0.01"
                defaultValue={transaction.finalAmount ? Number(transaction.finalAmount) : ""}
                className="bg-background border-border text-foreground tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-foreground">Datum nákupu</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                defaultValue={transaction.dueDate ? new Date(transaction.dueDate).toISOString().split('T')[0] : ""}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-foreground">Stav</Label>
              <select
                id="status"
                name="status"
                defaultValue={transaction.status}
                className="w-full h-10 px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="DRAFT">Koncept</option>
                <option value="PENDING">Čeká na schválení</option>
                <option value="APPROVED">Schváleno</option>
                <option value="PURCHASED">Čeká na ověření</option>
                <option value="VERIFIED">Účtenka</option>
                <option value="REJECTED">Zamítnuto</option>
              </select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="note" className="text-foreground">Poznámka</Label>
              <Textarea
                id="note"
                name="note"
                defaultValue={transaction.note || ""}
                placeholder="Dobrovolná poznámka..."
                className="bg-background border-border text-foreground min-h-[80px]"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-border text-foreground hover:bg-muted"
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? "Ukládám..." : "Uložit změny"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
