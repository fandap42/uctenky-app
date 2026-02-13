import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toggleReceiptPaid } from "@/lib/actions/receipts"
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
  const router = useRouter()

  // Sync state with props when data is refreshed silently
  useEffect(() => {
    setIsPaid(initialStatus)
  }, [initialStatus])

  async function handleToggle(value: string) {
    const checked = value === "paid"
    setIsLoading(true)
    const result = await toggleReceiptPaid(transactionId, checked)

    if (result.error) {
      toast.error(result.error)
    } else {
      setIsPaid(checked)
      toast.success(checked ? "Označeno jako proplaceno" : "Označeno jako neproplaceno")
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
      router.refresh()
    }
    setIsLoading(false)
  }

  return (
    <Select
      value={isPaid ? "paid" : "unpaid"}
      onValueChange={handleToggle}
      disabled={isLoading}
    >
      <SelectTrigger className={`w-[140px] h-8 rounded-md bg-background border-border text-xs font-semibold ${isPaid ? "text-status-success" : "text-status-pending"} ${isLoading ? "opacity-70" : ""}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" className="bg-card border-border max-h-[none]">
        <SelectItem value="unpaid" className="text-status-pending">Neproplaceno</SelectItem>
        <SelectItem value="paid" className="text-status-success">Proplaceno</SelectItem>
      </SelectContent>
    </Select>
  )
}
