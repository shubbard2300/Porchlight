-- CreateTable
CREATE TABLE "HousePhoto" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "houseId" TEXT,
    "url" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "locationSource" TEXT,
    "takenAt" TIMESTAMP(3),
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HousePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HousePhotoFile" (
    "photoId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "HousePhotoFile_pkey" PRIMARY KEY ("photoId")
);

-- CreateIndex
CREATE INDEX "HousePhoto_houseId_idx" ON "HousePhoto"("houseId");

-- CreateIndex
CREATE INDEX "HousePhoto_ownerId_idx" ON "HousePhoto"("ownerId");

-- AddForeignKey
ALTER TABLE "HousePhoto" ADD CONSTRAINT "HousePhoto_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HousePhoto" ADD CONSTRAINT "HousePhoto_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HousePhotoFile" ADD CONSTRAINT "HousePhotoFile_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "HousePhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
