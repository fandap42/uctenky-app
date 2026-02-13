"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { updateTicketDetails } from "@/lib/actions/tickets"
import { toast } from "sonner"
import { TicketStatus } from "@prisma/client"

interface ApprovalActionsProps {
  ticketId: string
  currentStatus: string
  purpose: string
  budgetAmount: number
  targetDate: string
}

export function ApprovalActions({ ticketId, currentStatus, purpose, budgetAmount, targetDate }: ApprovalActionsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const router = useRouter()

  async function handleStatusChange(status: TicketStatus) {
    setIsLoading(status)
    
    const result = await updateTicketDetails(ticketId, {
      purpose,
      budgetAmount,
      targetDate: new Date(targetDate),
      status,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(
        status === "APPROVED"
          ? "Žádost byla schválena"
          : status === "DONE"
          ? "Hotovo / Uzavřeno"
          : status === "VERIFICATION"
          ? "Ověřeno: Účtenka vložena"
          : "Stav žádosti byl aktualizován"
      )
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
      router.refresh()
    }
    setIsLoading(null)
  }

  // Show different actions based on current status
  if (currentStatus === "PENDING_APPROVAL") {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={() => handleStatusChange("APPROVED")}
          disabled={isLoading !== null}
          className="h-8 px-3 text-xs font-bold bg-status-success hover:bg-status-success/90 text-white flex items-center gap-1.5 transition-colors"
        >
          {isLoading === "APPROVED" ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Schválit
            </>
          )}
        </Button>
      </div>
    )
  }

  if (currentStatus === "APPROVED") {
    return (
      <Button
        variant="outline"
        onClick={() => handleStatusChange("PENDING_APPROVAL")}
        disabled={isLoading !== null}
        className="h-8 px-3 text-xs font-bold border-status-pending/30 text-status-pending hover:bg-status-pending/10"
      >
        {isLoading === "PENDING_APPROVAL" ? "Ukládám..." : "Vrátit na čeká"}
      </Button>
    )
  }

  if (currentStatus === "VERIFICATION") {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => handleStatusChange("APPROVED")}
          disabled={isLoading !== null}
          className="h-8 px-3 text-xs font-bold border-status-approved/30 text-status-approved hover:bg-status-approved/10"
        >
          {isLoading === "APPROVED" ? "Ukládám..." : "Zpět na schváleno"}
        </Button>
        <Button
          onClick={() => handleStatusChange("DONE")}
          disabled={isLoading !== null}
          className="h-8 px-3 text-xs font-bold bg-status-verification hover:bg-status-verification/90 text-white flex items-center gap-1.5 transition-colors"
        >
          {isLoading === "DONE" ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ověřit
            </>
          )}
        </Button>
      </div>
    )
  }

  if (currentStatus === "DONE") {
    return (
      <Button
        variant="outline"
        onClick={() => handleStatusChange("VERIFICATION")}
        disabled={isLoading !== null}
        className="h-8 px-3 text-xs font-bold border-status-verification/30 text-status-verification hover:bg-status-verification/10"
      >
        {isLoading === "VERIFICATION" ? "Ukládám..." : "Vrátit k ověření"}
      </Button>
    )
  }

  return null
}
