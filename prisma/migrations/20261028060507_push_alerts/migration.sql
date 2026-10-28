-- AlterTable
ALTER TABLE "House" ADD COLUMN     "lastLikeAlertAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "alertHost" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "alertLastCall" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "alertLat" DOUBLE PRECISION,
ADD COLUMN     "alertLng" DOUBLE PRECISION,
ADD COLUMN     "alertNearby" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "alertRadiusKm" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "alertSquad" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
