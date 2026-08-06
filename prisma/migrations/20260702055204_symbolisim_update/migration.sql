/*
  Warnings:

  - You are about to drop the column `symbolism` on the `patterns` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "patterns" DROP COLUMN "symbolism",
ALTER COLUMN "createdById" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Symbolism" (
    "id" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "keywords" TEXT[],
    "usage" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,

    CONSTRAINT "Symbolism_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Symbolism_patternId_key" ON "Symbolism"("patternId");

-- CreateIndex
CREATE INDEX "activities_targetId_idx" ON "activities"("targetId");

-- CreateIndex
CREATE INDEX "patterns_status_idx" ON "patterns"("status");

-- CreateIndex
CREATE INDEX "patterns_isFeatured_idx" ON "patterns"("isFeatured");

-- CreateIndex
CREATE INDEX "patterns_createdById_idx" ON "patterns"("createdById");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- AddForeignKey
ALTER TABLE "patterns" ADD CONSTRAINT "patterns_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Symbolism" ADD CONSTRAINT "Symbolism_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
