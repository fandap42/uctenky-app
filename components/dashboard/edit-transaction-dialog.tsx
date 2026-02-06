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
import { updateTicketDetails } from "@/lib/actions/tickets"
import { toast } from "sonner"
import { TicketStatus } from "@prisma/client"

interface EditTransactionDialogProps {
  transaction: {
    id: string
    purpose: string
    budgetAmount: any
    targetDate?: any
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
    const budgetAmount = parseFloat(formData.get("budgetAmount") as string)
    const targetDateStr = formData.get("targetDate") as string
    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date()
    const status = formData.get("status") as TicketStatus
    const note = formData.get("note") as string
    const honeypot = formData.get("middle_name_honey") as string

    const result = await updateTicketDetails(transaction.id, {
      purpose,
      budgetAmount,
      targetDate,
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
              <Label htmlFor="budgetAmount" className="text-foreground">Rozpočet (Kč) *</Label>
              <Input
                id="budgetAmount"
                name="budgetAmount"
                type="number"
                step="0.01"
                defaultValue={Number(transaction.budgetAmount || 0)}
                required
                className="bg-background border-border text-foreground tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDate" className="text-foreground">Cílové datum</Label>
              <Input
                id="targetDate"
                name="targetDate"
                type="date"
                defaultValue={transaction.targetDate ? new Date(transaction.targetDate).toISOString().split('T')[0] : ""}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="status" className="text-foreground">Stav</Label>
              <select
                id="status"
                name="status"
                defaultValue={transaction.status}
                className="w-full h-10 px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="PENDING_APPROVAL">Čeká na schválení</option>
                <option value="APPROVED">Schváleno (Nahrávání účtenek)</option>
                <option value="VERIFICATION">Čeká na kontrolu</option>
                <option value="DONE">Hotovo</option>
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
