-- CreateEnum
CREATE TYPE "CheckInMethod" AS ENUM ('GEO', 'QR');

-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "creativity" INTEGER,
ADD COLUMN     "lighting" INTEGER,
ADD COLUMN     "sound" INTEGER,
ADD COLUMN     "storytelling" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "method" "CheckInMethod" NOT NULL,
    "distanceM" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckIn_houseId_createdAt_idx" ON "CheckIn"("houseId", "createdAt");

-- CreateIndex
CREATE INDEX "CheckIn_userId_houseId_idx" ON "CheckIn"("userId", "houseId");

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;
