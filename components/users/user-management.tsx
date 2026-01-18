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
  SECTION_HEAD: "Vedoucí sekce",
  ADMIN: "Administrátor",
}

const roleColors: Record<string, string> = {
  MEMBER: "bg-slate-500",
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

  const groupedUsers = sections.map(section => ({
    section,
    users: filteredUsers.filter(u => u.sectionId === section.id)
  })).concat({
    section: { id: "none", name: "Bez sekce" } as Section,
    users: filteredUsers.filter(u => !u.sectionId)
  }).filter(group => group.users.length > 0)

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

      <div className="space-y-8">
        {groupedUsers.map((group) => (
          <div key={group.section.id} className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
              {group.section.name}
              <Badge variant="outline" className="ml-2 text-slate-400 border-slate-700">
                {group.users.length}
              </Badge>
            </h2>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-400">Jméno</TableHead>
                      <TableHead className="text-slate-400">Email</TableHead>
                      <TableHead className="text-slate-400">Role</TableHead>
                      <TableHead className="text-slate-400 text-right">Akce</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.users.map((user) => (
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
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center text-slate-500">
              Žádní uživatelé nenalezeni
            </CardContent>
          </Card>
        )}
      </div>

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
