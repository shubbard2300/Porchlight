-- CreateTable
CREATE TABLE "ArCatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "critter" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArCatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArCatch_userId_season_idx" ON "ArCatch"("userId", "season");

-- CreateIndex
CREATE UNIQUE INDEX "ArCatch_userId_houseId_key" ON "ArCatch"("userId", "houseId");

-- AddForeignKey
ALTER TABLE "ArCatch" ADD CONSTRAINT "ArCatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArCatch" ADD CONSTRAINT "ArCatch_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;
