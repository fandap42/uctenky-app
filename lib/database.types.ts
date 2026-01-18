export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      budgets: {
        Row: {
          id: string
          section_id: string
          fiscal_year: string
          total_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          section_id: string
          fiscal_year: string
          total_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          section_id?: string
          fiscal_year?: string
          total_amount?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          role: Database["public"]["Enums"]["app_role"]
          section_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: Database["public"]["Enums"]["app_role"]
          section_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: Database["public"]["Enums"]["app_role"]
          section_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          }
        ]
      }
      sections: {
        Row: {
          id: string
          name: string
          budget_cap: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          budget_cap?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          budget_cap?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          requester_id: string
          section_id: string
          status: Database["public"]["Enums"]["trans_status"]
          purpose: string
          estimated_amount: number
          final_amount: number | null
          receipt_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          section_id: string
          status?: Database["public"]["Enums"]["trans_status"]
          purpose: string
          estimated_amount: number
          final_amount?: number | null
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          section_id?: string
          status?: Database["public"]["Enums"]["trans_status"]
          purpose?: string
          estimated_amount?: number
          final_amount?: number | null
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "MEMBER" | "SECTION_HEAD" | "FINANCE"
      trans_status: "DRAFT" | "PENDING" | "APPROVED" | "PURCHASED" | "VERIFIED" | "REJECTED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]

// Convenience exports
export type Profile = Tables<"profiles">
export type Section = Tables<"sections">
export type Budget = Tables<"budgets">
export type Transaction = Tables<"transactions">
export type AppRole = Enums<"app_role">
export type TransactionStatus = Enums<"trans_status">

// Profile with section info
export type ProfileWithSection = Profile & {
  section: Section | null
}

// Transaction with requester and section info
export type TransactionWithDetails = Transaction & {
  requester: Profile
  section: Section
}
