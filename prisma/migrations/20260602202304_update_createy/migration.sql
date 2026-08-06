/*
  Warnings:

  - Made the column `status` on table `patterns` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "patterns" ADD COLUMN     "createdById" TEXT NOT NULL DEFAULT 'yannick',
ALTER COLUMN "status" SET NOT NULL;
