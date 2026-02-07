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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { updateUser, changeUserPassword, deleteUser } from "@/actions/users"
import { toast } from "sonner"
import { UserCog, Trash2, KeyRound } from "lucide-react"
import { Input } from "@/components/ui/input"
import { AppRole } from "@prisma/client"

interface User {
  id: string
  fullName: string | null
  email: string | null
  role: string
}

interface EditUserDialogProps {
  user: User
}

export function EditUserDialog({ user }: EditUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [role, setRole] = useState(user.role)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const result = await updateUser(user.id, {
      role: role as AppRole,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("HOTOVO: Role uživatele byla upravena")
      setOpen(false)
      router.refresh()
    }

    setIsLoading(false)
  }

  async function handlePasswordChange() {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Heslo musí mít alespoň 6 znaků")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Hesla se neshodují")
      return
    }

    setIsLoading(true)
    const result = await changeUserPassword(user.id, newPassword)

    if (result.success) {
      toast.success("HOTOVO: Heslo bylo změněno")
      setNewPassword("")
      setConfirmPassword("")
    } else {
      toast.error(result.error || "Změna hesla se nezdařila")
    }
    setIsLoading(false)
  }

  async function handleDelete() {
    if (!confirm(`Opravdu chcete smazat uživatele ${user.fullName || user.email}?`)) return

    setIsDeleting(true)
    const result = await deleteUser(user.id)

    if (result.success) {
      toast.success("HOTOVO: Uživatel byl smazán")
      setOpen(false)
      router.refresh()
    } else {
      toast.error(result.error || "Smazání uživatele se nezdařilo")
    }
    setIsDeleting(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
          <UserCog className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[425px] rounded-[2rem] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-foreground">Správa uživatele</DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            {user.fullName || user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Role Section */}
          <div className="space-y-4">
            <Label htmlFor="role" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Uživatelská role</Label>
            <div className="flex gap-2">
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-background border-border rounded-xl font-bold h-12 flex-1">
                  <SelectValue placeholder="Vyberte roli" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border rounded-xl">
                  <SelectItem value="MEMBER" className="font-bold">Člen (MEMBER)</SelectItem>
                  <SelectItem value="ADMIN" className="font-bold">Administrátor (ADMIN)</SelectItem>
                  <hr className="my-1 border-border" />
                  <SelectItem value="HEAD_VEDENI" className="font-bold">Vedoucí: Vedení</SelectItem>
                  <SelectItem value="HEAD_FINANCE" className="font-bold">Vedoucí: Finance</SelectItem>
                  <SelectItem value="HEAD_HR" className="font-bold">Vedoucí: HR</SelectItem>
                  <SelectItem value="HEAD_PR" className="font-bold">Vedoucí: PR</SelectItem>
                  <SelectItem value="HEAD_NEVZDELAVACI" className="font-bold">Vedoucí: Nevzdělávací akce</SelectItem>
                  <SelectItem value="HEAD_VZDELAVACI" className="font-bold">Vedoucí: Vzdělávací akce</SelectItem>
                  <SelectItem value="HEAD_SPORTOVNI" className="font-bold">Vedoucí: Sportovní akce</SelectItem>
                  <SelectItem value="HEAD_GAMING" className="font-bold">Vedoucí: Gaming</SelectItem>
                  <SelectItem value="HEAD_KRUHOVE" className="font-bold">Vedoucí: Kruhové akce</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading || role === user.role}
                className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl px-4"
              >
                Uložit
              </Button>
            </div>
          </div>

          <hr className="border-border" />

          {/* Password Section */}
          <div className="space-y-4">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Změna hesla</Label>
            <div className="space-y-3">
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Nové heslo"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-background border-border rounded-xl font-bold h-12 pl-10"
                />
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Potvrzení hesla"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-background border-border rounded-xl font-bold h-12 pl-10"
                />
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Button 
                onClick={handlePasswordChange}
                disabled={isLoading || !newPassword || !confirmPassword}
                variant="outline"
                className="w-full h-12 border-border hover:bg-muted text-foreground font-black rounded-xl"
              >
                Změnit heslo
              </Button>
            </div>
          </div>

          <hr className="border-border" />

          {/* Danger Zone */}
          <div className="space-y-4">
            <Label className="text-xs font-black uppercase tracking-widest text-destructive">Nebezpečná zóna</Label>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              variant="destructive"
              className="w-full h-12 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 font-black rounded-xl flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Odstranit uživatele
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="rounded-full font-bold text-muted-foreground"
          >
            Zavřít
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
