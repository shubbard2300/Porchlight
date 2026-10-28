-- CreateEnum
CREATE TYPE "PotSource" AS ENUM ('HOST', 'SPONSOR');

-- CreateEnum
CREATE TYPE "PotPaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'EXPIRED');

-- CreateTable
CREATE TABLE "PotPayment" (
    "id" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "source" "PotSource" NOT NULL DEFAULT 'HOST',
    "amountCents" INTEGER NOT NULL,
    "status" "PotPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "houseId" TEXT,
    "userId" TEXT,
    "merchantId" TEXT,
    "sponsorName" TEXT,
    "stripeSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),

    CONSTRAINT "PotPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PotPayment_stripeSessionId_key" ON "PotPayment"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PotPayment_stripePaymentIntentId_key" ON "PotPayment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "PotPayment_season_status_idx" ON "PotPayment"("season", "status");

-- CreateIndex
CREATE INDEX "PotPayment_houseId_idx" ON "PotPayment"("houseId");

-- AddForeignKey
ALTER TABLE "PotPayment" ADD CONSTRAINT "PotPayment_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PotPayment" ADD CONSTRAINT "PotPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PotPayment" ADD CONSTRAINT "PotPayment_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
