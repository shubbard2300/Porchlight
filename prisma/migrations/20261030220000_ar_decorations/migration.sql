-- AlterTable
ALTER TABLE "House" ADD COLUMN "arGreeting" TEXT;

-- CreateTable
CREATE TABLE "ArDecoration" (
    "id" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArDecoration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArDecoration_houseId_position_idx" ON "ArDecoration"("houseId", "position");

-- AddForeignKey
ALTER TABLE "ArDecoration" ADD CONSTRAINT "ArDecoration_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;
