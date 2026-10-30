-- AlterTable
ALTER TABLE "House" ADD COLUMN     "rulesAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "rulesVersion" TEXT;

-- AlterTable
ALTER TABLE "PotPayment" ADD COLUMN     "rulesAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "rulesVersion" TEXT;
