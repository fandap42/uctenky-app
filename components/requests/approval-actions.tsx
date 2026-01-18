"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { updateTransactionStatus } from "@/lib/actions/transactions"
import { toast } from "sonner"

interface ApprovalActionsProps {
  transactionId: string
  currentStatus: string
}

type TransStatus = "APPROVED" | "REJECTED" | "VERIFIED" | "PENDING" | "DRAFT" | "PURCHASED"

export function ApprovalActions({ transactionId, currentStatus }: ApprovalActionsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const router = useRouter()

  async function handleStatusChange(status: TransStatus) {
    setIsLoading(status)
    const result = await updateTransactionStatus(transactionId, status)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(
        status === "APPROVED"
          ? "Žádost byla schválena"
          : status === "REJECTED"
          ? "Žádost byla zamítnuta"
          : status === "VERIFIED"
          ? "Žádost byla ověřena"
          : "Stav žádosti byl aktualizován"
      )
      router.refresh()
    }
    setIsLoading(null)
  }

  // Show different actions based on current status
  if (currentStatus === "PENDING") {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => handleStatusChange("APPROVED")}
          disabled={isLoading !== null}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isLoading === "APPROVED" ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Schválit
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleStatusChange("REJECTED")}
          disabled={isLoading !== null}
        >
          {isLoading === "REJECTED" ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Zamítnout
            </>
          )}
        </Button>
      </div>
    )
  }

  if (currentStatus === "PURCHASED") {
    return (
      <Button
        size="sm"
        onClick={() => handleStatusChange("VERIFIED")}
        disabled={isLoading !== null}
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        {isLoading === "VERIFIED" ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Ověřit
          </>
        )}
      </Button>
    )
  }

  return null
}
