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
import { createTransaction } from "@/lib/actions/transactions"
import { toast } from "sonner"

interface RequestFormProps {
  trigger?: React.ReactNode
}

export function RequestForm({ trigger }: RequestFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set("status", "PENDING") // Submit as pending for approval

    const result = await createTransaction(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Žádost byla úspěšně vytvořena")
      setOpen(false)
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            Nová žádost
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            Vytvořit novou žádost
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Vyplňte údaje o požadované náhradě. Po schválení budete moci nahrát
            účtenku.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="purpose" className="text-slate-300">
              Účel výdaje *
            </Label>
            <Input
              id="purpose"
              name="purpose"
              placeholder="Např. Nákup kancelářských potřeb"
              required
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimatedAmount" className="text-slate-300">
              Odhadovaná částka (Kč) *
            </Label>
            <Input
              id="estimatedAmount"
              name="estimatedAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              required
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-slate-300">
              Předpokládané datum nákupu
            </Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Odesílám...
                </>
              ) : (
                "Odeslat ke schválení"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
