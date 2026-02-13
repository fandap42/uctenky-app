-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bank_account_number" TEXT,
ADD COLUMN     "bank_account_prefix" TEXT,
ADD COLUMN     "bank_code" TEXT,
ADD COLUMN     "has_completed_onboarding" BOOLEAN NOT NULL DEFAULT false;
