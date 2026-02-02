"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ImageIcon, Download, ExternalLink, Loader2, AlertCircle } from "lucide-react"

interface ReceiptViewDialogProps {
  transactionId: string
  purpose: string
}

export function ReceiptViewDialog({ transactionId: receiptId, purpose }: ReceiptViewDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const imageUrl = `/api/receipts/view?id=${receiptId}`

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary/60 hover:text-primary transition-colors p-0 h-auto"
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="!w-[calc(100vw-24px)] !max-w-[900px] !h-[calc(100vh-48px)] !max-h-[calc(100vh-48px)] flex flex-col p-3 sm:p-4 bg-card border-border">
        <DialogHeader className="flex flex-row items-center justify-between gap-2 pr-8 border-b border-border pb-2 shrink-0">
          <DialogTitle className="text-foreground flex items-center gap-2 text-sm sm:text-base truncate">
            <ImageIcon className="w-4 h-4 text-primary/70 shrink-0" />
            <span className="truncate">{purpose}</span>
          </DialogTitle>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <a href={imageUrl} download={`uctenka-${receiptId}.png`}>
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
          ) : (
            <img
              src={imageUrl}
              alt={`Účtenka k transakci ${purpose}`}
              className={`max-w-full max-h-full w-auto h-auto object-contain transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
