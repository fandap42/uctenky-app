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
  users: { id: string; fullName: string; email?: string | null }[]
  currentUserRole: string
}

export function RequestFormClient({ sections, users, currentUserRole }: RequestFormClientProps) {
  return <RequestForm sections={sections} users={users} currentUserRole={currentUserRole} />
}
