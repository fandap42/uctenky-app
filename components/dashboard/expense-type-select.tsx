"use client"

import { useState } from "react"
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

    async function handleChange(value: string) {
        setIsLoading(true)
        const result = await updateTransactionExpenseType(transactionId, value as "MATERIAL" | "SERVICE")

        if (result.error) {
            toast.error(result.error)
        } else {
            setExpenseType(value)
            toast.success(value === "MATERIAL" ? "Označeno jako materiál" : "Označeno jako služba")
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
            <SelectContent className="bg-card border-border">
                <SelectItem value="MATERIAL" className="text-primary">Materiál</SelectItem>
                <SelectItem value="SERVICE" className="text-[oklch(0.55_0.15_290)]">Služba</SelectItem>
            </SelectContent>
        </Select>
    )
}
