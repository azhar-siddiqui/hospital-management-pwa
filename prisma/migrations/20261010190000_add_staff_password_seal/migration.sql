-- The sign-in password stays hashed. This sealed copy is what an admin can read.
ALTER TABLE "User" ADD COLUMN "passwordSeal" TEXT;
