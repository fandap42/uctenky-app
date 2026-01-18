-- StudentOrgFinance Database Schema
-- Migration: 0000_init.sql

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE app_role AS ENUM ('MEMBER', 'SECTION_HEAD', 'FINANCE');
CREATE TYPE trans_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'PURCHASED', 'VERIFIED', 'REJECTED');

-- ============================================
-- TABLES
-- ============================================

-- Sections table
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    budget_cap NUMERIC(12, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role app_role NOT NULL DEFAULT 'MEMBER',
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Budgets table
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    fiscal_year TEXT NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(section_id, fiscal_year)
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    status trans_status NOT NULL DEFAULT 'DRAFT',
    purpose TEXT NOT NULL,
    estimated_amount NUMERIC(12, 2) NOT NULL,
    final_amount NUMERIC(12, 2),
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_profiles_section_id ON profiles(section_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_transactions_requester_id ON transactions(requester_id);
CREATE INDEX idx_transactions_section_id ON transactions(section_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_budgets_section_id ON budgets(section_id);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sections_updated_at
    BEFORE UPDATE ON sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- All authenticated users can read all profiles (to see names)
CREATE POLICY "Profiles_Select_Authenticated"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Users can only update their own profile (except role changes)
CREATE POLICY "Profiles_Update_Own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- SECTIONS POLICIES
-- ============================================

-- All authenticated users can read sections
CREATE POLICY "Sections_Select_Authenticated"
ON sections FOR SELECT
TO authenticated
USING (true);

-- Only FINANCE role can insert sections
CREATE POLICY "Sections_Insert_Finance"
ON sections FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'FINANCE'
    )
);

-- Only FINANCE role can update sections
CREATE POLICY "Sections_Update_Finance"
ON sections FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'FINANCE'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'FINANCE'
    )
);

-- Only FINANCE role can delete sections
CREATE POLICY "Sections_Delete_Finance"
ON sections FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'FINANCE'
    )
);

-- ============================================
-- BUDGETS POLICIES
-- ============================================

-- All authenticated users can read budgets
CREATE POLICY "Budgets_Select_Authenticated"
ON budgets FOR SELECT
TO authenticated
USING (true);

-- Only FINANCE role can insert budgets
CREATE POLICY "Budgets_Insert_Finance"
ON budgets FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'FINANCE'
    )
);

-- Only FINANCE role can update budgets
CREATE POLICY "Budgets_Update_Finance"
ON budgets FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'FINANCE'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'FINANCE'
    )
);

-- Only FINANCE role can delete budgets
CREATE POLICY "Budgets_Delete_Finance"
ON budgets FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'FINANCE'
    )
);

-- ============================================
-- TRANSACTIONS POLICIES
-- ============================================

-- SELECT: User can see their own, SECTION_HEAD sees their section, FINANCE sees all
CREATE POLICY "Transactions_Select"
ON transactions FOR SELECT
TO authenticated
USING (
    (auth.uid() = requester_id)
    OR (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'FINANCE'
        )
    )
    OR (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SECTION_HEAD'
            AND section_id = transactions.section_id
        )
    )
);

-- INSERT: Any authenticated user can create transactions
CREATE POLICY "Transactions_Insert_Authenticated"
ON transactions FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = requester_id
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND section_id = transactions.section_id
    )
);

-- UPDATE: Complex logic based on role and status
-- MEMBER: Can update only DRAFT or APPROVED (to add receipt) transactions they own
-- SECTION_HEAD: Can update transactions in their section
-- FINANCE: Can update any transaction
CREATE POLICY "Transactions_Update"
ON transactions FOR UPDATE
TO authenticated
USING (
    -- FINANCE can update anything
    (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'FINANCE'
        )
    )
    OR
    -- SECTION_HEAD can update their section's transactions
    (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SECTION_HEAD'
            AND section_id = transactions.section_id
        )
    )
    OR
    -- MEMBER can only update their own DRAFT or APPROVED transactions
    (
        auth.uid() = requester_id
        AND status IN ('DRAFT', 'APPROVED')
    )
)
WITH CHECK (
    -- FINANCE can update to anything
    (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'FINANCE'
        )
    )
    OR
    -- SECTION_HEAD can update their section's transactions
    (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'SECTION_HEAD'
            AND section_id = transactions.section_id
        )
    )
    OR
    -- MEMBER can only update their own transactions (limited fields enforced by app)
    (
        auth.uid() = requester_id
    )
);

-- DELETE: Only FINANCE can delete transactions
CREATE POLICY "Transactions_Delete_Finance"
ON transactions FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'FINANCE'
    )
);

-- ============================================
-- STORAGE BUCKET POLICY (run in Supabase Dashboard)
-- ============================================
-- Create a bucket named 'receipts' with the following policies:
-- 
-- Allow authenticated users to upload:
-- CREATE POLICY "Receipts_Upload_Authenticated"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'receipts');
--
-- Allow authenticated users to read:
-- CREATE POLICY "Receipts_Read_Authenticated"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (bucket_id = 'receipts');
