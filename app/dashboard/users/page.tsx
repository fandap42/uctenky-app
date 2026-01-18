import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getUsers, getSections } from "@/actions/users"
import { UserManagement } from "@/components/users/user-management"

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const session = await auth()

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const [users, sections] = await Promise.all([
    getUsers(),
    getSections(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Správa uživatelů</h1>
        <p className="text-slate-400">
          Správa rolí a přiřazení do sekcí
        </p>
      </div>

      <UserManagement initialUsers={users} sections={sections} />
    </div>
  )
}
