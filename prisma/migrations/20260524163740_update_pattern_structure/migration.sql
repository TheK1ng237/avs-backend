/*
  Warnings:

  - You are about to drop the column `colorAccent` on the `patterns` table. All the data in the column will be lost.
  - You are about to drop the column `colorPrimary` on the `patterns` table. All the data in the column will be lost.
  - You are about to drop the column `colorSecondary` on the `patterns` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `patterns` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `patterns` table. All the data in the column will be lost.
  - You are about to drop the column `descEn` on the `patterns` table. All the data in the column will be lost.
  - You are about to drop the column `descFr` on the `patterns` table. All the data in the column will be lost.
  - You are about to drop the column `downloadCount` on the `patterns` table. All the data in the column will be lost.
  - You are about to drop the column `isFeatured` on the `patterns` table. All the data in the column will be lost.
  - You are about to drop the column `isPublished` on the `patterns` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `patterns` table. All the data in the column will be lost.
  - You are about to drop the column `nameEn` on the `patterns` table. All the data in the column will be lost.
  - You are about to drop the column `patternType` on the `patterns` table. All the data in the column will be lost.
  - You are about to drop the column `previewUrl` on the `patterns` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `patterns` table. All the data in the column will be lost.
  - You are about to drop the column `svgUrl` on the `patterns` table. All the data in the column will be lost.
  - You are about to drop the column `symbolKeywords` on the `patterns` table. All the data in the column will be lost.
  - You are about to drop the column `symbolMeaning` on the `patterns` table. All the data in the column will be lost.
  - You are about to drop the column `symbolUsage` on the `patterns` table. All the data in the column will be lost.
  - You are about to drop the column `viewCount` on the `patterns` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "patterns" DROP CONSTRAINT "patterns_createdById_fkey";

-- DropIndex
DROP INDEX "patterns_isPublished_idx";

-- DropIndex
DROP INDEX "patterns_patternType_idx";

-- DropIndex
DROP INDEX "patterns_region_idx";

-- AlterTable
ALTER TABLE "patterns" DROP COLUMN "colorAccent",
DROP COLUMN "colorPrimary",
DROP COLUMN "colorSecondary",
DROP COLUMN "country",
DROP COLUMN "createdById",
DROP COLUMN "descEn",
DROP COLUMN "descFr",
DROP COLUMN "downloadCount",
DROP COLUMN "isFeatured",
DROP COLUMN "isPublished",
DROP COLUMN "metadata",
DROP COLUMN "nameEn",
DROP COLUMN "patternType",
DROP COLUMN "previewUrl",
DROP COLUMN "region",
DROP COLUMN "svgUrl",
DROP COLUMN "symbolKeywords",
DROP COLUMN "symbolMeaning",
DROP COLUMN "symbolUsage",
DROP COLUMN "viewCount",
ADD COLUMN     "ceremonial" TEXT,
ADD COLUMN     "cssClass" TEXT,
ADD COLUMN     "downloads" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "era" TEXT,
ADD COLUMN     "history" TEXT,
ADD COLUMN     "license" TEXT,
ADD COLUMN     "nameLocal" TEXT,
ADD COLUMN     "sources" TEXT[],
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "symbolism" TEXT,
ADD COLUMN     "technique" TEXT,
ADD COLUMN     "type" "PatternType",
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "Region";

-- DropEnum
DROP TYPE "UsageType";

-- CreateTable
CREATE TABLE "origins" (
    "id" TEXT NOT NULL,
    "people" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "flag" TEXT NOT NULL,
    "coords" DOUBLE PRECISION[],
    "patternId" TEXT NOT NULL,

    CONSTRAINT "origins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pattern_colors" (
    "id" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,

    CONSTRAINT "pattern_colors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symbols" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "cssPreview" TEXT NOT NULL,
    "imageUrl" TEXT,
    "meaning" TEXT NOT NULL,
    "usage" TEXT NOT NULL,
    "sacred" BOOLEAN NOT NULL DEFAULT false,
    "patternId" TEXT NOT NULL,

    CONSTRAINT "symbols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artisan_quotes" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,

    CONSTRAINT "artisan_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "origins_patternId_key" ON "origins"("patternId");

-- CreateIndex
CREATE UNIQUE INDEX "artisan_quotes_patternId_key" ON "artisan_quotes"("patternId");

-- CreateIndex
CREATE INDEX "patterns_type_idx" ON "patterns"("type");

-- AddForeignKey
ALTER TABLE "origins" ADD CONSTRAINT "origins_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pattern_colors" ADD CONSTRAINT "pattern_colors_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symbols" ADD CONSTRAINT "symbols_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artisan_quotes" ADD CONSTRAINT "artisan_quotes_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
