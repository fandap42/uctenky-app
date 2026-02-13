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
import { createTicket } from "@/lib/actions/tickets"
import { MESSAGES } from "@/lib/constants/messages"
import { toast } from "sonner"

interface Section {
  id: string
  name: string
}

interface RequestFormProps {
  trigger?: React.ReactNode
  sections: Section[]
}

export function RequestForm({ trigger, sections }: RequestFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSection, setSelectedSection] = useState("")
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split("T")[0])
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (!selectedSection) {
      toast.error(MESSAGES.TRANSACTION.MISSING_SECTION)
      return
    }

    const budgetAmount = Number.parseFloat(String(formData.get("budgetAmount") ?? ""))
    if (Number.isNaN(budgetAmount) || budgetAmount <= 0) {
      toast.error("Rozpočet musí být kladné číslo")
      return
    }

    setIsLoading(true)
    formData.set("sectionId", selectedSection)

    const result = await createTicket(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Žádost byla úspěšně vytvořena")
      setOpen(false)
      setSelectedSection("")
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary/90 hover:scale-105 text-primary-foreground font-black uppercase tracking-tight h-11 px-6 rounded-2xl shadow-lg shadow-primary/20 transition-all duration-200">
            Nová žádost
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-none sm:max-w-[500px] rounded-[2.5rem] p-8 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground text-2xl font-black tracking-tight">
            Nová žádost o nákup
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            Vyplňte údaje o plánovaném nákupu. Po schválení Adminem budete moci nahrát účtenky.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="section" className="text-xs font-bold uppercase tracking-wider ml-1 text-muted-foreground">
              Sekce / Projekt *
            </Label>
            <Select value={selectedSection} onValueChange={setSelectedSection} required>
              <SelectTrigger className="bg-muted/50 border-none h-12 rounded-xl text-foreground font-bold">
                <SelectValue placeholder="Vyberte sekci" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border rounded-xl">
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id} className="font-medium">
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="hidden" aria-hidden="true">
            <Label htmlFor="full_name_honey">Full Name</Label>
            <Input
              id="full_name_honey"
              name="full_name_honey"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose" className="text-xs font-bold uppercase tracking-wider ml-1 text-muted-foreground">
              Účel nákupu *
            </Label>
            <Input
              id="purpose"
              name="purpose"
              placeholder="Např. Materiál na workshop"
              required
              className="bg-muted/50 border-none h-12 rounded-xl text-foreground font-bold placeholder:font-medium placeholder:text-muted-foreground/50"
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budgetAmount" className="text-xs font-bold uppercase tracking-wider ml-1 text-muted-foreground">
                Rozpočet (Kč) *
              </Label>
              <Input
                id="budgetAmount"
                name="budgetAmount"
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                placeholder="0"
                required
                className="bg-muted/50 border-none h-12 rounded-xl text-foreground font-black tabular-nums"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDate" className="text-xs font-bold uppercase tracking-wider ml-1 text-muted-foreground">
                Datum nákupu *
              </Label>
              <Input
                id="targetDate"
                name="targetDate"
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="bg-muted/50 border-none h-12 rounded-xl text-foreground font-bold"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="font-bold rounded-xl"
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !selectedSection}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest px-8 rounded-xl h-11 shadow-lg shadow-primary/20"
            >
              {isLoading ? "Odesílám..." : "Odeslat ke schválení"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
