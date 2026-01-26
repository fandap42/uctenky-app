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
      <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-full h-[95vh] flex flex-col p-0 gap-0 rounded-[1.5rem] border-none shadow-2xl overflow-hidden bg-background">
        <div className="flex flex-col h-full w-full">
          {/* ... Header & Budget Grid remain same ... */}
          
          {/* 1. Header Section (Fixed Top) */}
          <div className="bg-card p-6 border-b border-border/60 shrink-0">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-md bg-muted/50 font-bold px-2 py-0.5 text-[10px] uppercase tracking-wider">
                    {ticket.section.name}
                  </Badge>
                  <StatusBadge status={ticket.status} />
                  <span className="text-[10px] text-muted-foreground font-mono ml-2">#{ticket.id.slice(-6)}</span>
                </div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">{ticket.purpose}</DialogTitle>
                
                {/* Visual Summary Bar */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{ticket.requester.fullName}</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span>{new Date(ticket.createdAt).toLocaleDateString("cs-CZ")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto bg-muted/5 p-6 space-y-8">
            
            {/* 2. Budget Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Limit vs Spent */}
              <div className="bg-card rounded-xl border border-border/60 p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Limit vs. Čerpáno</span>
                  <span className={cn("text-xs font-bold", isOverBudget ? "text-destructive" : "text-emerald-600")}>
                    {Math.round(budgetProgress)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                     <span className="text-2xl font-bold tabular-nums text-foreground">{ticket.budgetAmount.toLocaleString()} <span className="text-sm text-muted-foreground">Kč</span></span>
                     <span className="text-sm font-medium text-muted-foreground">limit</span>
                  </div>
                  <Progress 
                    value={budgetProgress} 
                    className={cn(
                      "h-2", 
                      isOverBudget ? "[&>div]:bg-destructive" : "[&>div]:bg-emerald-500"
                    )} 
                  />
                  <div className="flex justify-between pt-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Vyčerpáno</span>
                    <span className="text-sm font-bold tabular-nums">{totalSpent.toLocaleString()} Kč</span>
                  </div>
                </div>
              </div>

              {/* Remaining Budget */}
              <div className={cn(
                "rounded-xl border border-border/60 p-4 shadow-sm flex flex-col justify-center",
                isOverBudget ? "bg-red-50/50 border-red-200" : "bg-emerald-50/50 border-emerald-200"
              )}>
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Zbývá k čerpání</span>
                 <div className="flex items-baseline gap-1">
                   <span className={cn(
                     "text-3xl font-black tabular-nums",
                     isOverBudget ? "text-destructive" : "text-emerald-700"
                   )}>
                     {Math.max(0, ticket.budgetAmount - totalSpent).toLocaleString()}
                   </span>
                   <span className={cn(
                     "text-sm font-bold uppercase",
                     isOverBudget ? "text-destructive" : "text-emerald-700"
                   )}>
                     Kč
                   </span>
                 </div>
                 {isOverBudget && (
                   <span className="text-[10px] font-bold text-destructive mt-1 flex items-center gap-1">
                     <AlertCircle className="w-3 h-3" />
                     Překročení rozpočtu
                   </span>
                 )}
              </div>
            </div>

            {/* 3. Receipts Section */}
            <section className="space-y-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary rounded-full"/>
                  Nahrané účtenku
                </h3>
                <p className="text-sm text-muted-foreground ml-3">Seznam všech dokladů k této žádosti</p>
              </div>

              {/* User Upload (Conditional) */}
              {(ticket.status === "APPROVED" || isAdmin) && isOwner && (
                <div className="bg-card border border-border/60 rounded-xl p-4 mb-6">
                  <ReceiptUploadForm ticketId={ticket.id} />
                </div>
              )}
              
              {ticket.receipts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border/60 rounded-xl bg-card text-muted-foreground">
                  <p className="text-sm font-medium">Zatím nebyly nahrány žádné účtenky</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 overflow-hidden bg-card shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent border-border/60">
                        <TableHead className="py-3 px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground w-[180px]">Datum / Obchod</TableHead>
                        <TableHead className="py-3 px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-right w-[120px]">Částka</TableHead>
                        <TableHead className="py-3 px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center w-[120px]">Typ</TableHead>
                        <TableHead className="py-3 px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center w-[100px]">Proplaceno</TableHead>
                        <TableHead className="py-3 px-4 text-right w-[120px]">Akce</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ticket.receipts.map((receipt) => {
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
                              {/* Use Dropdown Select for Expense Type */}
                              {isAdmin ? (
                                 <div className="flex justify-center">
                                   <Select 
                                     value={receipt.expenseType} 
                                     onValueChange={(v) => updateReceiptExpenseType(receipt.id, v as ExpenseType)}
                                   >
                                     <SelectTrigger className="h-7 w-[90px] text-[10px] font-bold">
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
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" title="Proplaceno" />
                                  </div>
                                ) : (
                                  <div className="flex justify-center">
                                    <div className="w-2 h-2 rounded-full bg-orange-300" title="Neuhrazeno" />
                                  </div>
                                )
                              )}
                            </TableCell>
                            <TableCell className="text-right py-3 px-4">
                              <div className="flex items-center justify-end gap-1">
                                <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" title="Zobrazit">
                                  <a href={`/api/proxy?url=${encodeURIComponent(receipt.fileUrl)}`} target="_blank" rel="noreferrer">
                                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                                  </a>
                                </Button>
                                
                                {isAdmin && ticket.status === "VERIFICATION" && (
                                   // Admin cannot reject individual receipts anymore. 
                                   // They must return the whole ticket or just verify it.
                                   null
                                )}

                                {(isOwner && ticket.status === "APPROVED" || isAdmin) && (
                                  <Button 
                                    variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => deleteReceipt(receipt.id)}
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
            </section>
          </div>

          {/* 4. Action Footer (Fixed Bottom) */}
          <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-6 border-t border-border/60 flex items-center justify-between shrink-0">
             {/* Left Actions (Dismissive/Destructive) */}
             <div className="flex-1 flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-6 font-bold text-muted-foreground">
                   Zavřít
                </Button>
                
                {isAdmin && (
                   <Button 
                     variant="ghost" 
                     onClick={() => deleteTicket(ticket.id).then(() => { onOpenChange(false); router.refresh(); })}
                     className="h-10 px-4 font-bold text-destructive hover:text-destructive hover:bg-destructive/10"
                     disabled={loading}
                   >
                     Smazat žádost
                   </Button>
                )}
             </div>

             {/* Right Actions (Constructive) */}
             <div className="flex gap-3">
               {isAdmin && (
                 <>
                   {ticket.status === "PENDING_APPROVAL" && (
                      <Button 
                        onClick={() => handleStatusUpdate("APPROVED")} 
                        className="h-10 px-6 font-bold bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-transform active:scale-95"
                        disabled={loading}
                      >
                        Schválit žádost
                      </Button>
                   )}
                   {ticket.status === "VERIFICATION" && (
                     <>
                       {/* Return to User (Re-open for editing) */}
                       <Button 
                          onClick={() => handleStatusUpdate("APPROVED")} 
                          className="h-10 px-6 font-bold bg-amber-500 hover:bg-amber-600 text-amber-950 shadow-sm transition-transform active:scale-95"
                          disabled={loading}
                        >
                          Vrátit k opravě
                        </Button>

                       {/* Finish Verification */}
                       <Button 
                          onClick={() => handleStatusUpdate("DONE")} 
                          className="h-10 px-6 font-bold bg-primary hover:bg-primary/90 shadow-sm transition-transform active:scale-95"
                          disabled={loading || ticket.receipts.some(r => r.status === "PENDING")} // Logic check: technically receipts can stay pending if we just verify the budget? User said "Admin marks as Done".
                        >
                          Dokončit verifikaci
                        </Button>
                     </>
                   )}
                   {ticket.status === "DONE" && (
                    <Button 
                      variant="outline" 
                      className="h-10 px-4 text-xs font-bold border-orange-500/30 text-orange-600 hover:bg-orange-50"
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
                    className="h-10 px-6 font-bold uppercase tracking-wide text-xs bg-purple-600 hover:bg-purple-700 shadow-sm transition-transform active:scale-95"
                    disabled={loading || ticket.receipts.length === 0}
                  >
                    Odeslat ke kontrole
                  </Button>
               )}
             </div>
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


