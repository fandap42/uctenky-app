"use client"

import { useState } from "react"
import { AppRole, Section, User } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateUser } from "@/actions/users"
import { toast } from "sonner"

interface EditUserDialogProps {
  user: User & { section: Section | null }
  sections: Section[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const roleLabels: Record<string, string> = {
  MEMBER: "Člen",
  SECTION_HEAD: "Vedoucí sekce",
  ADMIN: "Administrátor",
}

export function EditUserDialog({
  user,
  sections,
  open,
  onOpenChange,
  onSuccess,
}: EditUserDialogProps) {
  const [role, setRole] = useState<AppRole>(user.role)
  const [sectionId, setSectionId] = useState<string>(user.sectionId || "none")
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const result = await updateUser(user.id, { role, sectionId })
      if (result.success) {
        toast.success("Uživatel byl úspěšně aktualizován")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error("Nastala chyba při aktualizaci uživatele")
      }
    } catch {
      toast.error("Nastala neočekávaná chyba")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Upravit uživatele {user.fullName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue placeholder="Vyberte roli" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {Object.entries(roleLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="section">Sekce</Label>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue placeholder="Vyberte sekci" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="none">Bez sekce</SelectItem>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Zrušit
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? "Ukládání..." : "Uložit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
