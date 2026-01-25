"use client"

import { TicketStatus } from "@prisma/client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

const TABS: { label: string; status: TicketStatus; color: string }[] = [
  { label: "Čeká", status: "PENDING_APPROVAL", color: "bg-amber-500" },
  { label: "Schváleno", status: "APPROVED", color: "bg-blue-500" },
  { label: "Ověření", status: "VERIFICATION", color: "bg-purple-500" },
  { label: "Hotovo", status: "DONE", color: "bg-emerald-500" },
]

export function TicketMobileList({ tickets, onTicketClick }: TicketMobileListProps) {
  return (
    <Tabs defaultValue="PENDING_APPROVAL" className="w-full">
      <TabsList className="grid grid-cols-4 w-full h-12 bg-muted/50 rounded-xl p-1">
        {TABS.map((tab) => (
          <TabsTrigger 
            key={tab.status} 
            value={tab.status}
            className="text-[10px] font-bold uppercase tracking-tight rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {TABS.map((tab) => {
        const colTickets = tickets.filter((t) => t.status === tab.status)
        
        if (tab.status === "DONE") {
           colTickets.sort((a, b) => {
             const aUnpaid = a.receipts.some(r => !r.isPaid)
             const bUnpaid = b.receipts.some(r => !r.isPaid)
             if (aUnpaid && !bUnpaid) return -1
             if (!aUnpaid && bUnpaid) return 1
             return 0
           })
        }

        return (
          <TabsContent key={tab.status} value={tab.status} className="mt-6 space-y-4">
            {colTickets.map((ticket) => (
              <Card 
                key={ticket.id}
                onClick={() => onTicketClick(ticket.id)}
                className={cn(
                  "p-4 relative overflow-hidden rounded-[1.5rem] border-border/50 shadow-sm",
                  ticket.status === "DONE" && ticket.receipts.some(r => !r.isPaid) && "border-orange-500 border-2"
                )}
              >
                <div className="absolute top-0 right-0 p-3">
                   <div className={cn("w-2.5 h-2.5 rounded-full", tab.color)} />
                </div>

                <div className="space-y-3 pr-4">
                  <h4 className="font-bold text-sm leading-tight">{ticket.purpose}</h4>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-medium py-0 h-5 px-2 bg-muted/50">
                      {ticket.section.name}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground italic">
                      {ticket.requester.fullName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-sm font-black text-foreground">{ticket.budgetAmount.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Kč</span>
                    </div>
                    {ticket.status === "DONE" && ticket.receipts.some(r => !r.isPaid) && (
                       <span className="text-[9px] font-black text-orange-600 uppercase border border-orange-200 bg-orange-50 px-1.5 py-0.5 rounded-md">
                         Proplatit!
                       </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {colTickets.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center opacity-50">
                  ∅
                </div>
                Žádné žádosti v této kategorii
              </div>
            )}
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
