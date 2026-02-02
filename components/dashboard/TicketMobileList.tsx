import { useState, useMemo, memo } from "react"
import { TicketStatus } from "@prisma/client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Ticket {
  id: string
  purpose: string
  budgetAmount: number
  status: TicketStatus
  requester: { fullName: string }
  section: { name: string }
  receipts: any[]
}

interface TicketMobileListProps {
  tickets: Ticket[]
  onTicketClick: (ticketId: string) => void
}

const FILTERS: { label: string; status: TicketStatus; color: string; bg: string }[] = [
  { label: "Čeká", status: "PENDING_APPROVAL", color: "bg-status-pending", bg: "bg-status-pending/10 text-status-pending" },
  { label: "Schváleno", status: "APPROVED", color: "bg-status-approved", bg: "bg-status-approved/10 text-status-success" },
  { label: "Ověření", status: "VERIFICATION", color: "bg-status-verification", bg: "bg-status-verification/10 text-status-verification" },
  { label: "Hotovo", status: "DONE", color: "bg-status-success", bg: "bg-status-success/10 text-status-success" },
]

export const TicketMobileList = memo(function TicketMobileList({ tickets, onTicketClick }: TicketMobileListProps) {
  const [activeFilter, setActiveFilter] = useState<TicketStatus | null>(null)

  const toggleFilter = (status: TicketStatus) => {
    setActiveFilter(prev => prev === status ? null : status)
  }

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => 
      !activeFilter || t.status === activeFilter
    ).sort((a, b) => {
      // Custom sort: Put unpaid DONE tickets first
      if (a.status === "DONE" && b.status === "DONE") {
        const aUnpaid = a.receipts.some(r => !r.isPaid)
        const bUnpaid = b.receipts.some(r => !r.isPaid)
        if (aUnpaid && !bUnpaid) return -1
        if (!aUnpaid && bUnpaid) return 1
      }
      return 0
    })
  }, [tickets, activeFilter])

  return (
    <div className="w-full space-y-8">
      {/* Filter Dots */}
      <div className="flex overflow-x-auto pb-4 pt-2 px-1 gap-3 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible md:flex-wrap md:justify-center">
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.status
          return (
            <button
              key={filter.status}
              onClick={() => toggleFilter(filter.status)}
              className={cn(
                "flex items-center gap-2.5 px-5 h-10 rounded-full border transition-all whitespace-nowrap min-w-fit shadow-sm text-sm font-bold uppercase tracking-wide",
                isActive 
                  ? "bg-foreground text-background border-foreground shadow-md transform scale-[1.02]" 
                  : "bg-card text-muted-foreground border-border hover:border-foreground/20"
              )}
            >
              <div className={cn("w-2.5 h-2.5 rounded-full ring-2 ring-background", filter.color)} />
              <span>
                {filter.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="space-y-4 w-full pb-24">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm flex flex-col items-center gap-4 border-2 border-dashed border-border/40 rounded-[2.5rem]">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center opacity-50 text-2xl">
              ∅
            </div>
            <p>Žádné žádosti v této kategorii</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <TicketCardItem 
              key={ticket.id} 
              ticket={ticket} 
              onClick={() => onTicketClick(ticket.id)} 
            />
          ))
        )}
      </div>
    </div>
  )
})

// Extracted Memoized Card Component
const TicketCardItem = memo(function TicketCardItem({ ticket, onClick }: { ticket: Ticket; onClick: () => void }) {
  const statusConfig = FILTERS.find(f => f.status === ticket.status)
  const isUnpaidDone = ticket.status === "DONE" && ticket.receipts.some(r => !r.isPaid)

  return (
    <Card 
      onClick={onClick}
      className={cn(
        "p-6 relative overflow-hidden rounded-[2.5rem] border-border/50 shadow-sm w-full transition-all active:scale-[0.98] active:bg-muted/50",
        isUnpaidDone && "border-status-pending border-2"
      )}
    >
      <div className="absolute top-1/2 -translate-y-1/2 right-0 p-5">
         <div className={cn("w-3 h-3 rounded-full shadow-sm ring-4 ring-background", statusConfig?.color || "bg-gray-400")} />
      </div>

      <div className="space-y-4 pr-6">
        {/* Row 1: Title + Amount */}
        <div className="flex justify-between items-start">
           <h4 className="font-bold text-lg leading-snug line-clamp-2 max-w-[65%] tracking-tight">{ticket.purpose}</h4>
           <span className="text-xl font-black text-foreground tabular-nums">{ticket.budgetAmount.toLocaleString()} Kč</span>
        </div>
        
        {/* Row 2: Metadata */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="secondary" className="text-[10px] font-bold h-7 px-3 bg-muted text-muted-foreground uppercase tracking-wider rounded-lg">
            {ticket.section.name}
          </Badge>
          <span className="text-xs text-muted-foreground font-medium">
            {ticket.requester.fullName}
          </span>
        </div>

        {/* Unpaid Warning */}
        {isUnpaidDone && (
          <div className="pt-3 border-t border-status-pending/20 flex justify-end">
             <span className="text-[10px] font-black text-status-pending uppercase border border-status-pending/20 bg-status-pending/10 px-2 py-1 rounded-lg animate-pulse">
               Čeká na proplacení
             </span>
          </div>
        )}
      </div>
    </Card>
  )
})
