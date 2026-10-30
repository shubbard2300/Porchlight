-- AlterTable
ALTER TABLE "User" ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "toursDone" TEXT[] DEFAULT ARRAY[]::TEXT[];
