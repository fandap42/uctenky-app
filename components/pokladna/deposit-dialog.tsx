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
import { createDeposit } from "@/lib/actions/cash-register"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function DepositDialog() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const amountVal = parseFloat(formData.get("amount") as string)
    const note = "Vklad do pokladny"
    const selectedDate = new Date(formData.get("date") as string)
    const honeypot = formData.get("email_honey") as string

    // It's always a deposit (INCOME) per user request
    const amount = amountVal

    const result = await createDeposit(
      amount,
      note,
      selectedDate,
      honeypot
    )

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Pohyb byl úspěšně zaznamenán")
      setOpen(false)
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 hover:scale-105 text-primary-foreground font-black uppercase tracking-tight h-11 px-6 rounded-2xl shadow-lg shadow-primary/20 transition-all duration-200">
          Nový vklad
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[425px] rounded-[2.5rem]">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl">Vložit vklad</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Zadejte údaje pro nový vklad do hlavní pokladny.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Honeypot field */}
          <div className="hidden" aria-hidden="true">
            <Label htmlFor="email_honey">Email</Label>
            <Input
              id="email_honey"
              name="email_honey"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-black uppercase tracking-widest text-muted-foreground">Datum vkladu *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="bg-background border-border rounded-xl font-bold h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-black uppercase tracking-widest text-muted-foreground">Částka (Kč) *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                className="bg-background border-border rounded-xl font-bold h-12 tabular-nums"
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
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? "Ukládám..." : "Vložit vklad"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
