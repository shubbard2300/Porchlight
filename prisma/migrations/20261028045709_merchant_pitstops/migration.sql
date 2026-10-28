-- CreateEnum
CREATE TYPE "PitstopTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "xpBoostUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tier" "PitstopTier" NOT NULL DEFAULT 'SILVER',
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "offer" TEXT NOT NULL,
    "hours" TEXT,
    "website" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PitstopScan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PitstopScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PitstopScan_merchantId_createdAt_idx" ON "PitstopScan"("merchantId", "createdAt");

-- CreateIndex
CREATE INDEX "PitstopScan_userId_createdAt_idx" ON "PitstopScan"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "PitstopScan" ADD CONSTRAINT "PitstopScan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PitstopScan" ADD CONSTRAINT "PitstopScan_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
