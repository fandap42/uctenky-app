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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Správa uživatelů</h1>
        <p className="text-slate-400">
          Správa rolí uživatelů
        </p>
      </div>

      <UserManagement initialUsers={users} />
    </div>
  )
}
