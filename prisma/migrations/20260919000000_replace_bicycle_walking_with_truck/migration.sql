-- AlterEnum
BEGIN;
CREATE TYPE "Vehicle_new" AS ENUM ('CAR', 'MOTORCYCLE', 'TRUCK');
ALTER TABLE "TravelHistory" ALTER COLUMN "vehicle" TYPE "Vehicle_new" USING ("vehicle"::text::"Vehicle_new");
ALTER TYPE "Vehicle" RENAME TO "Vehicle_old";
ALTER TYPE "Vehicle_new" RENAME TO "Vehicle";
DROP TYPE "Vehicle_old";
COMMIT;
