"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateTransactionFiledStatus } from "@/lib/actions/transactions"
import { toast } from "sonner"

interface FiledStatusSelectProps {
  transactionId: string
  initialStatus: boolean
}

export function FiledStatusSelect({
  transactionId,
  initialStatus,
}: FiledStatusSelectProps) {
  const [isFiled, setIsFiled] = useState(initialStatus)
  const [isLoading, setIsLoading] = useState(false)

  async function handleToggle(value: string) {
    const checked = value === "filed"
    setIsLoading(true)
    const result = await updateTransactionFiledStatus(transactionId, checked)

    if (result.error) {
      toast.error(result.error)
    } else {
      setIsFiled(checked)
      toast.success(checked ? "Označeno jako založeno" : "Označeno jako nezaloženo")
    }
    setIsLoading(false)
  }

  return (
    <Select
      value={isFiled ? "filed" : "unfiled"}
      onValueChange={handleToggle}
      disabled={isLoading}
    >
      <SelectTrigger className={`w-[130px] h-8 bg-slate-900 border-slate-700 text-xs ${isFiled ? "text-green-400" : "text-orange-400"}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-slate-800 border-slate-700 text-white">
        <SelectItem value="unfiled" className="text-orange-400">Nezaloženo</SelectItem>
        <SelectItem value="filed" className="text-green-400">Založeno</SelectItem>
      </SelectContent>
    </Select>
  )
}
