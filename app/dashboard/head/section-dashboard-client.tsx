"use client"

import { useState, useCallback } from "react"
import { TicketKanban } from "@/components/dashboard/TicketKanban"
import { TicketMobileList } from "@/components/dashboard/TicketMobileList"
import { TicketDetailDialog } from "@/components/dashboard/TicketDetailDialog"
import { TicketStatus } from "@prisma/client"

interface Ticket {
  id: string
  purpose: string
  budgetAmount: number
  status: TicketStatus
  requesterId: string
  requester: { fullName: string }
  sectionId: string
  section: { name: string }
  receipts: Array<{ amount: number; [key: string]: unknown }>
  createdAt: string
  targetDate: string
  isFiled?: boolean
}

interface SectionDashboardClientProps {
  initialTickets: Ticket[]
  currentUserId: string
  currentUserRole: string
}

export function SectionDashboardClient({ 
  initialTickets, 
  currentUserId, 
  currentUserRole 
}: SectionDashboardClientProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const selectedTicket = initialTickets.find(t => t.id === selectedTicketId) || null

  const handleTicketClick = useCallback((ticketId: string) => {
    setSelectedTicketId(ticketId)
    setIsDialogOpen(true)
  }, [])

  return (
    <>
      {/* Desktop Kanban */}
      <div className="hidden lg:block">
        <TicketKanban tickets={initialTickets} onTicketClick={handleTicketClick} />
      </div>

      {/* Mobile view */}
      <div className="lg:hidden">
        <TicketMobileList tickets={initialTickets} onTicketClick={handleTicketClick} />
      </div>

      <TicketDetailDialog 
        ticket={selectedTicket as unknown as NonNullable<typeof selectedTicket>} 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />
    </>
  )
}
