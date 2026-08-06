/*
  Warnings:

  - You are about to drop the column `nameFr` on the `patterns` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "patterns" DROP COLUMN "nameFr",
ADD COLUMN     "imgUrl" TEXT,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT;
