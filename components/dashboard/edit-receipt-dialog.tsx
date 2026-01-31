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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { updateReceiptDetails } from "@/lib/actions/receipts"
import { toast } from "sonner"
import { ExpenseType } from "@prisma/client"
import { Settings2 } from "lucide-react"

interface EditReceiptDialogProps {
  receipt: {
    id: string
    store: string
    amount: number
    date: string | Date
    expenseType: ExpenseType
    note?: string | null
  }
}

export function EditReceiptDialog({ receipt }: EditReceiptDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [store, setStore] = useState(receipt.store)
  const [amount, setAmount] = useState(String(receipt.amount))
  const [date, setDate] = useState(
    typeof receipt.date === 'string' 
      ? receipt.date.split('T')[0] 
      : receipt.date.toISOString().split('T')[0]
  )
  const [expenseType, setExpenseType] = useState<ExpenseType>(receipt.expenseType)
  const [note, setNote] = useState(receipt.note || "")

  async function handleSave() {
    setIsLoading(true)
    const result = await updateReceiptDetails(receipt.id, {
      store,
      amount: parseFloat(amount),
      date: new Date(date),
      expenseType,
      note,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Účtenka byla upravena")
      setOpen(false)
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
      router.refresh()
    }
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10">
          <Settings2 className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upravit účtenku</DialogTitle>
          <DialogDescription>
            Změňte údaje o této účtence. Jen pro administrátory.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-store">Obchod</Label>
            <Input
              id="edit-store"
              value={store}
              onChange={(e) => setStore(e.target.value)}
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-amount">Částka (Kč)</Label>
            <Input
              id="edit-amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-date">Datum nákupu</Label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-type">Typ výdaje</Label>
            <Select value={expenseType} onValueChange={(v) => setExpenseType(v as ExpenseType)}>
              <SelectTrigger id="edit-type" className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MATERIAL">Materiál</SelectItem>
                <SelectItem value="SERVICE">Služba</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-note">Poznámka</Label>
            <Textarea
              id="edit-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Zde napište poznámku..."
              className="bg-background border-border min-h-[80px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Ukládám..." : "Uložit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
