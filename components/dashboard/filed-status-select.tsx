import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toggleTicketFiled } from "@/lib/actions/tickets"
import { toast } from "sonner"

interface FiledStatusSelectProps {
  transactionId: string
  initialStatus: boolean
  onStatusUpdate?: (id: string, isFiled: boolean) => Promise<{ success?: true; error?: string }>
}

export function FiledStatusSelect({
  transactionId,
  initialStatus,
  onStatusUpdate,
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
    
    const result = onStatusUpdate 
      ? await onStatusUpdate(transactionId, checked)
      : await toggleTicketFiled(transactionId, checked)

    if (result.error) {
      toast.error(result.error)
    } else {
      setIsFiled(checked)
      toast.success(checked ? "Označeno jako založeno" : "Označeno jako nezaloženo")
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
      <SelectTrigger className={`w-[130px] h-8 bg-background border-border text-xs ${isFiled ? "text-status-success" : "text-status-pending"}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" className="bg-card border-border max-h-[none]">
        <SelectItem value="unfiled" className="text-status-pending">Nezaloženo</SelectItem>
        <SelectItem value="filed" className="text-status-success">Založeno</SelectItem>
      </SelectContent>
    </Select>
  )
}
