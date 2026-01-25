import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  const router = useRouter()

  // Sync state with props when data is refreshed silently
  useEffect(() => {
    setIsFiled(initialStatus)
  }, [initialStatus])

  async function handleToggle(value: string) {
    const checked = value === "filed"
    setIsLoading(true)
    const result = await updateTransactionFiledStatus(transactionId, checked)

    if (result.error) {
      toast.error(result.error)
    } else {
      setIsFiled(checked)
      toast.success(checked ? "Označeno jako založeno" : "Ozznaceno jako nezaloženo")
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
      router.refresh()
    }
    setIsLoading(false)
  }

  return (
    <Select
      value={isFiled ? "filed" : "unfiled"}
      onValueChange={handleToggle}
      disabled={isLoading}
    >
      <SelectTrigger className={`w-[130px] h-8 bg-background border-border text-xs ${isFiled ? "text-[oklch(0.60_0.16_150)]" : "text-[oklch(0.75_0.15_85)]"}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" className="bg-card border-border max-h-[none]">
        <SelectItem value="unfiled" className="text-[oklch(0.75_0.15_85)]">Nezaloženo</SelectItem>
        <SelectItem value="filed" className="text-[oklch(0.60_0.16_150)]">Založeno</SelectItem>
      </SelectContent>
    </Select>
  )
}
