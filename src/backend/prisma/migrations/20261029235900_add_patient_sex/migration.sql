-- CreateEnum
CREATE TYPE "PatientSex" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "patients" ADD COLUMN "sex" "PatientSex";
