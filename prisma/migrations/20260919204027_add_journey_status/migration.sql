-- CreateEnum
CREATE TYPE "JourneyStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "TravelHistory" ADD COLUMN     "plannedDurationSec" INTEGER,
ADD COLUMN     "status" "JourneyStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "TravelHistory_userId_status_idx" ON "TravelHistory"("userId", "status");

-- Backfill: old rows had no status. `duration = 0` was the prior sentinel
-- for "still active"; every other row was already finalized. The prior
-- code never distinguished a completed journey from an early exit, so
-- finalized rows default to COMPLETED to preserve existing analytics totals.
UPDATE "TravelHistory" SET "status" = 'ACTIVE' WHERE "duration" = 0;
UPDATE "TravelHistory" SET "status" = 'COMPLETED' WHERE "duration" != 0;
