"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * PaymentStatusIndicator - A visual indicator for payment status (non-interactive)
 * 
 * Uses the design system tokens from globals.css:
 * - paid, unpaid
 * 
 * @example
 * <PaymentStatusIndicator isPaid={true} />
 * <PaymentStatusIndicator isPaid={false} />
 */

export interface PaymentStatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  isPaid: boolean
  size?: "sm" | "default" | "lg"
}

const sizeClasses = {
  sm: "w-2 h-2",
  default: "w-2.5 h-2.5",
  lg: "w-3 h-3",
}

export function PaymentStatusIndicator({
  isPaid,
  size = "default",
  className,
  ...props
}: PaymentStatusIndicatorProps) {
  return (
    <div
      className={cn(
        "rounded-full",
        sizeClasses[size],
        isPaid ? "bg-paid" : "bg-unpaid",
        className
      )}
      title={isPaid ? "Proplaceno" : "Neuhrazeno"}
      {...props}
    />
  )
}
