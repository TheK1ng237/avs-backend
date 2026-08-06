/*
  Warnings:

  - Made the column `ceremonial` on table `patterns` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cssClass` on table `patterns` required. This step will fail if there are existing NULL values in that column.
  - Made the column `history` on table `patterns` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nameLocal` on table `patterns` required. This step will fail if there are existing NULL values in that column.
  - Made the column `summary` on table `patterns` required. This step will fail if there are existing NULL values in that column.
  - Made the column `symbolism` on table `patterns` required. This step will fail if there are existing NULL values in that column.
  - Made the column `technique` on table `patterns` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `patterns` required. This step will fail if there are existing NULL values in that column.
  - Made the column `imageUrl` on table `symbols` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "patterns" ALTER COLUMN "ceremonial" SET NOT NULL,
ALTER COLUMN "cssClass" SET NOT NULL,
ALTER COLUMN "history" SET NOT NULL,
ALTER COLUMN "nameLocal" SET NOT NULL,
ALTER COLUMN "summary" SET NOT NULL,
ALTER COLUMN "symbolism" SET NOT NULL,
ALTER COLUMN "technique" SET NOT NULL,
ALTER COLUMN "type" SET NOT NULL;

-- AlterTable
ALTER TABLE "symbols" ALTER COLUMN "imageUrl" SET NOT NULL;
