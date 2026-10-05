-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "consultationDoctor" TEXT,
ADD COLUMN     "consultationDoctorId" TEXT;

-- CreateIndex
CREATE INDEX "Visit_consultationDoctorId_idx" ON "Visit"("consultationDoctorId");

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_consultationDoctorId_fkey" FOREIGN KEY ("consultationDoctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
