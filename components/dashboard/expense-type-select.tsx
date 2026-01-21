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
            <SelectTrigger className={`w-[110px] h-8 bg-slate-900 border-slate-700 text-xs ${expenseType === "MATERIAL" ? "text-blue-400" : "text-purple-400"}`}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="MATERIAL" className="text-blue-400">Materiál</SelectItem>
                <SelectItem value="SERVICE" className="text-purple-400">Služba</SelectItem>
            </SelectContent>
        </Select>
    )
}
