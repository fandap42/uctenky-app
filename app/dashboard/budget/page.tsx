import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSemester } from "@/lib/utils/semesters"
import { BudgetSemesterExport } from "@/components/dashboard/budget-semester-export"

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Rozpočty</h1>
        <p className="text-slate-400">
          Přehled čerpání rozpočtu po sekcích pro každý semestr
        </p>
      </div>

      {/* Semester sections */}
      {semesterData.length > 0 ? (
        semesterData.map((sem) => (
          <Card key={sem.semester} className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-xl font-bold text-white">
                {sem.semester}
              </CardTitle>
              <BudgetSemesterExport 
                semester={sem.semester} 
                sections={sem.sections}
              />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Sekce</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Vyčerpáno</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Čekající</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Celkem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sem.sections.map((section) => (
                      <tr key={section.sectionId} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                        <td className="py-3 px-4 text-sm text-white">{section.sectionName}</td>
                        <td className="py-3 px-4 text-sm text-right text-green-400">
                          {section.spent.toLocaleString("cs-CZ")} Kč
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-yellow-400">
                          {section.pending.toLocaleString("cs-CZ")} Kč
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-white font-medium">
                          {(section.spent + section.pending).toLocaleString("cs-CZ")} Kč
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-700/30">
                      <td className="py-3 px-4 text-sm font-bold text-white">Celkem</td>
                      <td className="py-3 px-4 text-sm text-right font-bold text-green-400">
                        {sem.totalSpent.toLocaleString("cs-CZ")} Kč
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-bold text-yellow-400">
                        {sem.totalPending.toLocaleString("cs-CZ")} Kč
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-bold text-white">
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
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">Žádná data k zobrazení</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
