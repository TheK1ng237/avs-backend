/*
  Warnings:

  - You are about to drop the column `isPublished` on the `patterns` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('DRAFT', 'PUBLISHED', 'REVIEW', 'REJECTED');

-- AlterTable
ALTER TABLE "patterns" DROP COLUMN "isPublished",
ADD COLUMN     "status" "Status" DEFAULT 'DRAFT';
