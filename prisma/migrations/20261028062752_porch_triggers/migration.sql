-- CreateTable
CREATE TABLE "PorchTrigger" (
    "id" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "onCheckIn" BOOLEAN NOT NULL DEFAULT true,
    "onLike" BOOLEAN NOT NULL DEFAULT true,
    "onCatch" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastFiredAt" TIMESTAMP(3),
    "lastStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PorchTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PorchTrigger_houseId_key" ON "PorchTrigger"("houseId");

-- AddForeignKey
ALTER TABLE "PorchTrigger" ADD CONSTRAINT "PorchTrigger_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;
