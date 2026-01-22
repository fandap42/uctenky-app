"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { FileDown } from "lucide-react"

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
      className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full h-7 px-3"
    >
      <FileDown className="h-3 w-3 mr-1.5" />
      Export CSV
    </Button>
  )
}
