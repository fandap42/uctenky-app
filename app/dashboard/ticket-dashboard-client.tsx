"use client"

import { useState } from "react"
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
  receipts: any[]
  createdAt: string
}

interface TicketDashboardClientProps {
  initialTickets: Ticket[]
  currentUserId: string
  currentUserRole: string
}

export function TicketDashboardClient({ 
  initialTickets, 
  currentUserId, 
  currentUserRole 
}: TicketDashboardClientProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const selectedTicket = initialTickets.find(t => t.id === selectedTicketId) || null

  const handleTicketClick = (ticketId: string) => {
    setSelectedTicketId(ticketId)
    setIsDialogOpen(true)
  }

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
        ticket={selectedTicket} 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />
    </>
  )
}
