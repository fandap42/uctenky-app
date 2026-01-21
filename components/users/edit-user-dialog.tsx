"use client"

import { useState } from "react"
import { AppRole, User } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateUser, changeUserPassword } from "@/actions/users"
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
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const passwordsMatch = newPassword === confirmPassword
  const passwordValid = newPassword.length === 0 || newPassword.length >= 6

  const handleSave = async () => {
    if (newPassword && !passwordsMatch) {
      toast.error("Hesla se neshodují")
      return
    }

    setIsLoading(true)
    try {
      // Update role
      const result = await updateUser(user.id, { role })
      if (!result.success) {
        toast.error("Nastala chyba při aktualizaci role")
        setIsLoading(false)
        return
      }

      // Change password if provided
      if (newPassword.trim()) {
        const pwResult = await changeUserPassword(user.id, newPassword)
        if (!pwResult.success) {
          toast.error(pwResult.error || "Nepodařilo se změnit heslo")
          setIsLoading(false)
          return
        }
      }

      toast.success("Uživatel byl úspěšně aktualizován")
      setNewPassword("")
      setConfirmPassword("")
      onSuccess()
      onOpenChange(false)
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
          <DialogDescription className="text-slate-400">
            {user.email}
          </DialogDescription>
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

          <div className="grid gap-2">
            <Label htmlFor="password">Nové heslo (volitelné)</Label>
            <Input
              id="password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ponechte prázdné pro zachování stávajícího"
              className="bg-slate-800 border-slate-700"
            />
            {newPassword && newPassword.length < 6 && (
              <p className="text-xs text-red-400">
                Heslo musí mít alespoň 6 znaků
              </p>
            )}
          </div>

          {newPassword && (
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Potvrdit heslo</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Zadejte heslo znovu"
                className="bg-slate-800 border-slate-700"
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-400">
                  Hesla se neshodují
                </p>
              )}
            </div>
          )}
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
            disabled={isLoading || !passwordValid || (newPassword.length > 0 && !passwordsMatch)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? "Ukládání..." : "Uložit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
