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
      <SelectTrigger className={`w-[140px] h-8 bg-slate-900 border-slate-700 text-xs ${isPaid ? "text-green-400" : "text-yellow-400"}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-slate-800 border-slate-700 text-white">
        <SelectItem value="unpaid" className="text-yellow-400">Neproplaceno</SelectItem>
        <SelectItem value="paid" className="text-green-400">Proplaceno</SelectItem>
      </SelectContent>
    </Select>
  )
}
