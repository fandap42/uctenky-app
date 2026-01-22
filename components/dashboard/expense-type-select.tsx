import { useState, useEffect } from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateTransactionExpenseType } from "@/lib/actions/transactions"
import { toast } from "sonner"

interface ExpenseTypeSelectProps {
    transactionId: string
    initialType: string
}

export function ExpenseTypeSelect({
    transactionId,
    initialType,
}: ExpenseTypeSelectProps) {
    const [expenseType, setExpenseType] = useState(initialType)
    const [isLoading, setIsLoading] = useState(false)

    // Sync state with props when data is refreshed silently
    useEffect(() => {
        setExpenseType(initialType)
    }, [initialType])

    async function handleChange(value: string) {
        setIsLoading(true)
        const result = await updateTransactionExpenseType(transactionId, value as "MATERIAL" | "SERVICE")

        if (result.error) {
            toast.error(result.error)
        } else {
            setExpenseType(value)
            toast.success(value === "MATERIAL" ? "Označeno jako materiál" : "Označeno jako služba")
            window.dispatchEvent(new CustomEvent("app-data-refresh"))
        }
        setIsLoading(false)
    }

    return (
        <Select
            value={expenseType}
            onValueChange={handleChange}
            disabled={isLoading}
        >
            <SelectTrigger className={`w-[110px] h-8 bg-background border-border text-xs ${expenseType === "MATERIAL" ? "text-primary" : "text-[oklch(0.55_0.15_290)]"}`}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="bg-card border-border max-h-[none]">
                <SelectItem value="MATERIAL" className="text-primary">Materiál</SelectItem>
                <SelectItem value="SERVICE" className="text-[oklch(0.55_0.15_290)]">Služba</SelectItem>
            </SelectContent>
        </Select>
    )
}
