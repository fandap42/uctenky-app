"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface TablePaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number | "all"
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number | "all") => void
}

export function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 items-center px-4 py-2 bg-muted/5 border-t border-border gap-4 sm:gap-0">
      {/* Left: Empty for balance */}
      <div className="hidden sm:block" />

      {/* Center: Navigation Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-[11px] font-black tabular-nums text-muted-foreground uppercase tracking-widest whitespace-nowrap">
          Strana <span className="text-foreground">{currentPage}</span> / {totalPages || 1}
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage >= totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Right: Page Size Selector */}
      <div className="flex items-center justify-end gap-4">
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Na stránku:</span>
        <Select
          value={pageSize.toString()}
          onValueChange={(val) => onPageSizeChange(val === "all" ? "all" : parseInt(val))}
        >
          <SelectTrigger className="h-7 w-[80px] text-[11px] font-bold border-muted-foreground/10 bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="all">Vše</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
