"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { monthNames } from "@/lib/utils/semesters"

interface Transaction {
  id: string
  purpose: string
  store?: string | null
  estimatedAmount: number
  finalAmount: number | null
  isPaid: boolean
  expenseType: string
  dueDate: string | null
  section?: { name: string } | null
}

interface Deposit {
  id: string
  amount: number
  description: string | null
  date: string
}

interface CashRegisterExportProps {
  transactions: Transaction[]
  deposits: Deposit[]
  beginningBalance: number
  endingBalance: number
  year: number
  month: number
}

export function CashRegisterExport({
  transactions,
  deposits,
  beginningBalance,
  endingBalance,
  year,
  month,
}: CashRegisterExportProps) {
  function exportToCSV() {
    if (transactions.length === 0 && deposits.length === 0) {
      toast.error("Žádná data k exportu")
      return
    }

    // Combine transactions and deposits into a single table
    type RowItem = {
      date: Date
      type: "transaction" | "deposit"
      section: string
      purpose: string
      store: string
      amount: number
      expenseType: string
    }

    const rows: RowItem[] = []

    // Add transactions
    transactions.forEach((t) => {
      rows.push({
        date: new Date(t.dueDate || new Date()),
        type: "transaction",
        section: t.section?.name || "-",
        purpose: t.purpose,
        store: t.store || "-",
        amount: -(t.finalAmount || t.estimatedAmount), // Negative for expenses
        expenseType: t.expenseType === "MATERIAL" ? "Materiál" : "Služba",
      })
    })

    // Add deposits
    deposits.forEach((d) => {
      rows.push({
        date: new Date(d.date),
        type: "deposit",
        section: "-",
        purpose: d.description || "Vklad",
        store: "-",
        amount: d.amount, // Positive for deposits
        expenseType: "-",
      })
    })

    // Sort by date
    rows.sort((a, b) => a.date.getTime() - b.date.getTime())

    // CSV Headers - semicolon separated for Czech Excel
    const headers = [
      "Datum",
      "Sekce",
      "Účel",
      "Obchod",
      "Částka",
      "Typ",
    ]

    // Format rows - plain numbers without formatting for Excel
    const csvRows = rows.map((r) => [
      r.date.toLocaleDateString("cs-CZ"),
      `"${r.section}"`,
      `"${r.purpose.replace(/"/g, '""')}"`,
      `"${r.store.replace(/"/g, '""')}"`,
      r.amount.toFixed(2).replace(".", ","), // Czech decimal separator, no thousands separator
      r.expenseType,
    ])

    // Build CSV content
    const monthName = monthNames[month]
    const csvContent = [
      `Pokladna - ${monthName} ${year}`,
      "",
      `Počáteční zůstatek;${beginningBalance.toFixed(2).replace(".", ",")}`,
      "",
      headers.join(";"),
      ...csvRows.map((r) => r.join(";")),
      "",
      `Konečný zůstatek;${endingBalance.toFixed(2).replace(".", ",")}`,
    ].join("\n")

    // Create download link with BOM for Excel UTF-8 support
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `pokladna-${monthName.toLowerCase()}-${year}.csv`
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("Export dokončen")
  }

  return (
    <Button
      onClick={exportToCSV}
      variant="outline"
      className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 mr-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      Export CSV
    </Button>
  )
}
