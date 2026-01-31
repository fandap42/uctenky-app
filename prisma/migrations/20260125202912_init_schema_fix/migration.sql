-- AlterEnum
ALTER TYPE "TicketStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "receipts" ADD COLUMN     "is_filed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "note" TEXT,
ADD COLUMN     "store" TEXT;
