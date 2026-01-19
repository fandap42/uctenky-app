-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('MEMBER', 'SECTION_HEAD', 'ADMIN');

-- CreateEnum
CREATE TYPE "TransStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'PURCHASED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('MATERIAL', 'SERVICE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "AppRole" NOT NULL DEFAULT 'MEMBER',
    "section_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "status" "TransStatus" NOT NULL DEFAULT 'DRAFT',
    "purpose" TEXT NOT NULL,
    "store" TEXT,
    "due_date" TIMESTAMP(3),
    "estimated_amount" DECIMAL(12,2) NOT NULL,
    "final_amount" DECIMAL(12,2),
    "receipt_url" TEXT,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "expense_type" "ExpenseType" NOT NULL DEFAULT 'MATERIAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "transactions_requester_id_idx" ON "transactions"("requester_id");

-- CreateIndex
CREATE INDEX "transactions_section_id_idx" ON "transactions"("section_id");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
