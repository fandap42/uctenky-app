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
import { ImageIcon, Download, ExternalLink, Loader2 } from "lucide-react"

interface ReceiptViewDialogProps {
  transactionId: string
  purpose: string
}

export function ReceiptViewDialog({ transactionId, purpose }: ReceiptViewDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const imageUrl = `/api/receipts/view?id=${transactionId}`

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
      <DialogContent className="max-w-[90vw] w-full max-h-[95vh] h-[95vh] flex flex-col p-4 bg-card border-border">
        <DialogHeader className="flex flex-row items-center justify-between pr-8 border-b border-border pb-3">
          <DialogTitle className="text-foreground flex items-center gap-2 truncate pr-4">
            <ImageIcon className="w-5 h-5 text-primary/70" />
            <span>Účtenka: {purpose}</span>
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 text-xs border-border"
              asChild
            >
              <a href={imageUrl} download={`uctenka-${transactionId}.png`}>
                <Download className="w-3.5 h-3.5" />
                Stáhnout
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 text-xs border-border"
              asChild
            >
              <a href={imageUrl} target="_blank" rel="noopener">
                <ExternalLink className="w-3.5 h-3.5" />
                Nové okno
              </a>
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto mt-4 rounded-md border border-border bg-muted/20 flex items-center justify-center min-h-[300px] relative">
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/50 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          
          {error ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground p-8 text-center">
              <AlertCircle className="w-10 h-10 text-destructive/50" />
              <p className="text-sm font-medium">Soubor účtenky nebyl nalezen</p>
              <p className="text-xs">Pravděpodobně se jedná o vygenerovaná testovací data bez nahraného souboru.</p>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={`Účtenka k transakci ${purpose}`}
              className={`max-w-full h-auto object-contain shadow-lg transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
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
