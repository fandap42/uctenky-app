"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react"
import { useReceiptUpload } from "@/hooks/useReceiptUpload"

interface ReceiptUploadProps {
  transactionId: string
}

export function ReceiptUpload({ transactionId }: ReceiptUploadProps) {
  const [open, setOpen] = useState(false)
  
  const {
    state,
    fileInputRef,
    updateState,
    handleFileChange,
    handleUpload,
  } = useReceiptUpload({
    transactionId,
    onSuccess: () => setOpen(false),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Nahrát účtenku
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Nahrát účtenku</DialogTitle>
          <DialogDescription className="text-slate-400">
            Nahrajte fotografii účtenky a zadejte skutečnou částku
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File input */}
          <div className="space-y-2">
            <Label htmlFor="receipt" className="text-slate-300">
              Účtenka (obrázek)
            </Label>
            <div
              className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {state.preview ? (
                <div className="space-y-2">
                  <img
                    src={state.preview}
                    alt="Náhled účtenky"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  <p className="text-sm text-slate-400">{state.file?.name}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 mx-auto text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-slate-400">Klikněte pro výběr obrázku</p>
                  <p className="text-xs text-slate-500">PNG, JPG, HEIC do 5 MB</p>
                </div>
              )}
            </div>
            <Input
              ref={fileInputRef}
              id="receipt"
              type="file"
              accept="image/*,.heic,.heif"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Store name */}
          <div className="space-y-2">
            <Label htmlFor="store" className="text-slate-300">
              Obchod
            </Label>
            <Input
              id="store"
              type="text"
              value={state.store}
              onChange={(e) => updateState({ store: e.target.value })}
              placeholder="Např. Lidl, Alza..."
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          {/* Purchase date */}
          <div className="space-y-2">
            <Label htmlFor="purchaseDate" className="text-slate-300">
              Datum nákupu (z účtenky) *
            </Label>
            <Input
              id="purchaseDate"
              type="date"
              value={state.purchaseDate}
              onChange={(e) => updateState({ purchaseDate: e.target.value })}
              required
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          {/* Final amount */}
          <div className="space-y-2">
            <Label htmlFor="finalAmount" className="text-slate-300">
              Skutečná částka (Kč)
            </Label>
            <Input
              id="finalAmount"
              type="number"
              step="0.01"
              value={state.finalAmount}
              onChange={(e) => updateState({ finalAmount: e.target.value })}
              placeholder="0.00"
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          {/* Progress bar */}
          {state.uploading && (
            <div className="space-y-2">
              <Progress value={state.progress} className="h-2" />
              <p className="text-xs text-center text-slate-400">
                Nahrávání... {state.progress}%
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={state.uploading}
              className="text-slate-400 hover:text-white"
            >
              Zrušit
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!state.file || state.uploading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {state.uploading ? "Nahrávám..." : "Nahrát"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
