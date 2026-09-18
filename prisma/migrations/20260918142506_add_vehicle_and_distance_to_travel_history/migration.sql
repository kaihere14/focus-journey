/*
  Warnings:

  - Added the required column `distance` to the `TravelHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicle` to the `TravelHistory` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Vehicle" AS ENUM ('CAR', 'MOTORCYCLE', 'BICYCLE', 'WALKING');

-- AlterTable
ALTER TABLE "TravelHistory" ADD COLUMN     "distance" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "vehicle" "Vehicle" NOT NULL;
