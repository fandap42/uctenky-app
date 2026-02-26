import { memo } from "react"
import { TicketCardItem } from "./TicketMobileList"
import { TicketStatus } from "@prisma/client"

interface Ticket {
    id: string
    purpose: string
    budgetAmount: number
    status: TicketStatus
    isReturned?: boolean
    requester?: { fullName: string | null; image?: string | null } | null
    section: { name: string }
    receipts: { isPaid: boolean; amount: number }[]
    targetDate: string
}

interface TicketHistoricalListProps {
    tickets: Ticket[]
    onTicketClick: (ticketId: string) => void
    isLoading?: boolean
}

export const TicketHistoricalList = memo(function TicketHistoricalList({
    tickets,
    onTicketClick,
    isLoading
}: TicketHistoricalListProps) {

    if (isLoading) {
        return (
            <div className="w-full flex flex-col items-center justify-center p-20 gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <div className="text-sm text-muted-foreground font-medium">Načítání historie...</div>
            </div>
        )
    }

    if (tickets.length === 0) {
        return (
            <div className="w-full flex items-center justify-center p-20 border-2 border-dashed border-border/40 rounded-[2.5rem] mt-4">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center opacity-50 text-2xl">
                        ∅
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Nebyly nalezeny žádné historické žádosti.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 lg:pb-0 content-start pr-2 mt-2">
            {tickets.map(ticket => (
                <TicketCardItem
                    key={ticket.id}
                    ticket={ticket}
                    onClick={() => onTicketClick(ticket.id)}
                />
            ))}
        </div>
    )
})
