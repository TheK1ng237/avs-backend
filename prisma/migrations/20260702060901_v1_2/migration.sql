/*
  Warnings:

  - You are about to drop the `Symbolism` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Symbolism" DROP CONSTRAINT "Symbolism_patternId_fkey";

-- DropTable
DROP TABLE "Symbolism";

-- CreateTable
CREATE TABLE "symbolism" (
    "id" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "keywords" TEXT[],
    "usage" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,

    CONSTRAINT "symbolism_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "symbolism_patternId_key" ON "symbolism"("patternId");

-- AddForeignKey
ALTER TABLE "symbolism" ADD CONSTRAINT "symbolism_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
