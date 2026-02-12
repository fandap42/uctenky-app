import { useMemo, memo } from "react"
import { TicketStatus } from "@prisma/client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Ticket {
  id: string
  purpose: string
  budgetAmount: number
  status: TicketStatus
  requester?: { fullName: string | null } | null
  section: { name: string }
  receipts: { isPaid: boolean }[]
  targetDate: string
}

interface TicketKanbanProps {
  tickets: Ticket[]
  onTicketClick: (ticketId: string) => void
}

const COLUMNS: { label: string; status: TicketStatus; color: string }[] = [
  { label: "Čeká na schválení", status: "PENDING_APPROVAL", color: "bg-status-pending/10 border-status-pending/20" },
  { label: "Schváleno", status: "APPROVED", color: "bg-status-approved/10 border-status-approved/20" },
  { label: "Ověřování", status: "VERIFICATION", color: "bg-status-verification/10 border-status-verification/20" },
  { label: "Hotovo", status: "DONE", color: "bg-status-success/10 border-status-success/20" },
]

export const TicketKanban = memo(function TicketKanban({ tickets, onTicketClick }: TicketKanbanProps) {
  const columnsWithTickets = useMemo(() => {
    return COLUMNS.map((col) => {
      const colTickets = tickets.filter((t) => t.status === col.status)
      
      // Sorting: DONE tickets with unpaid receipts first
      if (col.status === "DONE") {
         colTickets.sort((a, b) => {
           const aUnpaid = a.receipts.some(r => !r.isPaid)
           const bUnpaid = b.receipts.some(r => !r.isPaid)
           if (aUnpaid && !bUnpaid) return -1
           if (!aUnpaid && bUnpaid) return 1
           return 0
         })
      }
      return { ...col, tickets: colTickets }
    })
  }, [tickets])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">
      {columnsWithTickets.map((col) => (
        <div key={col.status} className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="table-header-cell">
              {col.label}
            </h3>
            <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px]">
              {col.tickets.length}
            </Badge>
          </div>
          
          <div className={cn(
            "flex-1 rounded-[2rem] border p-4 space-y-4 bg-muted/30",
            col.color
          )}>
            {col.tickets.map((ticket) => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                onClick={onTicketClick} 
              />
            ))}
            {col.tickets.length === 0 && (
              <div className="h-24 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-border/50 rounded-[1.5rem]">
                Žádné žádosti
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
})

const TicketCard = memo(function TicketCard({ ticket, onClick }: { ticket: Ticket; onClick: (id: string) => void }) {
  const isDoneAndUnpaid = ticket.status === "DONE" && ticket.receipts.some(r => !r.isPaid)

  return (
    <Card 
      onClick={() => onClick(ticket.id)}
      className={cn(
        "p-4 cursor-pointer hover:shadow-md transition-all rounded-[1.5rem] border-border/50",
        isDoneAndUnpaid && "border-status-pending border-2 shadow-status-pending/10"
      )}
    >
      <div className="space-y-3">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-bold text-sm leading-tight line-clamp-2 min-w-0" title={ticket.purpose}>{ticket.purpose}</h4>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
            {new Date(ticket.targetDate).toLocaleDateString("cs-CZ")}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-[10px] font-medium py-0 h-5 px-2 bg-background/50 max-w-[100px] truncate flex-shrink-0" title={ticket.section.name}>
            {ticket.section.name}
          </Badge>
          <span className="text-[10px] text-muted-foreground ml-auto self-center truncate min-w-0" title={ticket.requester?.fullName || "Smazaný uživatel"}>
            {ticket.requester?.fullName || "Smazaný uživatel"}
          </span>
        </div>

        <div className="pt-2 border-t border-border/50 flex justify-between items-center">
           {isDoneAndUnpaid && (
             <span className="text-[10px] font-bold text-status-pending uppercase tracking-tighter">Čeká na proplacení</span>
           )}
           <div className="ml-auto flex items-baseline gap-0.5">
             <span className="text-xs font-black text-foreground">{ticket.budgetAmount.toLocaleString()}</span>
             <span className="text-[10px] font-bold text-muted-foreground">Kč</span>
           </div>
        </div>
      </div>
    </Card>
  )
})
