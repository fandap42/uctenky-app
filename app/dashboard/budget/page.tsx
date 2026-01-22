import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

  // Fetch all transactions with section info
  const transactions = await prisma.transaction.findMany({
    include: {
      section: { select: { id: true, name: true } },
    },
  })

  // Group transactions by semester and section
  const semesterMap = new Map<string, Map<string, { spent: number; pending: number; sectionName: string }>>()

  transactions.forEach((tx) => {
    const date = new Date(tx.dueDate || tx.createdAt)
    const semester = getSemester(date)
    
    if (!semesterMap.has(semester)) {
      semesterMap.set(semester, new Map())
    }
    
    const sectionMap = semesterMap.get(semester)!
    if (!sectionMap.has(tx.sectionId)) {
      sectionMap.set(tx.sectionId, { 
        spent: 0, 
        pending: 0, 
        sectionName: tx.section?.name || "Neznámá sekce" 
      })
    }
    
    const sectionData = sectionMap.get(tx.sectionId)!
    const amount = Number(tx.finalAmount || tx.estimatedAmount)
    
    if (tx.status === "VERIFIED" || tx.status === "PURCHASED") {
      sectionData.spent += amount
    } else if (tx.status === "PENDING" || tx.status === "APPROVED") {
      sectionData.pending += amount
    }
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
        <p className="text-muted-foreground">
          Přehled čerpání rozpočtu po sekcích pro každý semestr
        </p>
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
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/10 border-b border-border">
                      <th className="text-left py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Sekce</th>
                      <th className="text-right py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Vyčerpáno</th>
                      <th className="text-right py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Čekající</th>
                      <th className="text-right py-4 px-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Celkem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sem.sections.map((section) => (
                      <tr key={section.sectionId} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-6 text-sm font-bold text-foreground">{section.sectionName}</td>
                        <td className="py-4 px-6 text-sm text-right text-success font-black tabular-nums">
                          {section.spent.toLocaleString("cs-CZ")} Kč
                        </td>
                        <td className="py-4 px-6 text-sm text-right text-[oklch(0.75_0.15_85)] font-black tabular-nums">
                          {section.pending.toLocaleString("cs-CZ")} Kč
                        </td>
                        <td className="py-4 px-6 text-sm text-right text-foreground font-black tabular-nums">
                          {(section.spent + section.pending).toLocaleString("cs-CZ")} Kč
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/40 border-t border-border">
                      <td className="py-5 px-6 text-sm font-black text-foreground uppercase tracking-widest">Celkem</td>
                      <td className="py-5 px-6 text-sm text-right font-black text-success tabular-nums text-lg">
                        {sem.totalSpent.toLocaleString("cs-CZ")} Kč
                      </td>
                      <td className="py-5 px-6 text-sm text-right font-black text-[oklch(0.75_0.15_85)] tabular-nums text-lg">
                        {sem.totalPending.toLocaleString("cs-CZ")} Kč
                      </td>
                      <td className="py-5 px-6 text-sm text-right font-black text-foreground tabular-nums text-lg">
                        {(sem.totalSpent + sem.totalPending).toLocaleString("cs-CZ")} Kč
                      </td>
                    </tr>
                  </tfoot>
                </table>
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
