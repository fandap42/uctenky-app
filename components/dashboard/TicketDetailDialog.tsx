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
import { 
  updateReceiptStatus, 
  toggleReceiptPaid, 
  updateReceiptExpenseType,
  payAllReceiptsInTicket,
  deleteReceipt
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

  const handleStatusChange = async (receiptId: string, status: ReceiptStatus) => {
    const result = await updateReceiptStatus(receiptId, status)
    if (result.success) {
      toast.success("Stav účtenky aktualizován")
      window.dispatchEvent(new CustomEvent("app-data-refresh"))
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[100vw] sm:max-w-7xl w-full h-[100dvh] sm:h-[90dvh] flex flex-col p-0 gap-0 overflow-hidden bg-background sm:rounded-[2rem] border-none shadow-2xl">
          
          {/* --- FIXED HEADER --- */}
          <div className="bg-card p-3 sm:p-6 border-b border-border/60 shrink-0 space-y-3 sm:space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-0.5 sm:space-y-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Badge variant="outline" className="rounded-md bg-muted/50 font-bold px-1.5 py-0.5 text-[9px] sm:text-[10px] uppercase tracking-wider">
                    {ticket.section.name}
                  </Badge>
                  <StatusBadge status={ticket.status} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-xl md:text-2xl font-black text-foreground tracking-tight leading-none uppercase">
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
                        <span className="font-medium text-foreground">{ticket.requester.fullName}</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span>{new Date(ticket.createdAt).toLocaleDateString("cs-CZ")}</span>
                      </div>
                    </div>
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Budget Progress Bar */}
            <div className="space-y-1.5 sm:space-y-2 pt-1 sm:pt-2">
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
                 <span className={cn("text-[10px] sm:text-xs font-black", isOverBudget ? "text-destructive" : "text-emerald-600")}>
                    {Math.round(budgetProgress)}%
                 </span>
               </div>
               <Progress 
                  value={budgetProgress} 
                  className={cn(
                    "h-2 sm:h-2.5 rounded-full bg-muted/30", 
                    isOverBudget ? "[&>div]:bg-destructive" : "[&>div]:bg-emerald-500"
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
                <div className="text-center py-20 border border-dashed border-border/60 rounded-xl bg-card text-muted-foreground">
                  <p className="text-sm font-medium">Zatím nebyly nahrány žádné účtenky</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 overflow-hidden bg-card shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent border-border/60">
                        <TableHead className="py-3 px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Datum / Obchod</TableHead>
                        <TableHead className="py-3 px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-right w-[120px]">Částka</TableHead>
                        <TableHead className="py-3 px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center w-[120px]">Typ</TableHead>
                        <TableHead className="py-3 px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center w-[100px]">Přílohy</TableHead>
                        <TableHead className="py-3 px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center w-[100px]">Proplaceno</TableHead>
                        <TableHead className="py-3 px-4 text-right w-[120px]">Akce</TableHead>
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
                              <div className="flex flex-col">
                                <span className={cn("font-semibold text-sm text-foreground truncate max-w-[160px]", isRejected && "line-through")}>{receipt.store}</span>
                                <span className="text-[10px] font-medium text-muted-foreground">{new Date(receipt.date).toLocaleDateString("cs-CZ")}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right">
                              <span className={cn("font-bold tabular-nums text-sm", isRejected && "line-through")}>{receipt.amount.toLocaleString("cs-CZ")} Kč</span>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                              {isAdmin ? (
                                 <div className="flex justify-center">
                                   <Select 
                                     value={receipt.expenseType} 
                                     onValueChange={(v) => handleExpenseTypeChange(receipt.id, v as ExpenseType)}
                                   >
                                     <SelectTrigger className="h-7 w-[90px] text-[10px] font-bold text-xs">
                                       <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent>
                                       <SelectItem value="MATERIAL" className="text-xs">Materiál</SelectItem>
                                       <SelectItem value="SERVICE" className="text-xs">Služba</SelectItem>
                                     </SelectContent>
                                   </Select>
                                 </div>
                              ) : (
                                 <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider px-2 h-5 bg-muted text-muted-foreground border border-border/50">
                                   {receipt.expenseType === "MATERIAL" ? "MAT" : "SLU"}
                                 </Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-3">
                                {isAdmin && <EditNoteDialog receiptId={receipt.id} initialNote={receipt.note} />}
                                <a href={`/api/receipts/view?id=${receipt.id}`} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-600 transition-colors">
                                  <ImageIcon className="w-5 h-5" />
                                </a>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                              {isAdmin ? (
                                <div className="flex justify-center">
                                  <Checkbox 
                                    checked={receipt.isPaid} 
                                    onCheckedChange={(checked) => handleReceiptPaidToggle(receipt.id, !!checked)}
                                    className="rounded h-4 w-4 border-muted-foreground/40 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                    disabled={isRejected}
                                  />
                                </div>
                              ) : (
                                receipt.isPaid ? (
                                  <div className="flex justify-center">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Proplaceno" />
                                  </div>
                                ) : (
                                  <div className="flex justify-center">
                                    <div className="w-2.5 h-2.5 rounded-full bg-orange-300" title="Neuhrazeno" />
                                  </div>
                                )
                              )}
                            </TableCell>
                            <TableCell className="text-right py-3 px-4">
                              <div className="flex items-center justify-end gap-1">
                                {isAdmin && <EditReceiptDialog receipt={receipt} />}
                                <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" title="Zobrazit">
                                  <a href={`/api/receipts/view?id=${receipt.id}`} target="_blank" rel="noreferrer">
                                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                                  </a>
                                </Button>
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-2.5">
              {receipts.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border/60 rounded-xl bg-card text-muted-foreground">
                  <p className="text-xs font-medium">Zatím nebyly nahrány žádné účtenky</p>
                </div>
              ) : (
                receipts.map((receipt) => (
                  <Card key={receipt.id} className={cn("overflow-hidden border-border/60 shadow-none", receipt.status === "REJECTED" && "opacity-60")}>
                    <CardContent className="p-3 flex justify-between items-center gap-3">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[13px] truncate">{receipt.store}</span>
                          <ReceiptStatusBadge status={receipt.status} />
                        </div>
                        <span className="text-[9px] font-medium text-muted-foreground">{new Date(receipt.date).toLocaleDateString("cs-CZ")}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="secondary" className="text-[8px] font-bold h-3.5 px-1.5 uppercase bg-muted/50">
                            {receipt.expenseType === "MATERIAL" ? "MATERIÁL" : "SLUŽBA"}
                          </Badge>
                          {receipt.isPaid ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none h-3.5 px-1.5 text-[8px] font-bold uppercase">Proplaceno</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground border-border/40 h-3.5 px-1.5 text-[8px] font-bold uppercase">Čeká</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="font-black text-sm tabular-nums">{receipt.amount.toLocaleString("cs-CZ")} Kč</span>
                        <div className="flex gap-1.5">
                          {isAdmin && <EditReceiptDialog receipt={receipt} />}
                          {isAdmin && (
                            <Checkbox 
                              checked={receipt.isPaid} 
                              onCheckedChange={(checked) => handleReceiptPaidToggle(receipt.id, !!checked)}
                              className="rounded h-7 w-7 border-muted-foreground/30 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-none"
                            />
                          )}
                          <div className="flex items-center gap-2">
                            {isAdmin && <EditNoteDialog receiptId={receipt.id} initialNote={receipt.note} />}
                            <a href={`/api/receipts/view?id=${receipt.id}`} target="_blank" rel="noreferrer" className="text-emerald-500">
                              <ImageIcon className="w-5 h-5" />
                            </a>
                          </div>
                          {(isOwner && (ticket.status === "APPROVED" || ticket.status === "PENDING_APPROVAL") || isAdmin) && (
                            <Button 
                              variant="outline" size="icon" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10 border-destructive/20"
                              onClick={() => handleDeleteReceipt(receipt.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
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
                          className="h-8 sm:h-9 px-3.5 sm:px-4 text-[10px] sm:text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
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
                            className="h-8 sm:h-9 px-2.5 sm:px-3 text-[10px] sm:text-xs font-bold bg-amber-500 hover:bg-amber-600 text-amber-950"
                            disabled={loading}
                          >
                            Zpět
                          </Button>
                        <Button 
                            onClick={() => handleStatusUpdate("DONE")} 
                            className="h-8 sm:h-9 px-3.5 sm:px-4 text-[10px] sm:text-xs font-bold bg-primary hover:bg-primary/90 text-white"
                            disabled={loading || receipts.some(r => r.status === "PENDING")}
                          >
                            Ukončit
                          </Button>
                      </>
                    )}
                    {ticket.status === "DONE" && (
                      <Button 
                        variant="outline" 
                        className="h-8 sm:h-9 px-3.5 sm:px-4 text-[10px] sm:text-xs font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-50"
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
                      className="h-9 sm:h-12 px-6 sm:px-8 text-[11px] sm:text-base font-black bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-600/30 uppercase tracking-widest ring-2 ring-purple-600/50 ring-offset-2 ring-offset-background"
                      disabled={loading || receipts.length === 0}
                    >
                      Odeslat ke schválení
                    </Button>
                )}

                 {isAdmin && (
                   <div className="flex items-center gap-2 mr-2 border-r border-border/60 pr-4">
                     <div 
                       className="flex items-center space-x-2 cursor-pointer group"
                       onClick={() => handleTicketFiledToggle(!ticket.isFiled)}
                     >
                       <Checkbox 
                         id="ticket-filed" 
                         checked={ticket.isFiled}
                         onCheckedChange={(checked) => handleTicketFiledToggle(!!checked)}
                         disabled={loading}
                         className="data-[state=checked]:bg-[oklch(0.60_0.16_150)] data-[state=checked]:border-[oklch(0.60_0.16_150)]"
                       />
                       <span 
                         className={cn(
                           "text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors",
                           ticket.isFiled ? "text-[oklch(0.60_0.16_150)]" : "text-muted-foreground group-hover:text-foreground"
                         )}
                       >
                         {ticket.isFiled ? <FolderCheck className="w-4 h-4" /> : <FolderX className="w-4 h-4" />}
                         Založeno
                       </span>
                     </div>
                   </div>
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
        <DialogContent className="max-w-[95vw] sm:max-w-[450px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <div className="bg-card p-6 border-b border-border/60">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Plus className="w-5 h-5" />
                </div>
                Nahrát novou účtenku
              </DialogTitle>
              <DialogDescription>
                Vyberte soubor a vyplňte údaje o nákupu.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6">
            <ReceiptUploadForm 
              ticketId={ticket.id} 
              onSuccess={() => {
                setIsUploadOpen(false)
                router.refresh()
              }}
            />
          </div>
          <div className="p-4 bg-muted/30 flex justify-end">
            <Button variant="ghost" onClick={() => setIsUploadOpen(false)} className="font-bold">
              Zrušit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function StatusBadge({ status }: { status: TicketStatus }) {
  switch (status) {
    case "PENDING_APPROVAL":
      return <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 shadow-none px-3 font-bold">Čeká na schválení</Badge>
    case "APPROVED":
      return <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20 shadow-none px-3 font-bold">Schváleno</Badge>
    case "VERIFICATION":
      return <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/20 shadow-none px-3 font-bold">Ověřování</Badge>
    case "DONE":
      return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 shadow-none px-3 font-bold">Hotovo</Badge>
    case "REJECTED":
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20 shadow-none px-3 font-bold text-xs">Zamítnuto</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

function ReceiptStatusBadge({ status }: { status: ReceiptStatus }) {
  switch (status) {
    case "APPROVED":
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
    case "REJECTED":
      return <XCircle className="w-3.5 h-3.5 text-destructive" />
    default:
      return <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
  }
}


