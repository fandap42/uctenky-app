"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"

interface Section {
  id: string
  name: string
}

interface SectionFilterProps {
  sections: Section[]
  currentSectionId: string
}

export function SectionFilter({ sections, currentSectionId }: SectionFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sectionId", value)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Sekce:</span>
      <Select value={currentSectionId} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[200px] h-10 bg-card border-border font-bold">
          <SelectValue placeholder="Vyberte sekci" />
        </SelectTrigger>
        <SelectContent position="popper" className="bg-card border-border max-h-[none]">
          {sections.map((section) => (
            <SelectItem key={section.id} value={section.id} className="font-medium">
              {section.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
