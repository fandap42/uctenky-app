"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { FileDown, FileSpreadsheet } from "lucide-react"
import * as XLSX from "xlsx"

interface Transaction {
  id: string
  purpose: string
  store?: string | null
  estimatedAmount: number | string
  finalAmount: number | string | null
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

    // CSV Headers - comma separated (default English CSV)
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
      `"${(t.requester?.fullName || "Neznamy").replace(/"/g, '""')}"`,
      `"${(t.section?.name || "Neznama").replace(/"/g, '""')}"`,
      `"${t.purpose.replace(/"/g, '""')}"`,
      `"${(t.store || "").replace(/"/g, '""')}"`,
      Number(t.estimatedAmount).toFixed(2),
      t.finalAmount ? Number(t.finalAmount).toFixed(2) : "-",
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
    
    toast.success("Export CSV dokončen")
  }

  function exportToXLSX() {
    if (transactions.length === 0) {
      toast.error("Žádná data k exportu")
      return
    }

    const headers = [
      "Datum vytvoření",
      "Žadatel",
      "Sekce",
      "Účel",
      "Obchod",
      "Původní částka",
      "Konečná částka",
      "Stav",
      "Proplaceno",
      "Splatnost",
    ]

    const rows = transactions.map((t) => [
      new Date(t.createdAt).toLocaleDateString("cs-CZ"),
      t.requester?.fullName || "Neznámý",
      t.section?.name || "Neznámá",
      t.purpose,
      t.store || "",
      Number(Number(t.estimatedAmount).toFixed(2)),
      t.finalAmount ? Number(Number(t.finalAmount).toFixed(2)) : "-",
      t.status,
      t.isPaid ? "ANO" : "NE",
      t.dueDate ? new Date(t.dueDate).toLocaleDateString("cs-CZ") : "-",
    ])

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 22 },
      { wch: 20 },
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 12 },
      { wch: 15 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Účtenky")
    const xlsxFilename = filename.replace(/\.csv$/i, "") + ".xlsx"
    XLSX.writeFile(workbook, xlsxFilename)

    toast.success("Export XLSX dokončen")
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={exportToCSV}
        variant="ghost"
        size="sm"
        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full h-7 px-3"
      >
        <FileDown className="h-3 w-3 mr-1.5" />
        Export CSV
      </Button>
      <Button
        onClick={exportToXLSX}
        variant="ghost"
        size="sm"
        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full h-7 px-3"
      >
        <FileSpreadsheet className="h-3 w-3 mr-1.5" />
        Export XLSX
      </Button>
    </div>
  )
}
