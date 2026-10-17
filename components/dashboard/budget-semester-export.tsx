"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { FileDown, FileSpreadsheet } from "lucide-react"
import * as XLSX from "xlsx"

interface SectionSpending {
  sectionId: string
  sectionName: string
  spent: number
  pending: number
}

interface BudgetSemesterExportProps {
  semester: string
  sections: SectionSpending[]
}

export function BudgetSemesterExport({ semester, sections }: BudgetSemesterExportProps) {
  function exportToCSV() {
    if (sections.length === 0) {
      toast.error("Žádná data k exportu")
      return
    }

    // CSV Headers - comma separated (default English CSV)
    const headers = ["Sekce", "Vycerpano", "Cekajici", "Celkem"]

    // CSV Rows - plain numbers with dot decimal format for comma-separated CSV
    const rows = sections.map((s) => [
      `"${s.sectionName.replace(/"/g, '""')}"`,
      s.spent.toFixed(2),
      s.pending.toFixed(2),
      (s.spent + s.pending).toFixed(2),
    ])

    // Add totals row
    const totalSpent = sections.reduce((sum, s) => sum + s.spent, 0)
    const totalPending = sections.reduce((sum, s) => sum + s.pending, 0)
    rows.push([
      "CELKEM",
      totalSpent.toFixed(2),
      totalPending.toFixed(2),
      (totalSpent + totalPending).toFixed(2),
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
    link.setAttribute("download", `rozpocet-${semester}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success("Export CSV dokončen")
  }

  function exportToXLSX() {
    if (sections.length === 0) {
      toast.error("Žádná data k exportu")
      return
    }

    const headers = ["Sekce", "Vyčerpáno", "Čekající", "Celkem"]

    const rows = sections.map((s) => [
      s.sectionName,
      Number(s.spent.toFixed(2)),
      Number(s.pending.toFixed(2)),
      Number((s.spent + s.pending).toFixed(2)),
    ])

    const totalSpent = sections.reduce((sum, s) => sum + s.spent, 0)
    const totalPending = sections.reduce((sum, s) => sum + s.pending, 0)
    rows.push([
      "CELKEM",
      Number(totalSpent.toFixed(2)),
      Number(totalPending.toFixed(2)),
      Number((totalSpent + totalPending).toFixed(2)),
    ])

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
    worksheet["!cols"] = [
      { wch: 28 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, `Rozpočet ${semester}`)
    XLSX.writeFile(workbook, `rozpocet-${semester}.xlsx`)

    toast.success("Export XLSX dokončen")
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={exportToCSV}
        variant="outline"
        size="sm"
        className="text-xs font-bold rounded-full border-border hover:bg-muted text-muted-foreground hover:text-foreground"
      >
        <FileDown className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
      <Button
        onClick={exportToXLSX}
        variant="outline"
        size="sm"
        className="text-xs font-bold rounded-full border-border hover:bg-muted text-muted-foreground hover:text-foreground"
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Export XLSX
      </Button>
    </div>
  )
}
