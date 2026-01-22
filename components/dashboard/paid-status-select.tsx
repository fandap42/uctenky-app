"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateTransactionPaidStatus } from "@/lib/actions/transactions"
import { toast } from "sonner"

interface PaidStatusSelectProps {
  transactionId: string
  initialStatus: boolean
}

export function PaidStatusSelect({
  transactionId,
  initialStatus,
}: PaidStatusSelectProps) {
  const [isPaid, setIsPaid] = useState(initialStatus)
  const [isLoading, setIsLoading] = useState(false)

  async function handleToggle(value: string) {
    const checked = value === "paid"
    setIsLoading(true)
    const result = await updateTransactionPaidStatus(transactionId, checked)

    if (result.error) {
      toast.error(result.error)
    } else {
      setIsPaid(checked)
      toast.success(checked ? "Označeno jako proplaceno" : "Označeno jako neproplaceno")
    }
    setIsLoading(false)
  }

  return (
    <Select
      value={isPaid ? "paid" : "unpaid"}
      onValueChange={handleToggle}
      disabled={isLoading}
    >
      <SelectTrigger className={`w-[140px] h-8 bg-background border-border text-xs ${isPaid ? "text-[oklch(0.60_0.16_150)]" : "text-[oklch(0.75_0.15_85)]"}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-card border-border">
        <SelectItem value="unpaid" className="text-[oklch(0.75_0.15_85)]">Neproplaceno</SelectItem>
        <SelectItem value="paid" className="text-[oklch(0.60_0.16_150)]">Proplaceno</SelectItem>
      </SelectContent>
    </Select>
  )
}
