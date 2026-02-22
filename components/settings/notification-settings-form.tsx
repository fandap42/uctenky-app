"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { updateNotificationSettings } from "@/lib/actions/settings"

interface NotificationSettingsFormProps {
  initialReceiveEmails: boolean
  initialReceiveAdminEmails: boolean
  isAdmin: boolean
}

export function NotificationSettingsForm({
  initialReceiveEmails,
  initialReceiveAdminEmails,
  isAdmin,
}: NotificationSettingsFormProps) {
  const [receiveEmails, setReceiveEmails] = useState(initialReceiveEmails)
  const [receiveAdminEmails, setReceiveAdminEmails] = useState(initialReceiveAdminEmails)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async (type: "general" | "admin", checked: boolean) => {
    setIsLoading(true)

    // Optimistically update UI
    if (type === "general") setReceiveEmails(checked)
    if (type === "admin") setReceiveAdminEmails(checked)

    const result = await updateNotificationSettings({
      receiveEmails: type === "general" ? checked : receiveEmails,
      receiveAdminEmails: type === "admin" ? checked : receiveAdminEmails,
    })

    if (result.error) {
      toast.error(result.error)
      // Revert UI
      if (type === "general") setReceiveEmails(!checked)
      if (type === "admin") setReceiveAdminEmails(!checked)
    } else {
      toast.success("Oznámení úspěšně uložena")
    }

    setIsLoading(false)
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <label htmlFor="general-notifications" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          E-mailové oznámení
          <p className="font-normal text-xs text-muted-foreground mt-1">Upozornění na změnu stavu mých žádostí.</p>
        </label>
        <Checkbox
          id="general-notifications"
          checked={receiveEmails}
          onCheckedChange={(checked) => handleToggle("general", checked === true)}
          disabled={isLoading}
        />
      </div>

      {isAdmin && (
        <div className="flex items-center justify-between mt-6">
          <label htmlFor="admin-notifications" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Administrátorská oznámení (nové žádosti)
            <p className="font-normal text-xs text-muted-foreground mt-1">Upozornění na nové žádosti ke schválení nebo k ověření.</p>
          </label>
          <Checkbox
            id="admin-notifications"
            checked={receiveAdminEmails}
            onCheckedChange={(checked) => handleToggle("admin", checked === true)}
            disabled={isLoading}
          />
        </div>
      )}
    </div>
  )
}
