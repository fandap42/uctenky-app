import { useCallback, useEffect, useMemo, useRef, useState, memo, type PointerEvent as ReactPointerEvent } from "react"
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

interface ColumnWithTickets {
  label: string
  status: TicketStatus
  color: string
  tickets: Ticket[]
}

const COLUMNS: { label: string; status: TicketStatus; color: string }[] = [
  { label: "Čeká na schválení", status: "PENDING_APPROVAL", color: "bg-status-pending/20 border-status-pending/30 dark:bg-status-pending/15 dark:border-status-pending/35" },
  { label: "Schváleno", status: "APPROVED", color: "bg-status-approved/20 border-status-approved/30 dark:bg-status-approved/15 dark:border-status-approved/35" },
  { label: "Ověřování", status: "VERIFICATION", color: "bg-status-verification/20 border-status-verification/30 dark:bg-status-verification/15 dark:border-status-verification/35" },
  { label: "Hotovo", status: "DONE", color: "bg-status-success/20 border-status-success/30 dark:bg-status-success/15 dark:border-status-success/35" },
]

export const TicketKanban = memo(function TicketKanban({ tickets, onTicketClick }: TicketKanbanProps) {
  const columnsWithTickets: ColumnWithTickets[] = useMemo(() => {
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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full min-h-0">
      {columnsWithTickets.map((col) => (
        <div key={col.status} className="flex flex-col gap-4 min-h-0">
          <div className="flex items-center justify-between px-2">
            <h3 className="table-header-cell">
              {col.label}
            </h3>
            <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px]">
              {col.tickets.length}
            </Badge>
          </div>

          <KanbanScrollableColumn col={col} onTicketClick={onTicketClick} />
        </div>
      ))}
    </div>
  )
})

const MIN_THUMB_HEIGHT = 28

const KanbanScrollableColumn = memo(function KanbanScrollableColumn({
  col,
  onTicketClick,
}: {
  col: ColumnWithTickets
  onTicketClick: (ticketId: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [thumbHeight, setThumbHeight] = useState(MIN_THUMB_HEIGHT)
  const [thumbTop, setThumbTop] = useState(0)
  const [isScrollable, setIsScrollable] = useState(false)

  const updateThumb = useCallback(() => {
    const scrollEl = scrollRef.current
    const trackEl = trackRef.current

    if (!scrollEl || !trackEl) return

    const trackHeight = trackEl.clientHeight
    const { scrollHeight, clientHeight, scrollTop } = scrollEl

    if (trackHeight <= 0 || scrollHeight <= clientHeight) {
      setIsScrollable(false)
      setThumbHeight(Math.max(trackHeight, MIN_THUMB_HEIGHT))
      setThumbTop(0)
      return
    }

    const nextThumbHeight = Math.max(
      MIN_THUMB_HEIGHT,
      (clientHeight / scrollHeight) * trackHeight
    )
    const maxScrollTop = scrollHeight - clientHeight
    const maxThumbTop = trackHeight - nextThumbHeight
    const nextThumbTop = maxScrollTop > 0 ? (scrollTop / maxScrollTop) * maxThumbTop : 0

    setIsScrollable(true)
    setThumbHeight(nextThumbHeight)
    setThumbTop(nextThumbTop)
  }, [])

  useEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return

    const rafId = window.requestAnimationFrame(updateThumb)
    scrollEl.addEventListener("scroll", updateThumb, { passive: true })
    window.addEventListener("resize", updateThumb)

    return () => {
      window.cancelAnimationFrame(rafId)
      scrollEl.removeEventListener("scroll", updateThumb)
      window.removeEventListener("resize", updateThumb)
    }
  }, [updateThumb, col.tickets.length])

  const scrollFromThumbTop = useCallback((nextThumbTop: number) => {
    const scrollEl = scrollRef.current
    const trackEl = trackRef.current

    if (!scrollEl || !trackEl) return

    const maxScrollTop = scrollEl.scrollHeight - scrollEl.clientHeight
    const maxThumbTop = trackEl.clientHeight - thumbHeight

    if (maxScrollTop <= 0 || maxThumbTop <= 0) {
      scrollEl.scrollTop = 0
      return
    }

    scrollEl.scrollTop = (nextThumbTop / maxThumbTop) * maxScrollTop
  }, [thumbHeight])

  const handleTrackPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).dataset.role === "thumb") return

    const trackEl = trackRef.current
    if (!trackEl) return

    const trackRect = trackEl.getBoundingClientRect()
    const maxThumbTop = Math.max(trackEl.clientHeight - thumbHeight, 0)
    const pointerY = event.clientY - trackRect.top
    const nextThumbTop = Math.min(
      Math.max(pointerY - thumbHeight / 2, 0),
      maxThumbTop
    )

    scrollFromThumbTop(nextThumbTop)
  }, [scrollFromThumbTop, thumbHeight])

  const handleThumbPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()

    const trackEl = trackRef.current
    if (!trackEl) return

    const pointerId = event.pointerId
    const thumbOffset = event.clientY - trackEl.getBoundingClientRect().top - thumbTop

    try {
      event.currentTarget.setPointerCapture(pointerId)
    } catch {
      // noop
    }

    const onPointerMove = (moveEvent: PointerEvent) => {
      const rect = trackEl.getBoundingClientRect()
      const maxThumbTop = Math.max(trackEl.clientHeight - thumbHeight, 0)
      const nextThumbTop = Math.min(
        Math.max(moveEvent.clientY - rect.top - thumbOffset, 0),
        maxThumbTop
      )

      scrollFromThumbTop(nextThumbTop)
    }

    const cleanup = () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", cleanup)
      window.removeEventListener("pointercancel", cleanup)

      try {
        event.currentTarget.releasePointerCapture(pointerId)
      } catch {
        // noop
      }
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", cleanup)
    window.addEventListener("pointercancel", cleanup)
  }, [scrollFromThumbTop, thumbHeight, thumbTop])

  return (
    <div
      className={cn(
        "flex-1 min-h-0 rounded-[2rem] border overflow-hidden bg-muted/35 dark:bg-muted/20",
        col.color
      )}
    >
      <div className="h-full min-h-0 relative px-2 py-0">
        <div ref={scrollRef} className="h-full min-h-0 overflow-y-auto scrollbar-none">
          <div className="space-y-4 py-4 px-2">
            {col.tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={onTicketClick}
              />
            ))}

            {col.tickets.length === 0 && (
              <div className="h-24 w-full flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-border/50 rounded-[1.5rem]">
                Žádné žádosti
              </div>
            )}
          </div>
        </div>

        <div className="pointer-events-none absolute top-6 bottom-6 right-1 w-1">
          <div
            ref={trackRef}
            onPointerDown={handleTrackPointerDown}
            className="pointer-events-auto absolute inset-0 rounded-full bg-border/40"
          >
            {isScrollable && (
              <div
                data-role="thumb"
                onPointerDown={handleThumbPointerDown}
                className="absolute inset-x-0 rounded-full bg-muted-foreground/60 hover:bg-muted-foreground/80 cursor-grab active:cursor-grabbing touch-none"
                style={{
                  height: `${thumbHeight}px`,
                  transform: `translateY(${thumbTop}px)`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

const TicketCard = memo(function TicketCard({ ticket, onClick }: { ticket: Ticket; onClick: (id: string) => void }) {
  const isDoneAndUnpaid = ticket.status === "DONE" && ticket.receipts.some(r => !r.isPaid)

  return (
    <Card 
      onClick={() => onClick(ticket.id)}
      className={cn(
        "w-full p-4 cursor-pointer hover:shadow-md transition-all rounded-[1.5rem] border-border/50",
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
