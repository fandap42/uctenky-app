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
import { createDeposit } from "@/lib/actions/cash-register"
import { toast } from "sonner"

interface DepositDialogProps {
  onSuccess?: () => void
}

export function DepositDialog({ onSuccess }: DepositDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const result = await createDeposit(
      parseFloat(amount),
      description || null,
      new Date(date)
    )

    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Vklad byl přidán")
      setOpen(false)
      setAmount("")
      setDescription("")
      setDate(new Date().toISOString().split("T")[0])
      onSuccess?.()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Vložit vklad
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Nový vklad</DialogTitle>
            <DialogDescription className="text-slate-400">
              Vložte peníze do pokladny
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount" className="text-slate-300">
                Částka (Kč) *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                required
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date" className="text-slate-300">
                Datum
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-slate-300">
                Popis
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Volitelný popis vkladu..."
                className="bg-slate-900 border-slate-700 text-white resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-slate-400"
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              disabled={loading || !amount}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Ukládám..." : "Vložit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
