"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

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

    // CSV Headers
    const headers = ["Sekce", "Vycerpano", "Cekajici", "Celkem"]

    // CSV Rows
    const rows = sections.map((s) => [
      `"${s.sectionName.replace(/"/g, '""')}"`,
      s.spent,
      s.pending,
      s.spent + s.pending,
    ])

    // Add totals row
    const totalSpent = sections.reduce((sum, s) => sum + s.spent, 0)
    const totalPending = sections.reduce((sum, s) => sum + s.pending, 0)
    rows.push(["CELKEM", totalSpent, totalPending, totalSpent + totalPending])

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
    
    toast.success("Export dokončen")
  }

  return (
    <Button
      onClick={exportToCSV}
      variant="outline"
      size="sm"
      className="text-xs border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
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
