-- CreateEnum
CREATE TYPE "FinancialStatus" AS ENUM ('PAID', 'PENDING', 'OVERDUE');

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "avatar_url" TEXT;

-- AlterTable
ALTER TABLE "guardians"
  ADD COLUMN "photo_url" TEXT,
  ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "financial_status" "FinancialStatus",
  ADD COLUMN "payment_method" VARCHAR(50);

-- AlterTable
ALTER TABLE "patients"
  ADD COLUMN "treatments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "clinical_events"
  ADD COLUMN "idempotency_key" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "clinical_events_idempotency_key_key" ON "clinical_events"("idempotency_key");
