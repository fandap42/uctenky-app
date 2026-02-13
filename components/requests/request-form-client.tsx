"use client"

import dynamic from "next/dynamic"

interface Section {
  id: string
  name: string
}

const RequestForm = dynamic(
  () => import("@/components/requests/request-form").then((mod) => mod.RequestForm),
  { ssr: false }
)

interface RequestFormClientProps {
  sections: Section[]
}

export function RequestFormClient({ sections }: RequestFormClientProps) {
  return <RequestForm sections={sections} />
}
