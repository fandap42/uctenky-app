"use client"

import { useState, useCallback, useEffect } from "react"
import { TicketKanban } from "@/components/dashboard/TicketKanban"
import { TicketMobileList } from "@/components/dashboard/TicketMobileList"
import { TicketDetailDialog } from "@/components/dashboard/TicketDetailDialog"
import { TicketViewSwitch } from "@/components/dashboard/ticket-view-switch"
import { TicketHistoricalList } from "@/components/dashboard/ticket-historical-list"
import { getTickets } from "@/lib/actions/tickets"
import { TicketStatus, ReceiptStatus, ExpenseType } from "@prisma/client"

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

interface TicketDashboardClientProps {
  initialTickets: Ticket[]
  currentUserId: string
  currentUserRole: string
  headerAction?: React.ReactNode
  title?: string
}

export function TicketDashboardClient({
  initialTickets,
  currentUserId,
  currentUserRole,
  headerAction,
  title = "Přehled"
}: TicketDashboardClientProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [view, setView] = useState<"active" | "historical">("active")
  const [historicalTickets, setHistoricalTickets] = useState<Ticket[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [, setHasLoadedHistory] = useState(false)

  const selectedTicket = view === "active"
    ? initialTickets.find(t => t.id === selectedTicketId) || null
    : historicalTickets.find(t => t.id === selectedTicketId) || null

  const handleTicketClick = useCallback((ticketId: string) => {
    setSelectedTicketId(ticketId)
    setIsDialogOpen(true)
  }, [])

  useEffect(() => {
    let isMounted = true

    if (view === "historical") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoadingHistory(true)
      getTickets({
        type: "historical",
        ...(currentUserRole !== "ADMIN" ? { requesterId: currentUserId } : {})
      })
        .then(res => {
          if (!isMounted) return
          if (res.tickets) {
            setHistoricalTickets(res.tickets as unknown as Ticket[])
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoadingHistory(false)
            setHasLoadedHistory(true)
          }
        })
    }

    return () => {
      isMounted = false
    }
  }, [view, currentUserRole, currentUserId])

  return (
    <div className="flex flex-col h-full">
      {/* Header - moved here to align switch properly without hacks */}
      <div className="hidden md:flex items-center justify-between mb-8 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <TicketViewSwitch view={view} onChange={setView} />
          {headerAction}
        </div>
      </div>

      {/* Mobile: Show only the button and switch separately */}
      <div className="flex md:hidden justify-end mb-4 flex-shrink-0">
        {headerAction}
      </div>

      {view === "historical" && (
        <div className="flex-shrink-0 mb-4 flex justify-end md:hidden">
          <TicketViewSwitch view={view} onChange={setView} />
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-auto -mx-1 px-1">
        {view === "active" ? (
          <>
            {/* Desktop Kanban */}
            <div className="hidden lg:block h-full overflow-hidden">
              <TicketKanban tickets={initialTickets} onTicketClick={handleTicketClick} />
            </div>

            {/* Mobile view */}
            <div className="lg:hidden h-full overflow-y-auto pb-4">
              <TicketMobileList tickets={initialTickets} onTicketClick={handleTicketClick} viewSwitch={<TicketViewSwitch view={view} onChange={setView} />} />
            </div>
          </>
        ) : (
          <TicketHistoricalList
            tickets={historicalTickets}
            onTicketClick={handleTicketClick}
            isLoading={isLoadingHistory}
          />
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
