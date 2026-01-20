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

interface DebtErrorDialogProps {
  currentTotal: number
  onSuccess?: () => void
}

export function DebtErrorDialog({ currentTotal, onSuccess }: DebtErrorDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState("")
  const [isAdding, setIsAdding] = useState(true)
  const [reason, setReason] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const finalAmount = isAdding ? parseFloat(amount) : -parseFloat(amount)
    const result = await createDebtError(finalAmount, reason)

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
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Upravit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-white">Dluh z chyb</DialogTitle>
            <DialogDescription className="text-slate-400">
              Aktuální stav: {currentTotal.toLocaleString("cs-CZ")} Kč
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={isAdding ? "default" : "outline"}
                onClick={() => setIsAdding(true)}
                className={isAdding ? "bg-red-600 hover:bg-red-700" : "border-slate-600"}
              >
                + Přidat
              </Button>
              <Button
                type="button"
                variant={!isAdding ? "default" : "outline"}
                onClick={() => setIsAdding(false)}
                className={!isAdding ? "bg-green-600 hover:bg-green-700" : "border-slate-600"}
              >
                − Odečíst
              </Button>
            </div>
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
                placeholder="100"
                required
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason" className="text-slate-300">
                Důvod *
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Popište důvod změny..."
                required
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
              disabled={loading || !amount || !reason}
              className={isAdding ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {loading ? "Ukládám..." : isAdding ? "Přidat dluh" : "Odečíst dluh"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
