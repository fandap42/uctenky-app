"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface CollapsibleBudgetProps {
  children: React.ReactNode
}

export function CollapsibleBudget({ children }: CollapsibleBudgetProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div>
          <CardTitle className="text-white">Rozpočty sekcí</CardTitle>
          <CardDescription className="text-slate-400">
            Přehled čerpání rozpočtu podle sekcí
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="w-9 p-0 text-slate-400">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span className="sr-only">Toggle</span>
        </Button>
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-6 pt-4 border-t border-slate-700">
          {children}
        </CardContent>
      )}
    </Card>
  )
}
