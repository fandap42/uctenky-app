-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "processing_by_id" TEXT;

-- CreateIndex
CREATE INDEX "tickets_processing_by_id_idx" ON "tickets"("processing_by_id");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_processing_by_id_fkey" FOREIGN KEY ("processing_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
