"use client"

import { useState, useCallback, useEffect } from "react"
import { TicketDetailDialog } from "@/components/dashboard/TicketDetailDialog"
import { TicketCardItem } from "@/components/dashboard/TicketMobileList"
import { getTickets, getArchivedSemesters } from "@/lib/actions/tickets"
import { TicketStatus, ReceiptStatus, ExpenseType } from "@prisma/client"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Receipt {
  id: string
  store: string
  date: string
  amount: number
  fileUrl: string
  isPaid: boolean
  expenseType: ExpenseType
  status: ReceiptStatus
  isFiled: boolean
  note?: string | null
}

interface Ticket {
  id: string
  purpose: string
  budgetAmount: number
  status: TicketStatus
  requesterId: string | null
  requester?: { fullName: string | null; image?: string | null } | null
  sectionId: string
  section: { name: string }
  receipts: Receipt[]
  createdAt: string
  targetDate: string
  isFiled?: boolean
}

interface ArchiveClientProps {
  initialTickets: Ticket[]
  initialSemesters: string[]
  currentUserId: string
  currentUserRole: string
  currentUserSectionId: string | null
}

function getSemesterLabel(key: string): string {
  const isWinter = key.startsWith("ZS")
  const year = parseInt(key.slice(2))
  return `${isWinter ? "Zimní" : "Letní"} semestr 20${year}`
}

export function ArchiveClient({
  initialTickets,
  initialSemesters,
  currentUserId,
  currentUserRole,
  currentUserSectionId,
}: ArchiveClientProps) {
  const isAdminUser = currentUserRole === "ADMIN"
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [semesters, setSemesters] = useState<string[]>(initialSemesters)
  const [selectedSemester, setSelectedSemester] = useState<string>("all")
  const [filterMode, setFilterMode] = useState<"my" | "section">("my")
  const [isLoading, setIsLoading] = useState(false)

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null

  const handleTicketClick = useCallback((ticketId: string) => {
    setSelectedTicketId(ticketId)
    setIsDialogOpen(true)
  }, [])

  // Re-fetch tickets when filters change
  useEffect(() => {
    let isMounted = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true)

    const filters: {
      type: "historical"
      requesterId?: string
      sectionId?: string
      semesterKey?: string
    } = { type: "historical" }

    if (filterMode === "my" && !isAdminUser) {
      filters.requesterId = currentUserId
    } else if (filterMode === "section" && currentUserSectionId) {
      filters.sectionId = currentUserSectionId
    }

    if (selectedSemester !== "all") {
      filters.semesterKey = selectedSemester
    }

    // Fetch both tickets and semesters
    const semesterFilters: { requesterId?: string; sectionId?: string } = {}
    if (filterMode === "my" && !isAdminUser) {
      semesterFilters.requesterId = currentUserId
    } else if (filterMode === "section" && currentUserSectionId) {
      semesterFilters.sectionId = currentUserSectionId
    }

    Promise.all([
      getTickets(filters),
      getArchivedSemesters(semesterFilters),
    ]).then(([ticketRes, semesterRes]) => {
      if (!isMounted) return
      if (ticketRes.tickets) {
        setTickets(ticketRes.tickets as unknown as Ticket[])
      }
      if (semesterRes.semesters) {
        setSemesters(semesterRes.semesters)
      }
    }).finally(() => {
      if (isMounted) setIsLoading(false)
    })

    return () => { isMounted = false }
  }, [selectedSemester, filterMode, currentUserId, currentUserSectionId, isAdminUser])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 flex-shrink-0">
        <h1 className="hidden md:block text-3xl font-black text-foreground">
          Archiv
        </h1>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Semester dropdown */}
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-[220px] h-10 bg-card border-border font-bold">
              <SelectValue placeholder="Všechny semestry" />
            </SelectTrigger>
            <SelectContent position="popper" className="bg-card border-border max-h-[none]">
              <SelectItem value="all" className="font-medium">
                Všechny semestry
              </SelectItem>
              {semesters.map((key) => (
                <SelectItem key={key} value={key} className="font-medium">
                  {getSemesterLabel(key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* My / Section toggle */}
          <div className="flex rounded-xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setFilterMode("my")}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
                filterMode === "my"
                  ? "bg-foreground text-background"
                  : "bg-card text-muted-foreground hover:bg-muted/50"
              )}
            >
              Moje
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("section")}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-l border-border",
                filterMode === "section"
                  ? "bg-foreground text-background"
                  : "bg-card text-muted-foreground hover:bg-muted/50"
              )}
            >
              Sekce
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto -mx-1 px-1">
        {isLoading ? (
          <div className="w-full flex flex-col items-center justify-center p-20 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <div className="text-sm text-muted-foreground font-medium">Načítání archivu...</div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="w-full flex items-center justify-center p-20 border-2 border-dashed border-border/40 rounded-[2.5rem] mt-4">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center opacity-50 text-2xl">
                ∅
              </div>
              <p className="text-sm text-muted-foreground font-medium">Nebyly nalezeny žádné archivované žádosti.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 lg:pb-0 content-start pr-2 mt-2">
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                className={cn(
                  ticket.status === "REJECTED" && "opacity-50"
                )}
              >
                <TicketCardItem
                  ticket={ticket}
                  onClick={() => handleTicketClick(ticket.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <TicketDetailDialog
        ticket={selectedTicket}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />
    </div>
  )
}
