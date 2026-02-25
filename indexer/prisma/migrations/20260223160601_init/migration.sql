-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('AWAITING_DEPOSIT', 'DEPOSITED', 'CONFIRMED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EventName" AS ENUM ('ESCROW_CREATED', 'DEPOSITED', 'CONFIRMED', 'REFUNDED');

-- CreateTable
CREATE TABLE "Escrows" (
    "id" TEXT NOT NULL,
    "buyer" TEXT NOT NULL,
    "seller" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "EscrowStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdTxHash" TEXT NOT NULL,
    "createdBlockNumber" INTEGER NOT NULL,

    CONSTRAINT "Escrows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Events" (
    "id" TEXT NOT NULL,
    "escrowId" TEXT NOT NULL,
    "eventName" "EventName" NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "blockHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexerState" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "lastIndexedBlock" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndexerState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Events_txHash_logIndex_key" ON "Events"("txHash", "logIndex");

-- AddForeignKey
ALTER TABLE "Events" ADD CONSTRAINT "Events_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "Escrows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
