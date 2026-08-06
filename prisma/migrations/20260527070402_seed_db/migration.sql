/*
  Warnings:

  - Made the column `imgUrl` on table `patterns` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `patterns` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "patterns" ALTER COLUMN "imgUrl" SET NOT NULL,
ALTER COLUMN "name" SET NOT NULL;
