"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { BankAccountForm } from "@/components/bank-account/bank-account-form"
import { completeOnboarding } from "@/lib/actions/bank-account"

export function OnboardingDialog() {
  const { data: session, update } = useSession()
  const [open, setOpen] = useState(true)

  if (!session?.user || session.user.hasCompletedOnboarding) {
    return null
  }

  const handleComplete = async () => {
    try {
      await update({ trigger: "update" })
      setOpen(false)
    } catch (error) {
      console.error(
        "Failed to update session after onboarding completion",
        error
      )
      setOpen(true)
    }
  }

  const handleSkip = async () => {
    try {
      await completeOnboarding()
      await update({ trigger: "update" })
      setOpen(false)
    } catch (error) {
      console.error("Failed to skip onboarding", error)
      setOpen(true)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleSkip() }}>
      <DialogContent className="sm:max-w-[440px]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Vítejte v aplikaci!
          </DialogTitle>
          <DialogDescription>
            Pro rychlejší zpracování náhrad doporučujeme zadat Váš bankovní účet.
            Tento krok můžete přeskočit a vyplnit později v Nastavení.
          </DialogDescription>
        </DialogHeader>
        <BankAccountForm
          onSuccess={handleComplete}
          onSkip={handleSkip}
          showSkip={true}
        />
      </DialogContent>
    </Dialog>
  )
}
