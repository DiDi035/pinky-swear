import { ethers } from "ethers";

import {
  wsJsonRpcProvider,
  CONFIRMATIONS_REQUIRED,
  ESCROW_STATUS_REVERTED_STATE_MACHINE,
} from "./contracts_helper";
import { prisma } from "./db";
import { EventName, Events } from "../generated/prisma/client";

export async function startDetectors() {
  wsJsonRpcProvider.on("block", async (blockNumber: number) => {
    const unfinalizedEvents = await prisma.events.findMany({
      where: { isFinalized: false },
    });
    for (const event of unfinalizedEvents) {
      const confirmations = blockNumber - event.blockNumber;
      if (confirmations >= CONFIRMATIONS_REQUIRED) {
        const block = await wsJsonRpcProvider.getBlock(event.blockNumber);
        if (event.eventName === EventName.ESCROW_CREATED) {
          await handleReorgForEscrowCreatedEvent(event, confirmations, block);
        } else {
          await handleReorgForEscrowEvents(event, confirmations, block);
        }
      } else {
        await prisma.events.update({
          where: { id: event.id },
          data: { confirmations },
        });
      }
    }
  });
}

async function handleReorgForEscrowEvents(
  event: Events,
  confirmations: number,
  block: ethers.Block | null,
) {
  if (reorgDetected(event, block)) {
    const escrow = await prisma.escrows.findUnique({
      where: { id: event.escrowId },
    });
    if (!escrow) {
      throw new Error(`Escrow not found for event ${event.id}`);
    }
    const revertedStatus = ESCROW_STATUS_REVERTED_STATE_MACHINE[escrow.status];
    if (!revertedStatus) {
      throw new Error(`Reverted status not found for escrow ${escrow.id}`);
    }
    await prisma.$transaction([
      prisma.escrows.update({
        where: { id: escrow.id },
        data: { status: revertedStatus },
      }),
      prisma.events.delete({
        where: { id: event.id },
      }),
    ]);
  } else {
    await prisma.events.update({
      where: { id: event.id },
      data: {
        isFinalized: true,
        confirmations: confirmations,
      },
    });
  }
}

async function handleReorgForEscrowCreatedEvent(
  event: Events,
  confirmations: number,
  block: ethers.Block | null,
) {
  if (reorgDetected(event, block)) {
    // Re-org detected
    await prisma.$transaction([
      prisma.escrows.delete({
        where: { id: event.escrowId },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.events.update({
        where: { id: event.id },
        data: {
          isFinalized: true,
          confirmations: confirmations,
        },
      }),
      prisma.escrows.update({
        where: { id: event.escrowId },
        data: {
          isFinalized: true,
        },
      }),
    ]);
  }
}

function reorgDetected(event: Events, block: ethers.Block | null) {
  return !block || block.hash !== event.blockHash;
}
