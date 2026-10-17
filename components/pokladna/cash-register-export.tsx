"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { monthNames } from "@/lib/utils/semesters"
import { FileDown, FileSpreadsheet } from "lucide-react"
import * as XLSX from "xlsx"

interface Transaction {
  id: string
  purpose?: string
  store?: string | null
  amount: number | string // Already processed (negative for expenses)
  isPaid?: boolean
  expenseType?: string
  date?: string | null
  note?: string | null
  sectionName?: string // Flattened from ticket.section.name
  section?: { name: string } | null // Fallback for old format
}

interface Deposit {
  id: string
  amount: number | string
  description?: string | null
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
  function buildRows() {
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
      // Get section name - prioritize flattened sectionName, then section.name
      const sectionName = t.sectionName || t.section?.name || "-"
      // Amount is already negative from client.tsx transformation
      const rawAmount = Number(t.amount || 0)
      const amount = rawAmount > 0 ? -rawAmount : rawAmount
      
      rows.push({
        date: new Date(t.date || new Date()),
        type: "transaction",
        section: sectionName,
        purpose: t.purpose || "-",
        store: t.store || "-",
        amount: amount,
        expenseType: t.expenseType === "MATERIAL" ? "Materiál" : (t.expenseType === "SERVICE" ? "Služba" : "-"),
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
        amount: Number(d.amount), // Positive for deposits
        expenseType: "-",
      })
    })

    // Sort by date
    rows.sort((a, b) => a.date.getTime() - b.date.getTime())
    return rows
  }

  function exportToCSV() {
    if (transactions.length === 0 && deposits.length === 0) {
      toast.error("Žádná data k exportu")
      return
    }

    const rows = buildRows()

    // CSV Headers - comma separated (default English CSV)
    const headers = [
      "Datum",
      "Sekce",
      "Účel",
      "Obchod",
      "Částka",
      "Typ",
    ]

    // Format rows - plain numbers with dot decimal separator for comma-delimited CSV
    const csvRows = rows.map((r) => [
      r.date.toLocaleDateString("cs-CZ"),
      `"${r.section.replace(/"/g, '""')}"`,
      `"${r.purpose.replace(/"/g, '""')}"`,
      `"${r.store.replace(/"/g, '""')}"`,
      r.amount.toFixed(2),
      `"${r.expenseType.replace(/"/g, '""')}"`,
    ])

    // Build CSV content
    const monthName = monthNames[month]
    const csvContent = [
      `"Pokladna - ${monthName} ${year}"`,
      "",
      `Počáteční zůstatek,${beginningBalance.toFixed(2)}`,
      "",
      headers.join(","),
      ...csvRows.map((r) => r.join(",")),
      "",
      `Konečný zůstatek,${endingBalance.toFixed(2)}`,
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

    toast.success("Export CSV dokončen")
  }

  function exportToXLSX() {
    if (transactions.length === 0 && deposits.length === 0) {
      toast.error("Žádná data k exportu")
      return
    }

    const rows = buildRows()
    const monthName = monthNames[month]

    const headers = [
      "Datum",
      "Sekce",
      "Účel",
      "Obchod",
      "Částka",
      "Typ",
    ]

    const sheetData = [
      [`Pokladna - ${monthName} ${year}`],
      [],
      ["Počáteční zůstatek", Number(beginningBalance.toFixed(2))],
      [],
      headers,
      ...rows.map((r) => [
        r.date.toLocaleDateString("cs-CZ"),
        r.section,
        r.purpose,
        r.store,
        Number(r.amount.toFixed(2)),
        r.expenseType,
      ]),
      [],
      ["Konečný zůstatek", Number(endingBalance.toFixed(2))],
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
    worksheet["!cols"] = [
      { wch: 16 },
      { wch: 24 },
      { wch: 32 },
      { wch: 24 },
      { wch: 15 },
      { wch: 15 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, `${monthName} ${year}`)
    XLSX.writeFile(workbook, `pokladna-${monthName.toLowerCase()}-${year}.xlsx`)

    toast.success("Export XLSX dokončen")
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        onClick={exportToCSV}
        variant="outline"
        size="sm"
        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
      >
        <FileDown className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
      <Button
        onClick={exportToXLSX}
        variant="outline"
        size="sm"
        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Export XLSX
      </Button>
    </div>
  )
}
