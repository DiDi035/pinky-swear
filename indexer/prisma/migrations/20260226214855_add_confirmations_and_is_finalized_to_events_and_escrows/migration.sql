-- AlterTable
ALTER TABLE "Escrows" ADD COLUMN     "isFinalized" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Events" ADD COLUMN     "confirmations" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isFinalized" BOOLEAN NOT NULL DEFAULT false;
