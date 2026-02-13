import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { BankAccountForm } from "@/components/bank-account/bank-account-form"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-foreground mb-2">Nastavení</h1>
      </div>

      <div className="max-w-md">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Bankovní účet</h2>
            <p className="text-sm text-muted-foreground">
              Váš bankovní účet pro příjem náhrad za účtenky.
            </p>
          </div>
          <BankAccountForm loadExisting={true} />
        </div>
      </div>
    </div>
  )
}
