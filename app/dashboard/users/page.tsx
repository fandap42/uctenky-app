import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getUsers } from "@/actions/users"
import { UserManagement } from "@/components/users/user-management"

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const users = await getUsers()
  
  // Serialize dates for client component
  const serializedUsers = users.map(user => ({
    ...user,
    createdAt: user.createdAt.toISOString()
  })) as any

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground mb-2">Správa uživatelů</h1>
        <p className="text-muted-foreground font-medium">
          Správa rolí a přístupů všech členů týmu
        </p>
      </div>

      <UserManagement initialUsers={serializedUsers} />
    </div>
  )
}
