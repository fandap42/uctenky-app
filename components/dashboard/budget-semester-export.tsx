"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { FileDown } from "lucide-react"

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

    // CSV Headers - semicolon separated for Czech Excel
    const headers = ["Sekce", "Vycerpano", "Cekajici", "Celkem"]

    // CSV Rows - plain numbers with Czech decimal format
    const rows = sections.map((s) => [
      `"${s.sectionName.replace(/"/g, '""')}"`,
      s.spent.toFixed(2).replace(".", ","),
      s.pending.toFixed(2).replace(".", ","),
      (s.spent + s.pending).toFixed(2).replace(".", ","),
    ])

    // Add totals row
    const totalSpent = sections.reduce((sum, s) => sum + s.spent, 0)
    const totalPending = sections.reduce((sum, s) => sum + s.pending, 0)
    rows.push([
      "CELKEM",
      totalSpent.toFixed(2).replace(".", ","),
      totalPending.toFixed(2).replace(".", ","),
      (totalSpent + totalPending).toFixed(2).replace(".", ","),
    ])

    const csvContent = [
      headers.join(";"),
      ...rows.map((r) => r.join(";")),
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
    
    toast.success("Export dokončen")
  }

  return (
    <Button
      onClick={exportToCSV}
      variant="outline"
      size="sm"
      className="text-xs font-bold rounded-full border-border hover:bg-muted text-muted-foreground hover:text-foreground"
    >
      <FileDown className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  )
}
