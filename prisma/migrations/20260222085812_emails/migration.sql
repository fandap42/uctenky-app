-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "is_returned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "receive_admin_emails" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "receive_emails" BOOLEAN NOT NULL DEFAULT true;
