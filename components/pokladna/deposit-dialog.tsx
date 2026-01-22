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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createDeposit } from "@/lib/actions/cash-register"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

export function DepositDialog() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const type = formData.get("type") as "INCOME" | "EXPENSE"
    const amountVal = parseFloat(formData.get("amount") as string)
    const note = formData.get("note") as string
    const honeypot = formData.get("email_honey") as string

    // Postive for INCOME, negative for EXPENSE
    const amount = type === "INCOME" ? amountVal : -amountVal

    const result = await createDeposit(
      amount,
      note,
      new Date(),
      honeypot
    )

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Pohyb byl úspěšně zaznamenán")
      setOpen(false)
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-bold px-6 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" />
          Záznam pohybu
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[425px] rounded-[2.5rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-foreground">Nový pohyb v pokladně</DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            Zadejte příjem nebo výdej hotovosti z hlavní pokladny.
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
              <Label htmlFor="type" className="text-sm font-black uppercase tracking-widest text-muted-foreground">Typ pohybu</Label>
              <Select name="type" defaultValue="INCOME">
                <SelectTrigger className="bg-background border-border rounded-xl font-bold h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border rounded-xl">
                  <SelectItem value="INCOME" className="font-bold text-success font-black">Příjem (+)</SelectItem>
                  <SelectItem value="EXPENSE" className="font-bold text-destructive font-black">Výdej (-)</SelectItem>
                </SelectContent>
              </Select>
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

            <div className="space-y-2">
              <Label htmlFor="note" className="text-sm font-black uppercase tracking-widest text-muted-foreground">Poznámka / Účel *</Label>
              <Input
                id="note"
                name="note"
                placeholder="Např. Výběr z účtu, Nákup drobností..."
                required
                className="bg-background border-border rounded-xl font-bold h-12"
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
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-full px-8"
            >
              {isLoading ? "Ukládám..." : "Uložit pohyb"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
