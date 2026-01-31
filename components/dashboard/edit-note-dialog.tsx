"use client"

import { useState } from "react"
import { StickyNote } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { updateReceiptNote } from "@/lib/actions/receipts"
import { toast } from "sonner"

interface EditNoteDialogProps {
  receiptId: string
  initialNote: string | null | undefined
}

export function EditNoteDialog({ receiptId, initialNote }: EditNoteDialogProps) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState(initialNote || "")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSave() {
    setIsLoading(true)
    const result = await updateReceiptNote(receiptId, note)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Poznámka uložena")
      setOpen(false)
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
    }
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
          className="text-muted-foreground/60 hover:text-primary transition-colors cursor-help group"
        >
          <StickyNote className={`w-4 h-4 ${note ? "text-primary/70" : ""}`} />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upravit poznámku</DialogTitle>
          <DialogDescription>
            Zde můžete rychle upravit poznámku k této účtence.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="note">Poznámka</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Zde napište poznámku..."
              className="min-h-[100px]"
              autoComplete="off"
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
