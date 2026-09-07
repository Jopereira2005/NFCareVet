-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'VET', 'REC');

-- CreateEnum
CREATE TYPE "HospitalizationStatus" AS ENUM ('ACTIVE', 'DISCHARGED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('PENDING', 'APPLIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdministrationRoute" AS ENUM ('ORAL', 'SUBCUTANEOUS', 'INTRAVENOUS', 'INTRAMUSCULAR', 'TOPICAL', 'INHALATION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VET',
    "badge_uid" VARCHAR(32),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "species" VARCHAR(50) NOT NULL,
    "breed" VARCHAR(50),
    "weight_kg" DECIMAL(5,2),
    "photo_url" TEXT,
    "guardian_name" VARCHAR(120),
    "guardian_phone" VARCHAR(20),
    "allergies" TEXT,
    "is_fasting" BOOLEAN NOT NULL DEFAULT false,
    "behavior_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nfc_tags" (
    "id" TEXT NOT NULL,
    "tag_uid" VARCHAR(32) NOT NULL,
    "public_code" VARCHAR(64) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nfc_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitalizations" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "nfc_tag_id" TEXT,
    "kennel_identifier" VARCHAR(30) NOT NULL,
    "admission_reason" TEXT,
    "status" "HospitalizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "admission_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discharge_date" TIMESTAMP(3),

    CONSTRAINT "hospitalizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "hospitalization_id" TEXT NOT NULL,
    "medication" VARCHAR(100) NOT NULL,
    "dosage" VARCHAR(50) NOT NULL,
    "route" "AdministrationRoute" NOT NULL,
    "scheduled_time" TIMESTAMP(3) NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "prescription_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bedside_notes" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_badge_uid_key" ON "users"("badge_uid");

-- CreateIndex
CREATE UNIQUE INDEX "nfc_tags_tag_uid_key" ON "nfc_tags"("tag_uid");

-- CreateIndex
CREATE UNIQUE INDEX "nfc_tags_public_code_key" ON "nfc_tags"("public_code");

-- CreateIndex
CREATE UNIQUE INDEX "hospitalizations_nfc_tag_id_key" ON "hospitalizations"("nfc_tag_id");

-- AddForeignKey
ALTER TABLE "hospitalizations" ADD CONSTRAINT "hospitalizations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospitalizations" ADD CONSTRAINT "hospitalizations_nfc_tag_id_fkey" FOREIGN KEY ("nfc_tag_id") REFERENCES "nfc_tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_hospitalization_id_fkey" FOREIGN KEY ("hospitalization_id") REFERENCES "hospitalizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
