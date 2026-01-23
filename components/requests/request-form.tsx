"use client"

import { useState, useEffect } from "react"
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
import { createTransaction } from "@/lib/actions/transactions"
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
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set("status", "PENDING") // Submit as pending for approval
    formData.set("sectionId", selectedSection)

    const result = await createTransaction(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Žádost byla úspěšně vytvořena")
      setOpen(false)
      setSelectedSection("")
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Nová žádost
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-foreground text-xl">
            Vytvořit novou žádost
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Vyplňte údaje o požadované náhradě. Po schválení budete moci nahrát
            účtenku.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="section" className="text-foreground">
              Sekce *
            </Label>
            <Select value={selectedSection} onValueChange={setSelectedSection} required>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Vyberte sekci" />
              </SelectTrigger>
              <SelectContent position="popper" className="bg-card border-border max-h-[none]">
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Honeypot field - visually hidden, should not be filled by users */}
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
            <Label htmlFor="purpose" className="text-foreground">
              Účel výdaje *
            </Label>
            <Input
              id="purpose"
              name="purpose"
              placeholder="Např. Nákup kancelářských potřeb"
              required
              className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimatedAmount" className="text-foreground">
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
              className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary tabular-nums"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-border text-foreground hover:bg-muted"
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !selectedSection}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
