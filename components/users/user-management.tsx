"use client"

import { useState } from "react"
import { AppRole, User } from "@prisma/client"
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
import { DeleteButton } from "@/components/dashboard/delete-button"
import { deleteUser } from "@/lib/actions/transactions"
import { roleLabels, isHeadRole, isAdmin } from "@/lib/utils/roles"

interface UserManagementProps {
  initialUsers: User[]
}

function getRoleColor(role: string): string {
  if (isAdmin(role)) return "bg-purple-500"
  if (isHeadRole(role)) return "bg-blue-500"
  return "bg-slate-500"
}

export function UserManagement({
  initialUsers,
}: UserManagementProps) {
  const [filter, setFilter] = useState("")
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const filteredUsers = initialUsers.filter((user) =>
    user.fullName?.toLowerCase().includes(filter.toLowerCase()) ||
    user.email.toLowerCase().includes(filter.toLowerCase())
  )

  const handleEdit = (user: User) => {
    setEditingUser(user)
  }

  // Group users by role type
  const adminUsers = filteredUsers.filter(u => isAdmin(u.role))
  const headUsers = filteredUsers.filter(u => isHeadRole(u.role))
  const memberUsers = filteredUsers.filter(u => u.role === "MEMBER")

  const groups = [
    { name: "Administrátoři", users: adminUsers, color: "bg-purple-500" },
    { name: "Vedoucí sekcí", users: headUsers, color: "bg-blue-500" },
    { name: "Členové", users: memberUsers, color: "bg-slate-500" },
  ].filter(g => g.users.length > 0)

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
        {groups.map((group) => (
          <div key={group.name} className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className={`w-2 h-6 ${group.color} rounded-full`}></span>
              {group.name}
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
                          <Badge className={`${getRoleColor(user.role)} text-white`}>
                            {roleLabels[user.role] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                            >
                              Upravit
                            </Button>
                            <DeleteButton 
                              onDelete={() => deleteUser(user.id)} 
                              title="Smazat uživatele?" 
                              description={`Opravdu chcete smazat uživatele ${user.fullName || user.email}? Akce je nevratná.`}
                            />
                          </div>
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
