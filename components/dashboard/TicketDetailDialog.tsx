"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { TicketStatus, ReceiptStatus, ExpenseType } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { ReceiptUploadForm } from "./ReceiptUploadForm"
import { 
  updateTicketStatus, 
  submitForVerification,
  deleteTicket 
} from "@/lib/actions/tickets"
import { 
  updateReceiptStatus, 
  updateReceiptPaidStatus, 
  updateReceiptExpenseType,
  payAllReceiptsInTicket,
  deleteReceipt
} from "@/lib/actions/receipts"
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileText, 
  ExternalLink, 
  Trash2, 
  Check, 
  X,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Receipt {
  id: string
  store: string
  date: string
  amount: number
  fileUrl: string
  isPaid: boolean
  expenseType: ExpenseType
  status: ReceiptStatus
}

interface Ticket {
  id: string
  purpose: string
  budgetAmount: number
  status: TicketStatus
  requesterId: string
  requester: { fullName: string }
  sectionId: string
  section: { name: string }
  receipts: Receipt[]
  createdAt: string
}

interface TicketDetailDialogProps {
  ticket: Ticket | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserRole: string
  currentUserId: string
}

export function TicketDetailDialog({ 
  ticket, 
  open, 
  onOpenChange,
  currentUserRole,
  currentUserId
}: TicketDetailDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isAdmin = currentUserRole === "ADMIN"
  const isOwner = ticket?.requesterId === currentUserId

  if (!ticket) return null

  const totalSpent = ticket.receipts.reduce((sum, r) => sum + r.amount, 0)
  const budgetProgress = Math.min((totalSpent / ticket.budgetAmount) * 100, 100)
  const isOverBudget = totalSpent > ticket.budgetAmount

  const handleStatusUpdate = async (status: TicketStatus) => {
    setLoading(true)
    const result = await updateTicketStatus(ticket.id, status)
    if (result.success) {
      toast.success(`Stav žádosti byl změněn na ${status}`)
      router.refresh()
    } else {
      toast.error(result.error)
    }
    setLoading(false)
  }

  const handleSubmitForVerification = async () => {
    setLoading(true)
    const result = await submitForVerification(ticket.id)
    if (result.success) {
      toast.success("Žádost byla odeslána k ověření")
      router.refresh()
    } else {
      toast.error(result.error)
    }
    setLoading(false)
  }

  const handleReceiptStatusUpdate = async (receiptId: string, status: ReceiptStatus) => {
    const result = await updateReceiptStatus(receiptId, status)
    if (result.success) {
      toast.success("Stav účtenky aktualizován")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleReceiptPaidToggle = async (receiptId: string, isPaid: boolean) => {
    const result = await updateReceiptPaidStatus(receiptId, isPaid)
    if (result.success) {
      toast.success("Stav proplacení aktualizován")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handlePayAll = async () => {
    setLoading(true)
    const result = await payAllReceiptsInTicket(ticket.id)
    if (result.success) {
      toast.success("Všechny účtenky byly označeny jako proplacené")
      router.refresh()
    } else {
      toast.error(result.error)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
        <div className="flex flex-col h-[90vh]">
          {/* Header */}
          <div className="bg-card p-8 pb-4">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline" className="rounded-full bg-muted/50 border-border/50 font-bold px-3">
                    {ticket.section.name}
                  </Badge>
                  <StatusBadge status={ticket.status} />
                </div>
                <DialogTitle className="text-3xl font-black">{ticket.purpose}</DialogTitle>
                <DialogDescription className="mt-1">
                  Žadatel: <span className="font-bold text-foreground">{ticket.requester.fullName}</span> • 
                  Vytvořeno: {new Date(ticket.createdAt).toLocaleDateString("cs-CZ")}
                </DialogDescription>
              </div>
              
              <div className="text-right">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Schválený Budget</p>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-3xl font-black tabular-nums">{ticket.budgetAmount.toLocaleString()}</span>
                  <span className="text-sm font-bold text-muted-foreground uppercase">Kč</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                <span className={cn(isOverBudget ? "text-destructive" : "text-muted-foreground")}>
                  Čerpáno: {totalSpent.toLocaleString()} Kč
                </span>
                <span className="text-muted-foreground">
                  Zbývá: {Math.max(0, ticket.budgetAmount - totalSpent).toLocaleString()} Kč
                </span>
              </div>
              <Progress 
                value={budgetProgress} 
                className={cn(
                  "h-2 rounded-full bg-muted",
                  isOverBudget ? "[&>div]:bg-destructive" : "[&>div]:bg-emerald-500"
                )} 
              />
            </div>
          </div>

          <Separator />

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* User Upload Section */}
            {(ticket.status === "APPROVED" || isAdmin) && isOwner && (
              <section className="space-y-4">
                <h3 className="text-lg font-bold">Nahrát novou účtenku</h3>
                <ReceiptUploadForm ticketId={ticket.id} />
              </section>
            )}

            {/* Receipts List */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Účtenky v žádosti</h3>
                {isAdmin && ticket.status === "DONE" && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full h-8 text-xs font-bold border-orange-500/50 text-orange-600 hover:bg-orange-50"
                    onClick={handlePayAll}
                    disabled={loading}
                  >
                    Proplatit vše
                  </Button>
                )}
              </div>

              {ticket.receipts.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-[2rem] border-2 border-dashed border-border/50 text-muted-foreground">
                  Zatím nebyly nahrány žádné účtenky
                </div>
              ) : (
                <div className="rounded-[2rem] border border-border/50 overflow-hidden bg-card shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead className="py-4 font-bold text-xs uppercase tracking-wider">Datum / Obchod</TableHead>
                        <TableHead className="py-4 font-bold text-xs uppercase tracking-wider">Částka</TableHead>
                        <TableHead className="py-4 font-bold text-xs uppercase tracking-wider">Typ</TableHead>
                        <TableHead className="py-4 font-bold text-xs uppercase tracking-wider">Stav</TableHead>
                        <TableHead className="py-4 font-bold text-xs uppercase tracking-wider">Proplaceno</TableHead>
                        <TableHead className="py-4 text-right pr-6"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ticket.receipts.map((receipt) => (
                        <TableRow key={receipt.id} className="group border-border/50">
                          <TableCell className="py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{receipt.store}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(receipt.date).toLocaleDateString("cs-CZ")}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-black tabular-nums">{receipt.amount.toLocaleString()} Kč</span>
                          </TableCell>
                          <TableCell>
                            {isAdmin ? (
                               <SelectExpenseType 
                                 value={receipt.expenseType} 
                                 onChange={(v) => updateReceiptExpenseType(receipt.id, v)} 
                               />
                            ) : (
                               <Badge variant="outline" className="text-[10px] uppercase">{receipt.expenseType === "MATERIAL" ? "Materiál" : "Služba"}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                             <div className="flex items-center gap-2">
                               <ReceiptStatusIcon status={receipt.status} />
                               {isAdmin && ticket.status === "VERIFICATION" && (
                                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                      size="icon" variant="ghost" className="h-7 w-7 rounded-full text-emerald-600 hover:bg-emerald-50"
                                      onClick={() => handleReceiptStatusUpdate(receipt.id, "APPROVED")}
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="icon" variant="ghost" className="h-7 w-7 rounded-full text-destructive hover:bg-red-50"
                                      onClick={() => handleReceiptStatusUpdate(receipt.id, "REJECTED")}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                 </div>
                               )}
                             </div>
                          </TableCell>
                          <TableCell>
                            {isAdmin ? (
                              <Checkbox 
                                checked={receipt.isPaid} 
                                onCheckedChange={(checked) => handleReceiptPaidToggle(receipt.id, !!checked)}
                                className="rounded-md h-5 w-5"
                              />
                            ) : (
                              receipt.isPaid ? (
                                <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 shadow-none border-none py-0 h-5 text-[10px]">ANO</Badge>
                              ) : (
                                <Badge className="bg-orange-500/10 text-orange-700 hover:bg-orange-500/20 shadow-none border-none py-0 h-5 text-[10px]">NE</Badge>
                              )
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex items-center justify-end gap-2">
                              <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <a href={`/api/proxy?url=${encodeURIComponent(receipt.fileUrl)}`} target="_blank" rel="noreferrer">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                              {(isOwner && ticket.status === "APPROVED" || isAdmin) && (
                                <Button 
                                  variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:bg-red-50"
                                  onClick={() => deleteReceipt(receipt.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </div>

          <Separator />

          {/* Actions Footer */}
          <div className="bg-muted/30 p-8 flex items-center justify-between">
             <div className="flex gap-2">
               {isAdmin && (
                 <>
                   {ticket.status === "PENDING_APPROVAL" && (
                     <>
                      <Button 
                        onClick={() => handleStatusUpdate("APPROVED")} 
                        className="rounded-2xl h-11 px-6 font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                        disabled={loading}
                      >
                        Schválit žádost
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => deleteTicket(ticket.id).then(() => { onOpenChange(false); router.refresh(); })}
                        className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-red-500/20"
                        disabled={loading}
                      >
                        Zamítnout
                      </Button>
                     </>
                   )}
                   {ticket.status === "VERIFICATION" && (
                     <Button 
                        onClick={() => handleStatusUpdate("DONE")} 
                        className="rounded-2xl h-11 px-6 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                        disabled={loading || ticket.receipts.some(r => r.status === "PENDING")}
                      >
                        Dokončit verifikaci
                      </Button>
                   )}
                 </>
               )}
               {isOwner && ticket.status === "APPROVED" && (
                  <Button 
                    onClick={handleSubmitForVerification}
                    className="rounded-2xl h-11 px-8 font-black uppercase tracking-wider bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/20"
                    disabled={loading || ticket.receipts.length === 0}
                  >
                    Odeslat ke kontrole
                  </Button>
               )}
             </div>
             <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl h-11 px-6 font-bold">
               Zavřít
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatusBadge({ status }: { status: TicketStatus }) {
  switch (status) {
    case "PENDING_APPROVAL":
      return <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 shadow-none px-3 font-bold">Čeká na schválení</Badge>
    case "APPROVED":
      return <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20 shadow-none px-3 font-bold">Schváleno / Nahrávání</Badge>
    case "VERIFICATION":
      return <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/20 shadow-none px-3 font-bold">Ověřování</Badge>
    case "DONE":
      return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 shadow-none px-3 font-bold">Hotovo</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

function ReceiptStatusIcon({ status }: { status: ReceiptStatus }) {
  switch (status) {
    case "APPROVED":
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    case "REJECTED":
      return <XCircle className="w-5 h-5 text-destructive" />
    default:
      return <Clock className="w-5 h-5 text-muted-foreground/50" />
  }
}

function SelectExpenseType({ value, onChange }: { value: ExpenseType, onChange: (v: ExpenseType) => void }) {
  return (
    <div className="flex gap-1">
      <Button 
        variant={value === "MATERIAL" ? "default" : "outline"} 
        size="sm" className="h-7 px-2 text-[10px] rounded-md font-bold"
        onClick={() => onChange("MATERIAL")}
      >
        MAT
      </Button>
      <Button 
        variant={value === "SERVICE" ? "default" : "outline"} 
        size="sm" className="h-7 px-2 text-[10px] rounded-md font-bold"
        onClick={() => onChange("SERVICE")}
      >
        SLU
      </Button>
    </div>
  )
}
