"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTable } from "@/components/pokladna/overview-table"
import { getBalanceAtDate } from "@/lib/actions/cash-register"
import { AlertCircle, Wallet, ArrowRightLeft, Landmark } from "lucide-react"
import { DepositDialog } from "@/components/pokladna/deposit-dialog"
import { DebtErrorDialog } from "@/components/pokladna/debt-error-dialog"
import { CashOnHandDialog } from "@/components/pokladna/cash-on-hand-dialog"
import { cn } from "@/lib/utils"

interface PokladnaClientProps {
  initialBalance: number
  unpaidCount: number
  currentUsers: any[]
  registerData: any
}

export function PokladnaClient({ 
  initialBalance, 
  unpaidCount, 
  currentUsers,
  registerData 
}: PokladnaClientProps) {
  const [balance, setBalance] = useState(initialBalance)
  const [showDebtError, setShowDebtError] = useState(false)
  const [showCashOnHand, setShowCashOnHand] = useState(false)
  const [startMonthBalance, setStartMonthBalance] = useState<number | null>(null)

  // Calculate stats
  const totalDebt = currentUsers.reduce((sum, u) => sum + (Number(u.pokladnaBalance) > 0 ? Number(u.pokladnaBalance) : 0), 0)
  
  // Calculate beginning of month balance
  useEffect(() => {
    const firstDay = new Date()
    firstDay.setDate(1)
    firstDay.setHours(0, 0, 0, 0)
    getBalanceAtDate(firstDay).then(res => {
      if (res && 'balance' in res && typeof res.balance === 'number') {
        setStartMonthBalance(res.balance)
      }
    })
  }, [])

  return (
    <div className="space-y-8 pb-10">
      {/* Header section with primary action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-foreground">Pokladna</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <Landmark className="w-4 h-4 text-primary" />
            Správa financí a pokladní knihy 4FIS
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DepositDialog />
        </div>
      </div>

      <Tabs defaultValue="real" className="space-y-8">
        <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 w-full md:w-auto overflow-x-auto overflow-y-hidden">
          <TabsTrigger value="real" className="rounded-xl px-8 font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm h-full">
            Reálná pokladna
          </TabsTrigger>
          <TabsTrigger value="debt-errors" className="rounded-xl px-8 font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm h-full">
            Dluh z chyb
          </TabsTrigger>
          <TabsTrigger value="cash-on-hand" className="rounded-xl px-8 font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm h-full">
            Hotovost u pokladníka
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl px-8 font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm h-full">
            Zůstatky členů
          </TabsTrigger>
        </TabsList>

        <TabsContent value="real" className="space-y-8 outline-none">
          {/* Real Pokladna Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-primary text-primary-foreground border-none shadow-xl shadow-primary/20 relative overflow-hidden h-32">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
              <CardHeader className="py-4">
                <CardDescription className="text-primary-foreground/70 font-black uppercase tracking-widest text-[10px]">
                  Stav reálné pokladny
                </CardDescription>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tabular-nums">
                    {registerData.currentBalance.toLocaleString("cs-CZ")}
                  </span>
                  <span className="text-sm font-bold opacity-80">Kč</span>
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border shadow-sm h-32 flex flex-col justify-center">
              <CardHeader className="py-4">
                <CardDescription className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">
                  Neproplacené účtenky
                </CardDescription>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-3xl font-black tabular-nums",
                    unpaidCount > 0 ? "text-red-500" : "text-success"
                  )}>
                    {unpaidCount}
                  </span>
                  <Badge className={cn(
                    "font-black text-[10px] uppercase tracking-wider h-5",
                    unpaidCount > 0 ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-success/10 text-success border-success/20"
                  )} variant="outline">
                    {unpaidCount > 0 ? "K proplacení" : "Vše vyřízeno"}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border shadow-sm h-32 flex flex-col justify-center">
              <CardHeader className="py-4">
                <CardDescription className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">
                  Celkem dluží organizace
                </CardDescription>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-foreground tabular-nums">
                    {totalDebt.toLocaleString("cs-CZ")}
                  </span>
                  <span className="text-sm font-bold text-muted-foreground">Kč</span>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Monthly Overview Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-foreground">Pokladní kniha</h2>
                <p className="text-sm text-muted-foreground font-medium">
                  Zůstatek na začátku měsíce: <span className="font-black text-foreground">{startMonthBalance?.toLocaleString("cs-CZ") ?? "—"} Kč</span>
                </p>
              </div>
              <div className="flex items-baseline gap-2 bg-muted/50 px-4 py-2 rounded-xl">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Aktuální bilanční stav:</span>
                <span className="text-lg font-black text-foreground tabular-nums">{registerData.currentBalance.toLocaleString("cs-CZ")} Kč</span>
              </div>
            </div>
            
            <OverviewTable 
              transactions={registerData.transactions} 
              deposits={registerData.deposits} 
            />
          </div>
        </TabsContent>

        <TabsContent value="debt-errors" className="space-y-6 outline-none">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Dluh z chyb
              </h2>
              <p className="text-muted-foreground font-medium">Extra výdaje vzniklé administrativní chybou</p>
            </div>
            <Button 
              onClick={() => setShowDebtError(true)} 
              className="bg-destructive/10 hover:bg-destructive/20 text-destructive font-black rounded-full"
            >
              + Přidat záznam
            </Button>
          </div>
          
          <Card className="bg-card border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-border hover:bg-transparent">
                  <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Důvod</TableHead>
                  <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-right w-[150px]">Částka</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registerData.debtErrors.map((de: any) => (
                  <TableRow key={de.id} className="border-border hover:bg-muted/30">
                    <TableCell className="py-4 px-6 font-bold">{de.reason}</TableCell>
                    <TableCell className="py-4 px-6 text-right font-black text-destructive tabular-nums">
                      -{Number(de.amount).toLocaleString("cs-CZ")} Kč
                    </TableCell>
                  </TableRow>
                ))}
                {registerData.debtErrors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="py-12 text-center text-muted-foreground italic">Žádné záznamy o chybách</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="cash-on-hand" className="space-y-6 outline-none">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                <Wallet className="w-5 h-5 text-success" />
                Hotovost u pokladníka
              </h2>
              <p className="text-muted-foreground font-medium">Fyzické peníze držené u odpovědné osoby</p>
            </div>
            <Button 
              onClick={() => setShowCashOnHand(true)} 
              className="bg-primary/10 hover:bg-primary/20 text-primary font-black rounded-full"
            >
              + Přidat záznam
            </Button>
          </div>

          <Card className="bg-card border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-border hover:bg-transparent">
                  <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Důvod / Kdo</TableHead>
                  <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-right w-[150px]">Částka</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registerData.cashOnHand.map((co: any) => (
                  <TableRow key={co.id} className="border-border hover:bg-muted/30">
                    <TableCell className="py-4 px-6 font-bold">{co.reason}</TableCell>
                    <TableCell className="py-4 px-6 text-right font-black text-success tabular-nums">
                      +{Number(co.amount).toLocaleString("cs-CZ")} Kč
                    </TableCell>
                  </TableRow>
                ))}
                {registerData.cashOnHand.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="py-12 text-center text-muted-foreground italic">Žádná hotovost není evidována u pokladníků</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="outline-none">
          <Card className="bg-card border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-border hover:bg-transparent">
                  <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Jméno člena</TableHead>
                  <TableHead className="py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Dluh / Zůstatek</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers
                  .filter(u => Number(u.pokladnaBalance) !== 0)
                  .sort((a, b) => Number(b.pokladnaBalance) - Number(a.pokladnaBalance))
                  .map((user) => (
                    <TableRow key={user.id} className="border-border hover:bg-muted/30">
                      <TableCell className="py-4 px-6 font-bold text-foreground">{user.fullName}</TableCell>
                      <TableCell className={cn(
                        "py-4 px-6 text-right font-black tabular-nums",
                        Number(user.pokladnaBalance) > 0 ? "text-destructive" : "text-success"
                      )}>
                        {Number(user.pokladnaBalance).toLocaleString("cs-CZ")} Kč
                      </TableCell>
                    </TableRow>
                  ))}
                {currentUsers.filter(u => Number(u.pokladnaBalance) !== 0).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="py-12 text-center text-muted-foreground italic">
                      Žádné aktivní dluhy nebo zůstatky u členů
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <DebtErrorDialog 
        open={showDebtError} 
        onOpenChange={setShowDebtError} 
        currentTotal={balance} 
      />
      <CashOnHandDialog 
        open={showCashOnHand} 
        onOpenChange={setShowCashOnHand} 
        currentTotal={balance}
      />
    </div>
  )
}
