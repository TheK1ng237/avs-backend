-- CreateEnum
CREATE TYPE "PatternFormat" AS ENUM ('SVG', 'CSS', 'HYBRID');

-- AlterTable
ALTER TABLE "patterns" ADD COLUMN     "cssCode" TEXT,
ADD COLUMN     "format" "PatternFormat" NOT NULL DEFAULT 'CSS',
ADD COLUMN     "svgContent" TEXT;

-- CreateIndex
CREATE INDEX "patterns_format_idx" ON "patterns"("format");
