"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

/**
 * FunctionalCheckbox - Semantic checkbox variants for functional states
 * 
 * Uses the design system tokens from globals.css:
 * - paid, filed, default (primary)
 * 
 * @example
 * <FunctionalCheckbox variant="paid" checked={isPaid} onCheckedChange={handleChange} />
 * <FunctionalCheckbox variant="filed" checked={isFiled} onCheckedChange={handleChange} />
 */

export interface FunctionalCheckboxProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Checkbox>, "className"> {
  variant?: "paid" | "filed" | "default"
  className?: string
}

const variantStyles = {
  paid: "data-[state=checked]:bg-paid data-[state=checked]:border-paid data-[state=checked]:text-white",
  filed: "data-[state=checked]:bg-filed data-[state=checked]:border-filed data-[state=checked]:text-white",
  default: "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
}

export function FunctionalCheckbox({
  variant = "default",
  className,
  ...props
}: FunctionalCheckboxProps) {
  return (
    <Checkbox
      className={cn(
        "rounded h-4 w-4 border-muted-foreground/40",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}
