"use client"

import { useState } from "react"
import { AppRole, User } from "@prisma/client"
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
import { roleLabels } from "@/lib/utils/roles"

interface EditUserDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

// All available roles for selection
const allRoles: AppRole[] = [
  "MEMBER",
  "HEAD_VEDENI",
  "HEAD_FINANCE",
  "HEAD_HR",
  "HEAD_PR",
  "HEAD_NEVZDELAVACI",
  "HEAD_VZDELAVACI",
  "HEAD_SPORTOVNI",
  "HEAD_GAMING",
  "HEAD_KRUHOVE",
  "ADMIN",
]

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: EditUserDialogProps) {
  const [role, setRole] = useState<AppRole>(user.role)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const result = await updateUser(user.id, { role })
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
                {allRoles.map((roleKey) => (
                  <SelectItem key={roleKey} value={roleKey}>
                    {roleLabels[roleKey] || roleKey}
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
