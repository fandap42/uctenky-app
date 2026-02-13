"use client"

import { useState, useEffect, useMemo } from "react"
import { QRCodeSVG } from "qrcode.react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getUserBankAccountForQR } from "@/lib/actions/bank-account"
import { generateSPDString } from "@/lib/utils/spd"
import { formatCzechAccountNumber } from "@/lib/utils/iban"
import { QrCode, AlertCircle } from "lucide-react"

interface QRPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketId: string
  requesterId: string | null
  purpose: string
  totalReceiptsAmount: number
}

export function QRPaymentDialog({
  open,
  onOpenChange,
  requesterId,
  purpose,
  totalReceiptsAmount,
}: QRPaymentDialogProps) {
  const [bankAccount, setBankAccount] = useState<{
    accountNumber: string
    prefix: string | null
    bankCode: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overrideAmount, setOverrideAmount] = useState<string>("")

  useEffect(() => {
    if (!open) return

    async function loadData() {
      if (!requesterId) {
        setLoading(false)
        setError("Žádost nemá přiřazeného žadatele")
        return
      }

      setLoading(true)
      setError(null)
      setBankAccount(null)
      const result = await getUserBankAccountForQR(requesterId)
      if (result.error) {
        setError(result.error)
      } else if (!result.hasBankAccount) {
        setError("Žadatel nemá zadané bankovní údaje")
      } else {
        setBankAccount(result.bankAccount!)
        setOverrideAmount(totalReceiptsAmount.toString())
      }
      setLoading(false)
    }

    loadData()
  }, [open, requesterId, totalReceiptsAmount])

  const spdString = useMemo(() => {
    if (!bankAccount?.bankCode) return ""

    const amount = overrideAmount ? parseFloat(overrideAmount) : totalReceiptsAmount
    if (isNaN(amount) || amount <= 0) return ""

    return generateSPDString({
      bankCode: bankAccount.bankCode,
      accountNumber: bankAccount.accountNumber,
      prefix: bankAccount.prefix || undefined,
      amount,
      message: purpose,
    })
  }, [bankAccount, overrideAmount, totalReceiptsAmount, purpose])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <QrCode className="w-4 h-4" />
            </div>
            QR platba
          </DialogTitle>
          <DialogDescription>
            Naskenujte QR kód v mobilní bankovní aplikaci.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            Načítám...
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Účet příjemce: </span>
              {formatCzechAccountNumber(
                bankAccount!.accountNumber,
                bankAccount!.bankCode!,
                bankAccount!.prefix || undefined
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="qr-amount" className="text-foreground">
                Částka (Kč)
              </Label>
              <Input
                id="qr-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={overrideAmount}
                onChange={(e) => setOverrideAmount(e.target.value)}
                className="bg-background border-border text-foreground tabular-nums"
              />
              {parseFloat(overrideAmount) !== totalReceiptsAmount && (
                <p className="text-xs text-muted-foreground">
                  Původní součet účtenek: {totalReceiptsAmount.toLocaleString("cs-CZ")} Kč
                </p>
              )}
            </div>

            {spdString && (
              <div className="flex justify-center p-4 bg-white rounded-xl">
                <QRCodeSVG
                  value={spdString}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
            )}

            <div className="text-xs text-muted-foreground text-center">
              Zpráva pro příjemce: <span className="font-medium">{purpose.slice(0, 60)}</span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zavřít
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
