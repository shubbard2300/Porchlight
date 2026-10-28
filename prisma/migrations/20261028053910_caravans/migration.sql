-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN     "caravanId" TEXT;

-- AlterTable
ALTER TABLE "Vote" ADD COLUMN     "caravanId" TEXT;

-- CreateTable
CREATE TABLE "Caravan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Caravan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaravanMember" (
    "id" TEXT NOT NULL,
    "caravanId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "CaravanMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Caravan_code_key" ON "Caravan"("code");

-- CreateIndex
CREATE INDEX "Caravan_leaderId_idx" ON "Caravan"("leaderId");

-- CreateIndex
CREATE INDEX "CaravanMember_userId_idx" ON "CaravanMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CaravanMember_caravanId_userId_key" ON "CaravanMember"("caravanId", "userId");

-- CreateIndex
CREATE INDEX "CheckIn_caravanId_houseId_idx" ON "CheckIn"("caravanId", "houseId");

-- CreateIndex
CREATE INDEX "Vote_caravanId_idx" ON "Vote"("caravanId");

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_caravanId_fkey" FOREIGN KEY ("caravanId") REFERENCES "Caravan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_caravanId_fkey" FOREIGN KEY ("caravanId") REFERENCES "Caravan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caravan" ADD CONSTRAINT "Caravan_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaravanMember" ADD CONSTRAINT "CaravanMember_caravanId_fkey" FOREIGN KEY ("caravanId") REFERENCES "Caravan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaravanMember" ADD CONSTRAINT "CaravanMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
