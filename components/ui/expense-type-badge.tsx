"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * ExpenseTypeBadge - A semantic badge component for expense types
 * 
 * Uses the design system tokens from globals.css:
 * - expense-material, expense-service
 * 
 * @example
 * <ExpenseTypeBadge type="material">Materiál</ExpenseTypeBadge>
 * <ExpenseTypeBadge type="service">Služba</ExpenseTypeBadge>
 */

const expenseTypeBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-badge font-bold border-none whitespace-nowrap min-w-[100px] max-w-[140px] truncate",
  {
    variants: {
      type: {
        material: "bg-expense-material text-expense-material-foreground",
        service: "bg-expense-service text-expense-service-foreground",
      },
      size: {
        default: "h-5",
        sm: "h-4 text-[9px] px-1.5 min-w-[80px]",
        lg: "h-6 text-xs px-3 min-w-[120px]",
      }
    },
    defaultVariants: {
      type: "material",
      size: "default",
    },
  }
)

export interface ExpenseTypeBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof expenseTypeBadgeVariants> {
  /** Override the default label with custom content */
  children?: React.ReactNode
}

/**
 * Default labels for each expense type (Czech localization)
 */
const defaultLabels: Record<NonNullable<VariantProps<typeof expenseTypeBadgeVariants>["type"]>, string> = {
  material: "Materiál",
  service: "Služba",
}

export function ExpenseTypeBadge({
  className,
  type = "material",
  size,
  children,
  ...props
}: ExpenseTypeBadgeProps) {
  const label = children ?? defaultLabels[type ?? "material"]
  return (
    <span
      data-slot="expense-type-badge"
      data-type={type}
      title={typeof label === "string" ? label : defaultLabels[type ?? "material"]}
      className={cn(expenseTypeBadgeVariants({ type, size, className }))}
      {...props}
    >
      {label}
    </span>
  )
}

/**
 * Helper to map ExpenseType enum values to ExpenseTypeBadge type prop
 */
export function mapExpenseTypeToVariant(expenseType: string): VariantProps<typeof expenseTypeBadgeVariants>["type"] {
  const mapping: Record<string, VariantProps<typeof expenseTypeBadgeVariants>["type"]> = {
    MATERIAL: "material",
    SERVICE: "service",
  }
  return mapping[expenseType] ?? "material"
}

export { expenseTypeBadgeVariants }
