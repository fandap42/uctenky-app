"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateSectionBudget } from "@/lib/actions/sections"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface EditBudgetDialogProps {
  sectionId: string
  sectionName: string
  currentBudget: number
  trigger?: React.ReactNode
}

export function EditBudgetDialog({
  sectionId,
  sectionName,
  currentBudget,
  trigger,
}: EditBudgetDialogProps) {
  const [budget, setBudget] = useState(currentBudget.toString())
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const result = await updateSectionBudget(sectionId, parseFloat(budget))
      if (result.success) {
        toast.success("Rozpočet byl úspěšně aktualizován")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Chyba při aktualizaci rozpočtu")
      }
    } catch {
      toast.error("Nastala neočekávaná chyba")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-blue-400 border-blue-400/30 hover:bg-blue-400/10">
            Upravit rozpočet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Upravit rozpočet: {sectionName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="budget">Maximální rozpočet (Kč)</Label>
            <Input
              id="budget"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isLoading}
            className="text-slate-400 hover:text-white"
          >
            Zrušit
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Ukládání..." : "Uložit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
