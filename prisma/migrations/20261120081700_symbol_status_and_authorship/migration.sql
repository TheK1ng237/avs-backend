ALTER TABLE "symbols"
ADD COLUMN "status" "Status" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "createdById" TEXT;

UPDATE "symbols" AS symbol
SET
  "createdById" = pattern."createdById",
  "status" = CASE
    WHEN pattern."status" = 'PUBLISHED' THEN 'PUBLISHED'::"Status"
    ELSE 'DRAFT'::"Status"
  END
FROM "patterns" AS pattern
WHERE symbol."patternId" = pattern."id";

UPDATE "symbols"
SET "status" = 'PUBLISHED'
WHERE "patternId" IS NULL;

CREATE INDEX "symbols_status_idx" ON "symbols"("status");
CREATE INDEX "symbols_createdById_idx" ON "symbols"("createdById");

ALTER TABLE "symbols"
ADD CONSTRAINT "symbols_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
