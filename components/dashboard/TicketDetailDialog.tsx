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
import { StatusBadge, mapTicketStatusToBadge } from "@/components/ui/status-badge"
import { FunctionalCheckbox } from "@/components/ui/functional-checkbox"
import { PaymentStatusIndicator } from "@/components/ui/payment-status-indicator"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ReceiptUploadForm } from "./ReceiptUploadForm"
import { EditNoteDialog } from "./edit-note-dialog"
import { EditTransactionDialog } from "./edit-transaction-dialog"
import { EditReceiptDialog } from "./edit-receipt-dialog"
import { ReceiptViewDialog } from "@/components/receipts/receipt-view-dialog"
import { 
  updateReceiptStatus, 
  toggleReceiptPaid, 
  updateReceiptExpenseType,
  payAllReceiptsInTicket,
  deleteReceipt,
  toggleReceiptFiled
} from "@/lib/actions/receipts"
import { 
  updateTicketStatus, 
  submitForVerification,
  deleteTicket,
  toggleTicketFiled 
} from "@/lib/actions/tickets"
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileText, 
  ImageIcon,
  StickyNote,
  ExternalLink, 
  Trash2, 
  Plus,
  User,
  Calendar,
  FolderCheck,
  FolderX
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
  isFiled: boolean
  note?: string | null
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
  targetDate: string
  isFiled?: boolean
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
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  
  const isAdmin = currentUserRole === "ADMIN"
  const isOwner = ticket?.requesterId === currentUserId

  if (!ticket) return null

  // Always sort receipts by date (chronological)
  const receipts = [...(ticket.receipts || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const totalSpent = receipts.reduce((sum, r) => sum + r.amount, 0)
  const budgetProgress = Math.min((totalSpent / ticket.budgetAmount) * 100, 100)
  const isOverBudget = totalSpent > ticket.budgetAmount

  const handleStatusUpdate = async (status: TicketStatus) => {
    setLoading(true)
    const result = await updateTicketStatus(ticket.id, status)
    if (result.success) {
      toast.success(`Stav žádosti byl změněn na ${status}`)
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
      onOpenChange(false)
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
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
      onOpenChange(false)
      router.refresh()
    } else {
      toast.error(result.error)
    }
    setLoading(false)
  }

  const handleReceiptPaidToggle = async (receiptId: string, isPaid: boolean) => {
    const result = await toggleReceiptPaid(receiptId, isPaid)
    if (result.success) {
      toast.success("Stav proplacení aktualizován")
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleTicketFiledToggle = async (isFiled: boolean) => {
    setLoading(true)
    const result = await toggleTicketFiled(ticket.id, isFiled)
    if (result.success) {
      toast.success(isFiled ? "Označeno jako založeno" : "Označeno jako nezaloženo")
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
      router.refresh()
    } else {
      toast.error(result.error)
    }
    setLoading(false)
  }

  const handleDeleteReceipt = async (receiptId: string) => {
    const result = await deleteReceipt(receiptId)
    if (result.success) {
      toast.success("Účtenka byla smazána")
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
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
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
      router.refresh()
    } else {
      toast.error(result.error)
    }
    setLoading(false)
  }

  const handleTicketDelete = async () => {
    if (confirm("Opravdu chcete smazat celou žádost?")) {
      const result = await deleteTicket(ticket.id)
      if (result.success) {
        toast.success("Žádost byla smazána")
        window.dispatchEvent(new CustomEvent("app-data-refresh"))
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    }
  }

  const handleExpenseTypeChange = async (receiptId: string, type: ExpenseType) => {
    const result = await updateReceiptExpenseType(receiptId, type)
    if (result.success) {
      toast.success("Typ výdaje aktualizován")
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleReceiptFiledToggle = async (receiptId: string, isFiled: boolean) => {
    const result = await toggleReceiptFiled(receiptId, isFiled)
    if (result.success) {
      toast.success(isFiled ? "Označeno jako založeno" : "Označeno jako nezaloženo")
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[calc(100vw-24px)] sm:!max-w-[1400px] !w-full h-[calc(100dvh-32px)] sm:h-[90dvh] flex flex-col p-0 gap-0 overflow-hidden bg-background rounded-2xl sm:rounded-[2rem] border border-border/50 sm:border-none shadow-2xl">
          
          {/* --- FIXED HEADER --- */}
          <div className="bg-card p-3 sm:p-6 border-b border-border/60 shrink-0 space-y-3 sm:space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-0.5 sm:space-y-1">
                <div className="flex items-center gap-2 sm:gap-2 flex-wrap">
                  <Badge variant="outline" className="rounded-md bg-muted/50 font-bold px-1.5 py-0.5 text-[10px] sm:text-[10px] uppercase tracking-wider">
                    {ticket.section.name}
                  </Badge>
                  <StatusBadge status={mapTicketStatusToBadge(ticket.status)} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-lg sm:text-xl md:text-2xl font-black text-foreground tracking-tight leading-none uppercase mt-2">
                      {ticket.purpose}
                    </DialogTitle>
                    {isAdmin && <EditTransactionDialog transaction={ticket as any} />}
                  </div>
                  <DialogDescription asChild className="text-muted-foreground font-medium text-xs md:text-sm mt-1 flex items-center gap-x-3 gap-y-1.5 flex-wrap leading-none">
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{ticket.requester?.fullName || "Smazaný uživatel"}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span>{new Date(ticket.targetDate).toLocaleDateString("cs-CZ")}</span>
                      </div>
                    </div>
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Budget Progress Bar */}
            <div className="space-y-1.5 sm:space-y-2 pt-1 sm:pt-2 max-w-sm">
               <div className="flex justify-between items-end">
                 <div className="flex flex-col">
                   <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Čerpání rozpočtu</span>
                   <div className="flex items-baseline gap-1 sm:gap-1.5">
                     <span className={cn("text-base sm:text-lg font-black tabular-nums", isOverBudget ? "text-destructive" : "text-foreground")}>
                       {totalSpent.toLocaleString()}
                     </span>
                     <span className="text-muted-foreground text-[10px] sm:text-xs font-medium">/ {ticket.budgetAmount.toLocaleString()} Kč</span>
                   </div>
                 </div>
                 <span className={cn("text-[10px] sm:text-xs font-black", isOverBudget ? "text-destructive" : "text-status-success")}>
                    {Math.round(budgetProgress)}%
                 </span>
               </div>
               <Progress 
                  value={budgetProgress} 
                  className={cn(
                    "h-2 sm:h-2.5 rounded-full bg-muted/60 border border-muted", 
                    isOverBudget ? "[&>div]:bg-destructive" : "[&>div]:bg-status-success"
                  )} 
                />
                {isOverBudget && (
                  <p className="text-[9px] sm:text-[10px] font-bold text-destructive flex items-center gap-1 font-mono uppercase tracking-tight">
                    <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    PŘEKROČENO O {(totalSpent - ticket.budgetAmount).toLocaleString()} Kč
                  </p>
                )}
            </div>
          </div>

          {/* --- SCROLLABLE BODY --- */}
          <div className="flex-1 overflow-y-auto bg-muted/5 p-3 sm:p-6 space-y-4 sm:space-y-6">
            
            {/* Desktop Table View */}
            <div className="hidden md:block">
              {receipts.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border/60 rounded-xl bg-card text-muted-foreground">
                  <p className="text-sm font-medium mb-4">Zatím nebyly nahrány žádné účtenky</p>
                  <div className="text-left max-w-2xl mx-auto px-6 space-y-3">
                    <div className="text-xs space-y-3">
                      <div className="space-y-2">
                        <p className="font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Důležité:
                        </p>
                        <ul className="space-y-1.5 text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500 font-bold">•</span>
                            <span>Pouze <strong>platba v hotovosti</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500 font-bold">•</span>
                            <span><strong>Nesmí obsahovat alkohol</strong></span>
                          </li>
                        </ul>
                      </div>
                      <div className="pt-3 border-t border-border/40 space-y-2">
                        <p className="font-semibold">Na účtence MUSÍ být čitelné:</p>
                        <ul className="space-y-1.5 text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Datum nákupu</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Celková částka</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Platba v hotovosti</strong> musí být viditelná na účtence</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Název obchodu</strong></span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 overflow-hidden bg-card shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/80 border-b border-border">
                      <TableRow className="hover:bg-transparent border-border/60">
                        <TableHead className="py-3 px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Datum / Obchod</TableHead>
                        <TableHead className="py-3 px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-right w-[120px]">Částka</TableHead>
                        {isAdmin && <TableHead className="py-3 px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center min-w-[120px]">Typ</TableHead>}
                        <TableHead className="py-3 px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center w-[100px]">Přílohy</TableHead>
                        <TableHead className="py-3 px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center w-[100px]">Proplaceno</TableHead>
                        {isAdmin && <TableHead className="py-3 px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center w-[100px]">Založeno</TableHead>}
                        <TableHead className="py-3 px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-right w-[100px]">Akce</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receipts.map((receipt) => {
                         const isRejected = receipt.status === "REJECTED"
                         return (
                          <TableRow 
                            key={receipt.id} 
                            className={cn(
                                "group border-border/60 transition-colors",
                                isRejected ? "opacity-50 grayscale bg-muted/30" : "hover:bg-muted/30"
                            )}
                          >
                            <TableCell className="py-3 px-4">
                              <div className="flex flex-col min-w-0">
                                <span className={cn("font-semibold text-sm text-foreground truncate max-w-[200px]", isRejected && "line-through")} title={receipt.store}>{receipt.store}</span>
                                <span className="text-xs text-muted-foreground">{new Date(receipt.date).toLocaleDateString("cs-CZ")}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right">
                              <span className={cn("font-bold tabular-nums text-sm", isRejected && "line-through")}>{receipt.amount.toLocaleString("cs-CZ")} Kč</span>
                            </TableCell>
                            {isAdmin && (
                              <TableCell className="py-3 px-4 text-center">
                                <div className="flex justify-center">
                                  <Select 
                                    value={receipt.expenseType} 
                                    onValueChange={(v) => handleExpenseTypeChange(receipt.id, v as ExpenseType)}
                                  >
                                    <SelectTrigger className="h-7 w-[110px] text-xs font-medium">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="MATERIAL" className="text-xs">Materiál</SelectItem>
                                      <SelectItem value="SERVICE" className="text-xs">Služba</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </TableCell>
                            )}
                            <TableCell className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-3">
                                {isAdmin && <EditNoteDialog receiptId={receipt.id} initialNote={receipt.note} />}
                                <ReceiptViewDialog transactionId={receipt.id} purpose={receipt.store} />
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                              {isAdmin ? (
                                <div className="flex justify-center">
                                  <FunctionalCheckbox 
                                    variant="paid"
                                    checked={receipt.isPaid} 
                                    onCheckedChange={(checked: boolean) => handleReceiptPaidToggle(receipt.id, !!checked)}
                                    disabled={isRejected}
                                  />
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <PaymentStatusIndicator isPaid={receipt.isPaid} />
                                </div>
                              )}
                            </TableCell>
                            {isAdmin && (
                              <TableCell className="py-3 px-4 text-center">
                                <div className="flex justify-center">
                                  <FunctionalCheckbox 
                                    variant="filed"
                                    checked={receipt.isFiled} 
                                    onCheckedChange={(checked: boolean) => handleReceiptFiledToggle(receipt.id, !!checked)}
                                    disabled={isRejected}
                                  />
                                </div>
                              </TableCell>
                            )}
                            <TableCell className="text-right py-3 px-4">
                              <div className="flex items-center justify-end gap-1">
                                {isAdmin && <EditReceiptDialog receipt={receipt} />}
                                {(isOwner && (ticket.status === "APPROVED" || ticket.status === "PENDING_APPROVAL") || isAdmin) && (
                                  <Button 
                                    variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteReceipt(receipt.id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Mobile Table View */}
            <div className="md:hidden">
              {receipts.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-border/60 rounded-xl bg-card text-muted-foreground">
                  <p className="text-sm font-medium mb-3">Zatím nebyly nahrány žádné účtenky</p>
                  <div className="text-left px-4 space-y-2">
                    <div className="text-xs space-y-2.5">
                      <div className="space-y-1.5">
                        <p className="font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Důležité:
                        </p>
                        <ul className="space-y-1 text-[11px] text-muted-foreground">
                          <li className="flex items-start gap-1.5">
                            <span className="text-orange-500">•</span>
                            <span>Pouze <strong>platba v hotovosti</strong></span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-orange-500">•</span>
                            <span><strong>Nesmí obsahovat alkohol</strong></span>
                          </li>
                        </ul>
                      </div>
                      <div className="pt-2 border-t border-border/40 space-y-1.5">
                        <p className="font-semibold">Musí být čitelné:</p>
                        <ul className="space-y-1 text-muted-foreground text-[11px]">
                          <li className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Datum nákupu</strong></span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Celková částka</strong></span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Platba v hotovosti</strong></span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Název obchodu</strong></span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 overflow-hidden bg-card shadow-sm overflow-x-auto">
                  <Table className={cn("min-w-[500px]", isAdmin && "min-w-[800px]")}>
                    <TableHeader className="bg-muted/80 border-b border-border">
                      <TableRow className="hover:bg-transparent border-border/60">
                        <TableHead className="py-3 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground">Obchod</TableHead>
                        <TableHead className="py-3 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">Částka</TableHead>
                        {isAdmin && <TableHead className="py-3 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground text-center">Typ</TableHead>}
                        <TableHead className="py-3 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground text-center">Přílohy</TableHead>
                        <TableHead className="py-3 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground text-center">Proplaceno</TableHead>
                        {isAdmin && <TableHead className="py-3 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground text-center">Založeno</TableHead>}
                        <TableHead className="py-3 px-3 font-bold text-xs uppercase tracking-wider text-muted-foreground text-right">Akce</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receipts.map((receipt) => {
                        const isRejected = receipt.status === "REJECTED"
                        return (
                          <TableRow 
                            key={receipt.id} 
                            className={cn(
                              "group border-border/60 transition-colors",
                              isRejected ? "opacity-50 grayscale bg-muted/30" : "hover:bg-muted/30"
                            )}
                          >
                            <TableCell className="py-3 px-3">
                              <div className="flex flex-col min-w-0">
                                <span className={cn("font-semibold text-sm text-foreground truncate", isRejected && "line-through")} title={receipt.store}>{receipt.store}</span>
                                <span className="text-xs text-muted-foreground">{new Date(receipt.date).toLocaleDateString("cs-CZ")}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-3 text-right">
                              <span className={cn("font-bold tabular-nums text-sm", isRejected && "line-through")}>{receipt.amount.toLocaleString("cs-CZ")} Kč</span>
                            </TableCell>
                            {isAdmin && (
                              <TableCell className="py-3 px-3 text-center">
                                <div className="flex justify-center">
                                  <Select 
                                    value={receipt.expenseType} 
                                    onValueChange={(v) => handleExpenseTypeChange(receipt.id, v as ExpenseType)}
                                  >
                                    <SelectTrigger className="h-7 w-[100px] text-xs font-medium">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="MATERIAL" className="text-xs">Materiál</SelectItem>
                                      <SelectItem value="SERVICE" className="text-xs">Služba</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </TableCell>
                            )}
                            <TableCell className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {isAdmin && <EditNoteDialog receiptId={receipt.id} initialNote={receipt.note} />}
                                <ReceiptViewDialog transactionId={receipt.id} purpose={receipt.store} />
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-3 text-center">
                              {isAdmin ? (
                                <div className="flex justify-center">
                                  <FunctionalCheckbox 
                                    variant="paid"
                                    checked={receipt.isPaid} 
                                    onCheckedChange={(checked: boolean) => handleReceiptPaidToggle(receipt.id, !!checked)}
                                    disabled={isRejected}
                                  />
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <PaymentStatusIndicator isPaid={receipt.isPaid} size="lg" />
                                </div>
                              )}
                            </TableCell>
                            {isAdmin && (
                              <TableCell className="py-3 px-3 text-center">
                                <div className="flex justify-center">
                                  <FunctionalCheckbox 
                                    variant="filed"
                                    checked={receipt.isFiled} 
                                    onCheckedChange={(checked: boolean) => handleReceiptFiledToggle(receipt.id, !!checked)}
                                    disabled={isRejected}
                                  />
                                </div>
                              </TableCell>
                            )}
                            <TableCell className="text-right py-3 px-3">
                              <div className="flex items-center justify-end gap-1">
                                {isAdmin && <EditReceiptDialog receipt={receipt} />}
                                {(isOwner && (ticket.status === "APPROVED" || ticket.status === "PENDING_APPROVAL") || isAdmin) && (
                                  <Button 
                                    variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteReceipt(receipt.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Add Receipt Button */}
            {(isAdmin || (ticket.status === "APPROVED" && isOwner)) && (
              <div className="flex justify-center pb-2">
                <Button 
                  onClick={() => setIsUploadOpen(true)}
                  variant="outline"
                  className="rounded-full px-5 h-9 border-dashed border-primary/40 text-primary hover:bg-primary/5 text-xs font-bold flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nahrát účtenku
                </Button>
              </div>
            )}
          </div>

          {/* --- FIXED FOOTER (Action Bar) --- */}
          <div className="bg-card/80 backdrop-blur-md p-3 sm:p-4 border-t border-border/60 shrink-0 flex items-center justify-between gap-2 pb-[calc(12px+env(safe-area-inset-bottom))] sm:pb-4">
             <div className="flex items-center gap-2">
               {isAdmin && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleTicketDelete}
                    className="h-8 w-8 sm:h-9 sm:w-9 text-destructive hover:bg-destructive/10"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </Button>
               )}
             </div>

             <div className="flex items-center gap-1.5 sm:gap-2">
                {isAdmin && (
                  <>
                    {ticket.status === "PENDING_APPROVAL" && (
                      <>
                        <Button 
                          variant="outline"
                          onClick={() => handleStatusUpdate("REJECTED")} 
                          className="h-8 sm:h-9 px-2.5 sm:px-3 text-[10px] sm:text-xs font-bold border-destructive/20 text-destructive hover:bg-destructive/5"
                          disabled={loading}
                        >
                          Zamítnout
                        </Button>
                        <Button 
                          onClick={() => handleStatusUpdate("APPROVED")} 
                          className="h-8 sm:h-9 px-3.5 sm:px-4 text-[10px] sm:text-xs font-bold bg-status-success hover:bg-status-success/90 text-status-success-foreground"
                          disabled={loading}
                        >
                          Schválit
                        </Button>
                      </>
                    )}
                    {ticket.status === "VERIFICATION" && (
                      <>
                        <Button 
                            onClick={() => handleStatusUpdate("APPROVED")} 
                            className="h-8 sm:h-9 px-2.5 sm:px-3 text-[10px] sm:text-xs font-bold bg-status-pending hover:bg-status-pending/90 text-status-pending-foreground"
                            disabled={loading}
                          >
                            Zpět
                          </Button>
                         <Button 
                            onClick={() => handleStatusUpdate("DONE")} 
                            className="h-8 sm:h-9 px-3.5 sm:px-4 text-[10px] sm:text-xs font-bold bg-primary hover:bg-primary/90 text-white"
                            disabled={loading}
                          >
                            Ověřit
                          </Button>
                      </>
                    )}
                    {ticket.status === "DONE" && (
                      <Button 
                        variant="outline" 
                        className="h-8 sm:h-9 px-3.5 sm:px-4 text-[10px] sm:text-xs font-bold text-status-success border-status-success/30 hover:bg-status-success-muted"
                        onClick={handlePayAll}
                        disabled={loading}
                      >
                        Proplatit vše
                      </Button>
                    )}
                  </>
                )}
                
                {isOwner && ticket.status === "APPROVED" && (
                    <Button 
                      onClick={handleSubmitForVerification}
                      className="h-8 sm:h-9 px-3.5 sm:px-4 text-[10px] sm:text-xs font-bold bg-status-verification hover:bg-status-verification/90 text-status-verification-foreground"
                      disabled={loading || receipts.length === 0}
                    >
                      Odeslat ke schválení
                    </Button>
                )}


                <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-8 sm:h-9 px-2.5 sm:px-3 text-[10px] sm:text-xs font-bold text-muted-foreground">
                  Zavřít
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- NESTED UPLOAD DIALOG --- */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[420px] max-h-[80dvh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Plus className="w-4 h-4" />
              </div>
              Nahrát účtenku
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 -mx-6 px-6 pb-2">
            <ReceiptUploadForm 
              ticketId={ticket.id} 
              onSuccess={() => {
                setIsUploadOpen(false)
                router.refresh()
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ReceiptStatusBadge({ status }: { status: ReceiptStatus }) {
  switch (status) {
    case "APPROVED":
      return <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
    case "REJECTED":
      return <XCircle className="w-3.5 h-3.5 text-destructive" />
    default:
      return <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
  }
}
