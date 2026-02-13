"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ImageIcon, Download, ExternalLink, Loader2, AlertCircle, FileText } from "lucide-react"

interface ReceiptViewDialogProps {
  transactionId: string
  purpose: string
  date?: string | Date | null
  amount?: number | null
  currency?: string
}

export function ReceiptViewDialog({ transactionId: receiptId, purpose, date, amount, currency = "Kč" }: ReceiptViewDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isPdf, setIsPdf] = useState(false)
  const imageUrl = `/api/receipts/view?id=${receiptId}`
  const formattedDate = date ? new Date(date).toLocaleDateString("cs-CZ") : null
  const formattedAmount = typeof amount === "number" && !Number.isNaN(amount)
    ? `${Math.abs(amount).toLocaleString("cs-CZ")} ${currency}`
    : null
  const titleParts = [purpose, formattedDate, formattedAmount].filter(Boolean)

  // Check if the file is PDF by fetching headers
  const checkFileType = async () => {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' })
      const contentType = response.headers.get('Content-Type') || ''
      setIsPdf(contentType.includes('application/pdf'))
    } catch {
      // Default to image if we can't determine
      setIsPdf(false)
    } finally {
      setLoading(false)
    }
  }

  // Detect file type when dialog opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setLoading(true)
      checkFileType()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary/60 hover:text-primary transition-colors p-0 h-auto"
        >
          {isPdf ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="!w-[calc(100vw-24px)] !max-w-[900px] !h-[calc(100vh-48px)] !max-h-[calc(100vh-48px)] flex flex-col p-3 sm:p-4 bg-card border-border">
        <DialogHeader className="flex flex-row items-center justify-between gap-2 pr-8 border-b border-border pb-2 shrink-0">
          <DialogTitle className="text-foreground flex items-center gap-2 text-sm sm:text-base truncate">
            {isPdf ? <FileText className="w-4 h-4 text-primary/70 shrink-0" /> : <ImageIcon className="w-4 h-4 text-primary/70 shrink-0" />}
            <span className="truncate">{titleParts.join(" | ")}</span>
          </DialogTitle>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <a href={imageUrl} download={`uctenka-${receiptId}${isPdf ? '.pdf' : '.png'}`}>
                <Download className="w-4 h-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <a href={imageUrl} target="_blank" rel="noopener">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto mt-2 rounded-md bg-muted/10 flex items-center justify-center relative min-h-0">
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/50 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          
          {error ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground p-8 text-center">
              <AlertCircle className="w-10 h-10 text-destructive/50" />
              <p className="text-sm font-medium">Soubor účtenky nebyl nalezen</p>
            </div>
          ) : isPdf ? (
            <div className="flex flex-col items-center gap-4 p-8 text-center">
              <FileText className="w-16 h-16 text-primary/50" />
              <p className="text-sm font-medium text-foreground">PDF soubor s účtenkou</p>
              <p className="text-xs text-muted-foreground">Klikněte na ikonu {'\u2197'} pro otevření v novém okně</p>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <Image
                src={imageUrl}
                alt={`Účtenka k transakci ${purpose}`}
                fill
                className={`object-contain transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}
                sizes="100vw"
                unoptimized
                onLoadingComplete={() => setLoading(false)}
                onError={() => {
                  setLoading(false)
                  setError(true)
                }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
