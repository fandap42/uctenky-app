import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getSemester } from "@/lib/utils/semesters"
import { BudgetSemesterExport } from "@/components/dashboard/budget-semester-export"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

interface SectionSpending {
  sectionId: string
  sectionName: string
  spent: number
  pending: number
}

interface SemesterData {
  semester: string
  sections: SectionSpending[]
  totalSpent: number
  totalPending: number
}

export default async function BudgetPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // Get user's profile to check role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, fullName: true, role: true },
  })

  // Redirect if not admin
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Fetch all sections
  const sections = await prisma.section.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })

  // Fetch all tickets with receipts and section info
  const tickets = await prisma.ticket.findMany({
    include: {
      section: { select: { id: true, name: true } },
      receipts: true,
    },
  })

  // Group by semester and section
  const semesterMap = new Map<string, Map<string, { spent: number; pending: number; sectionName: string }>>()

  tickets.forEach((ticket) => {
    const date = new Date(ticket.targetDate || ticket.createdAt)
    const semester = getSemester(date)
    
    if (!semesterMap.has(semester)) {
      semesterMap.set(semester, new Map())
    }
    
    const sectionMap = semesterMap.get(semester)!
    if (!sectionMap.has(ticket.sectionId)) {
      sectionMap.set(ticket.sectionId, { 
        spent: 0, 
        pending: 0, 
        sectionName: ticket.section?.name || "Neznámá sekce" 
      })
    }
    
    const sectionData = sectionMap.get(ticket.sectionId)!
    const ticketSpent = ticket.receipts.reduce((sum, r) => sum + Number(r.amount), 0)
    
    sectionData.spent += ticketSpent

    // If it's still pending approval, count the budget as 'pending'
    if (ticket.status === "PENDING_APPROVAL") {
      sectionData.pending += Number(ticket.budgetAmount)
    }
    // If it's approved but spent less than budget, maybe count the difference as pending?
    // For now, let's just stick to the simplest interpretation.
  })

  // Convert to array and sort by semester (newest first)
  const semesterData: SemesterData[] = Array.from(semesterMap.entries())
    .map(([semester, sectionMap]) => {
      const sectionsArray: SectionSpending[] = Array.from(sectionMap.entries()).map(([sectionId, data]) => ({
        sectionId,
        sectionName: data.sectionName,
        spent: data.spent,
        pending: data.pending,
      }))
      
      // Sort sections by name
      sectionsArray.sort((a, b) => a.sectionName.localeCompare(b.sectionName, "cs"))
      
      return {
        semester,
        sections: sectionsArray,
        totalSpent: sectionsArray.reduce((sum, s) => sum + s.spent, 0),
        totalPending: sectionsArray.reduce((sum, s) => sum + s.pending, 0),
      }
    })
    .sort((a, b) => {
      // Sort by year first (descending), then by semester type (ZS before LS in same year)
      const yearA = parseInt(a.semester.slice(2))
      const yearB = parseInt(b.semester.slice(2))
      if (yearA !== yearB) return yearB - yearA
      return b.semester.charAt(0).localeCompare(a.semester.charAt(0))
    })

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-foreground mb-2">Rozpočty</h1>
      </div>

      {/* Semester sections */}
      {semesterData.length > 0 ? (
        semesterData.map((sem) => (
          <Card key={sem.semester} className="bg-card border-border shadow-sm overflow-hidden rounded-[2.5rem]">
            <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-border bg-muted/20">
              <CardTitle className="text-2xl font-black text-foreground">
                {sem.semester}
              </CardTitle>
              <BudgetSemesterExport 
                semester={sem.semester} 
                sections={sem.sections}
              />
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/80 border-b border-border">
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="table-header-cell">Sekce</TableHead>
                      <TableHead className="table-header-cell text-right">Vyčerpáno</TableHead>
                      <TableHead className="table-header-cell text-right">Čekající</TableHead>
                      <TableHead className="table-header-cell text-right">Celkem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sem.sections.map((section) => (
                      <TableRow key={section.sectionId} className="border-border hover:bg-muted/10 transition-colors">
                        <TableCell className="py-3 px-4 text-sm font-semibold text-foreground">{section.sectionName}</TableCell>
                        <TableCell className="py-3 px-4 text-sm text-right text-status-success font-bold tabular-nums">
                          {section.spent.toLocaleString("cs-CZ")} Kč
                        </TableCell>
                        <TableCell className="py-3 px-4 text-sm text-right text-status-pending font-bold tabular-nums">
                          {section.pending.toLocaleString("cs-CZ")} Kč
                        </TableCell>
                        <TableCell className="py-3 px-4 text-sm text-right text-foreground font-bold tabular-nums">
                          {(section.spent + section.pending).toLocaleString("cs-CZ")} Kč
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <tfoot className="bg-muted/40 border-t border-border">
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="py-4 px-4 text-sm font-bold text-foreground uppercase tracking-wider">Celkem</TableCell>
                      <TableCell className="py-4 px-4 text-sm text-right font-bold text-status-success tabular-nums text-base">
                        {sem.totalSpent.toLocaleString("cs-CZ")} Kč
                      </TableCell>
                      <TableCell className="py-4 px-4 text-sm text-right font-bold text-status-pending tabular-nums text-base">
                        {sem.totalPending.toLocaleString("cs-CZ")} Kč
                      </TableCell>
                      <TableCell className="py-4 px-4 text-sm text-right font-bold text-foreground tabular-nums text-base">
                        {(sem.totalSpent + sem.totalPending).toLocaleString("cs-CZ")} Kč
                      </TableCell>
                    </TableRow>
                  </tfoot>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="py-24 text-center">
            <p className="text-muted-foreground font-bold italic">Žádná data k zobrazení</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
