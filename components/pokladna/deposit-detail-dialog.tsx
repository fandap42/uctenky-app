"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteDeposit, updateDeposit } from "@/lib/actions/cash-register"

interface DepositForEdit {
  id: string
  amount: number
  date: string
  description?: string | null
}

interface DepositDetailDialogProps {
  deposit: DepositForEdit | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DepositDetailDialog({ deposit, open, onOpenChange }: DepositDetailDialogProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [amount, setAmount] = useState(() => (deposit ? String(Number(deposit.amount)) : ""))
  const [date, setDate] = useState(() =>
    deposit ? new Date(deposit.date).toISOString().split("T")[0] : ""
  )

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!deposit) return

    const parsedAmount = parseFloat(amount)
    const selectedDate = new Date(date)

    if (!Number.isFinite(parsedAmount)) {
      toast.error("Neplatná částka")
      return
    }

    if (Number.isNaN(selectedDate.getTime())) {
      toast.error("Neplatné datum")
      return
    }

    setIsSaving(true)
    const result = await updateDeposit(
      deposit.id,
      parsedAmount,
      selectedDate,
      deposit.description ?? "Vklad do pokladny"
    )

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Vklad byl upraven")
      onOpenChange(false)
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
      router.refresh()
    }

    setIsSaving(false)
  }

  async function handleDelete() {
    if (!deposit) return

    setIsDeleting(true)
    const result = await deleteDeposit(deposit.id)

    if (result.error) {
      toast.error(result.error)
      setIsDeleting(false)
      return
    }

    toast.success("Vklad byl smazán")
    onOpenChange(false)
    window.dispatchEvent(new CustomEvent("app-data-refresh"))
    router.refresh()
    setIsDeleting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] sm:max-w-[420px] rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg">Upravit vklad</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Můžete změnit částku nebo datum, případně vklad smazat.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="deposit-date" className="text-sm font-black uppercase tracking-widest text-muted-foreground">Datum *</Label>
            <Input
              id="deposit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="bg-background border-border rounded-xl font-bold h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deposit-amount" className="text-sm font-black uppercase tracking-widest text-muted-foreground">Částka (Kč) *</Label>
            <Input
              id="deposit-amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="bg-background border-border rounded-xl font-bold h-11 tabular-nums"
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" className="rounded-full" disabled={isDeleting || isSaving}>
                  {isDeleting ? "Mažu..." : "Smazat"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Opravdu smazat vklad?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tato akce je nevratná.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Zrušit</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Smazat
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-full font-bold border-border"
              >
                Zavřít
              </Button>
              <Button type="submit" disabled={isSaving || isDeleting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {isSaving ? "Ukládám..." : "Uložit"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
