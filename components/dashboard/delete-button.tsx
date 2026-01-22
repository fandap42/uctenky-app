"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DeleteButtonProps {
  onDelete: () => Promise<{ error?: string; success?: boolean }>
  title?: string
  description?: string
  className?: string
  iconOnly?: boolean
  variant?: "trash" | "undo"
}

export function DeleteButton({
  onDelete,
  title = "Opravdu smazat?",
  description = "Tato akce je nevratná.",
  className = "",
  iconOnly = false,
  variant = "trash",
}: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setIsDeleting(true)
    const result = await onDelete()
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("HOTOVO: Smazáno")
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
    }
    setIsDeleting(false)
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {iconOnly ? (
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 rounded-full transition-colors ${
              variant === "undo" 
                ? "text-muted-foreground hover:text-primary hover:bg-primary/10" 
                : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            } ${className}`}
            disabled={isDeleting}
            title={title}
          >
            {variant === "undo" ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </Button>
        ) : (
          <Button
            variant={variant === "undo" ? "outline" : "destructive"}
            size="sm"
            className={`h-8 px-3 text-xs font-bold rounded-md ${className}`}
            disabled={isDeleting}
          >
            {isDeleting ? "Mažu..." : variant === "undo" ? "Vrátit" : "Smazat"}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-muted text-foreground border-border hover:bg-muted/80">Zrušit</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-white hover:bg-destructive/90 border-none"
          >
            Smazat
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
