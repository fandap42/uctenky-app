-- CreateEnum
CREATE TYPE "AiStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "receipts"
ADD COLUMN "ai_data" JSONB,
ADD COLUMN "ai_status" "AiStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "receipts_ai_status_idx" ON "receipts"("ai_status");
