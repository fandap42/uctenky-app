/*
  Warnings:

  - The values [SECTION_HEAD] on the enum `AppRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `section_id` on the `users` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AppRole_new" AS ENUM ('MEMBER', 'HEAD_VEDENI', 'HEAD_FINANCE', 'HEAD_HR', 'HEAD_PR', 'HEAD_NEVZDELAVACI', 'HEAD_VZDELAVACI', 'HEAD_SPORTOVNI', 'HEAD_GAMING', 'HEAD_KRUHOVE', 'ADMIN');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "AppRole_new" USING ("role"::text::"AppRole_new");
ALTER TYPE "AppRole" RENAME TO "AppRole_old";
ALTER TYPE "AppRole_new" RENAME TO "AppRole";
DROP TYPE "public"."AppRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
COMMIT;

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_section_id_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "section_id";
