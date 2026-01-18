"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { TransactionStatus } from "@/lib/database.types"

export async function createTransaction(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Nepřihlášený uživatel" }
  }

  // Get user's profile to get section_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("section_id")
    .eq("id", user.id)
    .single()

  if (!profile?.section_id) {
    return { error: "Uživatel není přiřazen k žádné sekci" }
  }

  const purpose = formData.get("purpose") as string
  const estimatedAmount = parseFloat(formData.get("estimatedAmount") as string)
  const status = (formData.get("status") as TransactionStatus) || "DRAFT"

  if (!purpose || !estimatedAmount) {
    return { error: "Vyplňte všechna povinná pole" }
  }

  const { error } = await supabase.from("transactions").insert({
    requester_id: user.id,
    section_id: profile.section_id,
    purpose,
    estimated_amount: estimatedAmount,
    status,
  })

  if (error) {
    console.error("Create transaction error:", error)
    return { error: "Nepodařilo se vytvořit žádost" }
  }

  revalidatePath("/dashboard/member")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateTransactionStatus(
  transactionId: string,
  status: TransactionStatus
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Nepřihlášený uživatel" }
  }

  const { error } = await supabase
    .from("transactions")
    .update({ status })
    .eq("id", transactionId)

  if (error) {
    console.error("Update transaction status error:", error)
    if (error.code === "42501") {
      return { error: "Nemáte oprávnění k této akci" }
    }
    return { error: "Nepodařilo se aktualizovat žádost" }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/member")
  revalidatePath("/dashboard/head")
  revalidatePath("/dashboard/finance")
  return { success: true }
}

export async function updateTransactionReceipt(
  transactionId: string,
  receiptUrl: string,
  finalAmount?: number
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Nepřihlášený uživatel" }
  }

  const updateData: { receipt_url: string; final_amount?: number; status?: TransactionStatus } = {
    receipt_url: receiptUrl,
  }

  if (finalAmount !== undefined) {
    updateData.final_amount = finalAmount
  }

  // Change status to PURCHASED when receipt is uploaded
  updateData.status = "PURCHASED"

  const { error } = await supabase
    .from("transactions")
    .update(updateData)
    .eq("id", transactionId)

  if (error) {
    console.error("Update transaction receipt error:", error)
    if (error.code === "42501") {
      return { error: "Nemáte oprávnění k této akci" }
    }
    return { error: "Nepodařilo se nahrát účtenku" }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/member")
  revalidatePath("/dashboard/head")
  revalidatePath("/dashboard/finance")
  return { success: true }
}

export async function deleteTransaction(transactionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Nepřihlášený uživatel" }
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)

  if (error) {
    console.error("Delete transaction error:", error)
    if (error.code === "42501") {
      return { error: "Nemáte oprávnění k této akci" }
    }
    return { error: "Nepodařilo se smazat žádost" }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/member")
  revalidatePath("/dashboard/head")
  revalidatePath("/dashboard/finance")
  return { success: true }
}
