-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_loggedById_fkey";

-- DropForeignKey
ALTER TABLE "ServiceCharge" DROP CONSTRAINT "ServiceCharge_visitId_fkey";

-- DropForeignKey
ALTER TABLE "Visit" DROP CONSTRAINT "Visit_bedId_fkey";

-- DropForeignKey
ALTER TABLE "Visit" DROP CONSTRAINT "Visit_consultationDoctorId_fkey";

-- DropForeignKey
ALTER TABLE "Visit" DROP CONSTRAINT "Visit_patientId_fkey";

-- DropForeignKey
ALTER TABLE "Visit" DROP CONSTRAINT "Visit_referringDoctorId_fkey";

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "Bed";

-- DropTable
DROP TABLE "Doctor";

-- DropTable
DROP TABLE "Expense";

-- DropTable
DROP TABLE "Inventory";

-- DropTable
DROP TABLE "Patient";

-- DropTable
DROP TABLE "ServiceCharge";

-- DropTable
DROP TABLE "Visit";

-- DropEnum
DROP TYPE "BedStatus";

-- DropEnum
DROP TYPE "VisitStatus";

-- DropEnum
DROP TYPE "VisitType";

-- DropEnum
DROP TYPE "WardType";
