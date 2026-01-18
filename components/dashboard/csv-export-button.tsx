"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Transaction {
  id: string
  purpose: string
  store?: string | null
  estimatedAmount: any
  finalAmount: any
  status: string
  isPaid: boolean
  createdAt: Date | string
  dueDate?: Date | string | null
  requester?: { fullName: string } | null
  section?: { name: string } | null
}

interface CSVExportButtonProps {
  transactions: Transaction[]
  filename?: string
}

export function CSVExportButton({
  transactions,
  filename = "uctenky-export.csv",
}: CSVExportButtonProps) {
  function exportToCSV() {
    if (transactions.length === 0) {
      toast.error("Žádná data k exportu")
      return
    }

    // CSV Headers
    const headers = [
      "Datum vytvoreni",
      "Zadatel",
      "Sekce",
      "Ucel",
      "Obchod",
      "Puvodni castka",
      "Konecna castka",
      "Stav",
      "Proplaceno",
      "Splatnost",
    ]

    // CSV Rows
    const rows = transactions.map((t) => [
      new Date(t.createdAt).toLocaleDateString("cs-CZ"),
      t.requester?.fullName || "Neznamy",
      t.section?.name || "Neznama",
      `"${t.purpose.replace(/"/g, '""')}"`,
      `"${(t.store || "").replace(/"/g, '""')}"`,
      Number(t.estimatedAmount),
      t.finalAmount ? Number(t.finalAmount) : "-",
      t.status,
      t.isPaid ? "ANO" : "NE",
      t.dueDate ? new Date(t.dueDate).toLocaleDateString("cs-CZ") : "-",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n")

    // Create download link with BOM for Excel UTF-8 support
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success("Export dokončen")
  }

  return (
    <Button
      onClick={exportToCSV}
      variant="ghost"
      size="sm"
      className="text-xs text-slate-400 hover:text-white"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3 w-3 mr-1"
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
      CSV
    </Button>
  )
}
