"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, UserCog, UserPlus } from "lucide-react"
import { EditUserDialog } from "./edit-user-dialog"
import { cn } from "@/lib/utils"

interface User {
  id: string
  fullName: string | null
  email: string | null
  role: string
  createdAt: string
}

interface UserManagementProps {
  initialUsers: User[]
}

const roleLabels: Record<string, string> = {
  MEMBER: "Člen",
  ADMIN: "Administrátor",
  HEAD_VEDENI: "Vedoucí: Vedení",
  HEAD_FINANCE: "Vedoucí: Finance",
  HEAD_HR: "Vedoucí: HR",
  HEAD_PR: "Vedoucí: PR",
  HEAD_NEVZDELAVACI: "Vedoucí: Nevzdělávací akce",
  HEAD_VZDELAVACI: "Vedoucí: Vzdělávací akce",
  HEAD_SPORTOVNI: "Vedoucí: Sportovní akce",
  HEAD_GAMING: "Vedoucí: Gaming",
  HEAD_KRUHOVE: "Vedoucí: Kruhové akce",
}

const roleColors: Record<string, string> = {
  MEMBER: "bg-muted text-foreground",
  ADMIN: "bg-primary text-primary-foreground",
  HEAD_VEDENI: "bg-secondary text-secondary-foreground",
  HEAD_FINANCE: "bg-secondary text-secondary-foreground",
  HEAD_HR: "bg-secondary text-secondary-foreground",
  HEAD_PR: "bg-secondary text-secondary-foreground",
  HEAD_NEVZDELAVACI: "bg-secondary text-secondary-foreground",
  HEAD_VZDELAVACI: "bg-secondary text-secondary-foreground",
  HEAD_SPORTOVNI: "bg-secondary text-secondary-foreground",
  HEAD_GAMING: "bg-secondary text-secondary-foreground",
  HEAD_KRUHOVE: "bg-secondary text-secondary-foreground",
}

export function UserManagement({ initialUsers }: UserManagementProps) {
  const [search, setSearch] = useState("")

  const filteredUsers = initialUsers.filter(
    (user) =>
      user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">


      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hledat uživatele..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border rounded-full focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="bg-card border-border shadow-sm overflow-hidden rounded-[2.5rem]">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/80 border-b border-border">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="table-header-cell">Jméno</TableHead>
                  <TableHead className="table-header-cell">Email</TableHead>
                  <TableHead className="table-header-cell">Role</TableHead>
                  <TableHead className="table-header-cell text-right">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-border hover:bg-muted/10 transition-colors">
                    <TableCell className="py-3 px-4 font-semibold text-foreground">
                      {user.fullName || "---"}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="py-3 px-4">
                      <Badge className={cn("text-[10px] px-2 py-0.5 h-auto uppercase tracking-wider font-bold", roleColors[user.role] || "bg-muted")}>
                        {roleLabels[user.role] || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <EditUserDialog user={user} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
