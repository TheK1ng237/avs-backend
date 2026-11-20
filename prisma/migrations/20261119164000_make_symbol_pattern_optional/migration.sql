-- Symbols may exist independently from a pattern.
ALTER TABLE "symbols"
ALTER COLUMN "patternId" DROP NOT NULL;
