-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('ACTIVE', 'DISCHARGED');

-- AlterEnum
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'ASSISTANT');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'RECEPTIONIST';

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN "clinicalNote" TEXT;
ALTER TABLE "Visit" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Visit" ALTER COLUMN "status" TYPE "VisitStatus" USING ("status"::"VisitStatus");
ALTER TABLE "Visit" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "Bed_wardType_status_idx" ON "Bed"("wardType", "status");
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");
CREATE INDEX "Expense_loggedById_idx" ON "Expense"("loggedById");
CREATE INDEX "Patient_phone_idx" ON "Patient"("phone");
CREATE INDEX "Patient_name_idx" ON "Patient"("name");
CREATE INDEX "ServiceCharge_visitId_idx" ON "ServiceCharge"("visitId");
CREATE INDEX "Visit_patientId_idx" ON "Visit"("patientId");
CREATE INDEX "Visit_status_visitType_idx" ON "Visit"("status", "visitType");
CREATE INDEX "Visit_admissionDate_idx" ON "Visit"("admissionDate");
