"use client"

import { useState } from "react"
import { AppRole, Section, User } from "@prisma/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { EditUserDialog } from "./edit-user-dialog"

interface UserManagementProps {
  initialUsers: (User & { section: Section | null })[]
  sections: Section[]
}

const roleLabels: Record<string, string> = {
  MEMBER: "Člen",
  SECTION_DEPUTY: "Zástupce vedoucího",
  SECTION_HEAD: "Vedoucí sekce",
  ADMIN: "Administrátor",
}

const roleColors: Record<string, string> = {
  MEMBER: "bg-slate-500",
  SECTION_DEPUTY: "bg-cyan-500",
  SECTION_HEAD: "bg-blue-500",
  ADMIN: "bg-purple-500",
}

export function UserManagement({
  initialUsers,
  sections,
}: UserManagementProps) {
  const [filter, setFilter] = useState("")
  const [editingUser, setEditingUser] = useState<(User & { section: Section | null }) | null>(null)

  const filteredUsers = initialUsers.filter((user) =>
    user.fullName?.toLowerCase().includes(filter.toLowerCase()) ||
    user.email.toLowerCase().includes(filter.toLowerCase())
  )

  const handleEdit = (user: User & { section: Section | null }) => {
    setEditingUser(user)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Hledat podle jména nebo emailu..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm bg-slate-800 border-slate-700 text-white"
        />
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-400">Jméno</TableHead>
                <TableHead className="text-slate-400">Email</TableHead>
                <TableHead className="text-slate-400">Role</TableHead>
                <TableHead className="text-slate-400">Sekce</TableHead>
                <TableHead className="text-slate-400 text-right">Akce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/50">
                  <TableCell className="font-medium text-white">
                    {user.fullName || "Neznámé"}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${roleColors[user.role] || "bg-slate-500"} text-white`}>
                      {roleLabels[user.role] || user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {user.section?.name || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(user)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                    >
                      Upravit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 h-24">
                    Žádní uživatelé nenalezeni
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          sections={sections}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onSuccess={() => {
            // Data will be revalidated by server action
          }}
        />
      )}
    </div>
  )
}
