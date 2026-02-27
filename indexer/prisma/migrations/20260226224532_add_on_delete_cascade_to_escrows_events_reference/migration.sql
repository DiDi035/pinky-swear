-- DropForeignKey
ALTER TABLE "Events" DROP CONSTRAINT "Events_escrowId_fkey";

-- AddForeignKey
ALTER TABLE "Events" ADD CONSTRAINT "Events_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES "Escrows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
