"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CZECH_BANKS } from "@/lib/constants/czech-banks"
import { saveBankAccount, getBankAccount } from "@/lib/actions/bank-account"
import { toast } from "sonner"
import { AlertCircle } from "lucide-react"

interface BankAccountFormProps {
  onSuccess?: () => void
  onSkip?: () => void
  showSkip?: boolean
  loadExisting?: boolean
}

export function BankAccountForm({
  onSuccess,
  onSkip,
  showSkip = false,
  loadExisting = false,
}: BankAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [prefix, setPrefix] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [bankCode, setBankCode] = useState("")

  useEffect(() => {
    if (loadExisting) {
      loadBankAccount()
    }
  }, [loadExisting])

  async function loadBankAccount() {
    setIsLoadingData(true)
    const result = await getBankAccount()
    if (result.bankAccount) {
      setPrefix(result.bankAccount.prefix || "")
      setAccountNumber(result.bankAccount.accountNumber)
      setBankCode(result.bankAccount.bankCode || "")
    }
    setIsLoadingData(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const result = await saveBankAccount({
      prefix: prefix || undefined,
      accountNumber,
      bankCode,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Bankovní údaje byly uloženy")
      onSuccess?.()
    }
    setIsLoading(false)
  }

  if (isLoadingData) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Načítám bankovní údaje...
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-primary font-medium">
          Podporujeme pouze české bankovní účty (formát: předčíslí-číslo účtu/kód banky)
        </p>
      </div>

      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <div className="space-y-2">
          <Label htmlFor="prefix">Předčíslí</Label>
          <Input
            id="prefix"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            inputMode="numeric"
            className="bg-background border-border text-foreground tabular-nums"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountNumber">Číslo účtu *</Label>
          <Input
            id="accountNumber"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="1234567890"
            required
            maxLength={10}
            inputMode="numeric"
            className="bg-background border-border text-foreground tabular-nums"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bankCode">Kód banky *</Label>
        <Select value={bankCode} onValueChange={setBankCode} required>
          <SelectTrigger className="bg-background border-border text-foreground">
            <SelectValue placeholder="Vyberte banku" />
          </SelectTrigger>
          <SelectContent>
            {CZECH_BANKS.map((bank) => (
              <SelectItem key={bank.code} value={bank.code} className="text-sm">
                {bank.code} – {bank.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
        {showSkip && (
          <Button type="button" variant="ghost" onClick={onSkip} className="flex-1">
            Přeskočit
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading || !accountNumber || !bankCode}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isLoading ? "Ukládám..." : "Uložit"}
        </Button>
      </div>
    </form>
  )
}
