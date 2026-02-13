import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateReceiptExpenseType } from "@/lib/actions/receipts"
import { ExpenseType } from "@prisma/client"
import { toast } from "sonner"

interface ExpenseTypeSelectProps {
    transactionId: string
    initialType: ExpenseType
}

export function ExpenseTypeSelect({
    transactionId,
    initialType,
}: ExpenseTypeSelectProps) {
    const [expenseType, setExpenseType] = useState<ExpenseType>(initialType)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    // Sync state with props when data is refreshed silently
    useEffect(() => {
        setExpenseType(initialType)
    }, [initialType])

    async function handleChange(value: string) {
        if (value !== "MATERIAL" && value !== "SERVICE") return
        setIsLoading(true)
        const result = await updateReceiptExpenseType(transactionId, value)

        if (result.error) {
            toast.error(result.error)
        } else {
            setExpenseType(value)
            toast.success(value === "MATERIAL" ? "Označeno jako materiál" : "Označeno jako služba")
            window.dispatchEvent(new CustomEvent("app-data-refresh"))
            router.refresh()
        }
        setIsLoading(false)
    }

    return (
        <Select
            value={expenseType}
            onValueChange={handleChange}
            disabled={isLoading}
        >
            <SelectTrigger className={`w-[110px] h-8 bg-background border-border text-xs ${expenseType === "MATERIAL" ? "text-expense-material" : "text-expense-service"}`}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="bg-card border-border max-h-[none]">
                <SelectItem value="MATERIAL" className="text-expense-material">Materiál</SelectItem>
                <SelectItem value="SERVICE" className="text-expense-service">Služba</SelectItem>
            </SelectContent>
        </Select>
    )
}
