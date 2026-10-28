-- AlterTable
ALTER TABLE "House" ADD COLUMN     "bracket" TEXT;

-- CreateIndex
CREATE INDEX "House_season_bracket_idx" ON "House"("season", "bracket");
