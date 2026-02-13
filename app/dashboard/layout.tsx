import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { OnboardingDialog } from "@/components/onboarding/onboarding-dialog"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <DashboardShell>
      {!session.user.hasCompletedOnboarding && <OnboardingDialog />}
      {children}
    </DashboardShell>
  )
}
