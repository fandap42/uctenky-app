import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { BankAccountForm } from "@/components/bank-account/bank-account-form"
import { NotificationSettingsForm } from "@/components/settings/notification-settings-form"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { receiveEmails: true, receiveAdminEmails: true, role: true } as any
  })

  // Fallback default true just in case
  const receiveEmails = (user as any)?.receiveEmails ?? true
  const receiveAdminEmails = (user as any)?.receiveAdminEmails ?? true
  const isAdmin = (user as any)?.role === "ADMIN"

  return (
    <div className="space-y-8">
      <div className="hidden md:block">
        <h1 className="text-3xl font-black text-foreground mb-2">Nastavení</h1>
      </div>

      <div className="max-w-md">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Bankovní účet</h2>
            <p className="text-sm text-muted-foreground">
              Váš bankovní účet pro příjem náhrad za účtenky.
            </p>
            <BankAccountForm loadExisting={true} />
          </div>

          <div className="pt-6 border-t">
            <div>
              <h2 className="text-lg font-bold text-foreground">Oznámení</h2>
              <p className="text-sm text-muted-foreground">
                Nastavení e-mailových notifikací.
              </p>
            </div>
            <NotificationSettingsForm
              initialReceiveEmails={receiveEmails}
              initialReceiveAdminEmails={receiveAdminEmails}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
