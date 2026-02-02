"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * StatusBadge - A semantic badge component for displaying ticket/item statuses
 * 
 * Uses the design system tokens from globals.css:
 * - status-pending, status-approved, status-verification, status-success
 * 
 * @example
 * <StatusBadge status="pending">Čeká na schválení</StatusBadge>
 * <StatusBadge status="approved">Schváleno</StatusBadge>
 * <StatusBadge status="verification">Ověřování</StatusBadge>
 * <StatusBadge status="success">Hotovo</StatusBadge>
 * <StatusBadge status="rejected">Zamítnuto</StatusBadge>
 */

const statusBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-3 py-0.5 text-badge font-bold shadow-none border whitespace-nowrap transition-colors",
  {
    variants: {
      status: {
        pending: "bg-status-pending-muted text-status-pending border-status-pending/20",
        approved: "bg-status-approved-muted text-status-approved border-status-approved/20",
        verification: "bg-status-verification-muted text-status-verification border-status-verification/20",
        success: "bg-status-success-muted text-status-success border-status-success/20",
        rejected: "bg-status-rejected-muted text-destructive border-destructive/20",
      },
      size: {
        default: "h-6 text-badge",
        sm: "h-5 text-[9px] px-2",
        lg: "h-7 text-xs px-4",
      }
    },
    defaultVariants: {
      status: "pending",
      size: "default",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  /** Override the default label with custom content */
  children?: React.ReactNode
}

/**
 * Default labels for each status (Czech localization)
 */
const defaultLabels: Record<NonNullable<VariantProps<typeof statusBadgeVariants>["status"]>, string> = {
  pending: "Čeká na schválení",
  approved: "Schváleno",
  verification: "Ověřování",
  success: "Hotovo",
  rejected: "Zamítnuto",
}

export function StatusBadge({
  className,
  status = "pending",
  size,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      data-status={status}
      className={cn(statusBadgeVariants({ status, size, className }))}
      {...props}
    >
      {children ?? defaultLabels[status ?? "pending"]}
    </span>
  )
}

/**
 * Helper to map TicketStatus enum values to StatusBadge status prop
 */
export function mapTicketStatusToBadge(ticketStatus: string): VariantProps<typeof statusBadgeVariants>["status"] {
  const mapping: Record<string, VariantProps<typeof statusBadgeVariants>["status"]> = {
    PENDING_APPROVAL: "pending",
    APPROVED: "approved",
    VERIFICATION: "verification",
    DONE: "success",
    REJECTED: "rejected",
  }
  return mapping[ticketStatus] ?? "pending"
}

export { statusBadgeVariants }
