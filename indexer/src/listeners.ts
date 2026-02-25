import { ethers } from "ethers";

import { prisma } from "./db";
import {
  createWebSocketFactoryContracts,
  createWebSocketEscrowContracts,
  deployments,
  EventNames,
} from "./contracts_helper";
import { EventName, EscrowStatus } from "../generated/prisma/client";

export async function startListeners() {
  console.log("[DEBUG] Starting listeners...");

  console.log("[DEBUG] Constructing escrow contracts and starting listeners");
  const allEscrows = await prisma.escrows.findMany();
  for (const escrow of allEscrows) {
    const escrowContract = createWebSocketEscrowContracts(escrow.id);
    startEscrowListener(escrowContract);
  }

  console.log("[DEBUG] Constructing factory contracts and starting listeners");
  const allFactories = deployments.factories.map((factory: any) => {
    return createWebSocketFactoryContracts(factory.address);
  });
  for (const factory of allFactories) {
    startFactoryListener(factory);
  }
  console.log("[DEBUG] Listeners started");
}

async function startEscrowListener(escrowContract: ethers.Contract) {
  escrowContract.on(
    EventNames.DEPOSITED,
    async (
      address: string,
      buyer: string,
      amount: bigint,
      event: ethers.ContractEventPayload,
    ) => {
      await prisma.$transaction([
        prisma.events.create({
          data: {
            escrowId: address,
            eventName: EventName.DEPOSITED,
            txHash: event.log.transactionHash,
            blockNumber: event.log.blockNumber,
            blockHash: event.log.blockHash,
            logIndex: event.log.index,
            data: {
              escrow: address,
              buyer: buyer,
              amount: String(amount),
            },
          },
        }),
        prisma.escrows.update({
          where: { id: address },
          data: {
            status: EscrowStatus.DEPOSITED,
          },
        }),
      ]);
      await prisma.indexerState.updateMany({
        where: {
          id: "singleton",
          lastIndexedBlock: { lt: event.log.blockNumber },
        },
        data: { lastIndexedBlock: event.log.blockNumber },
      });
    },
  );
  escrowContract.on(
    EventNames.CONFIRMED,
    async (
      address: string,
      seller: string,
      amount: bigint,
      event: ethers.ContractEventPayload,
    ) => {
      await prisma.$transaction([
        prisma.events.create({
          data: {
            escrowId: address,
            eventName: EventName.CONFIRMED,
            txHash: event.log.transactionHash,
            blockNumber: event.log.blockNumber,
            blockHash: event.log.blockHash,
            logIndex: event.log.index,
            data: {
              escrow: address,
              seller: seller,
              amount: String(amount),
            },
          },
        }),
        prisma.escrows.update({
          where: { id: address },
          data: {
            status: EscrowStatus.CONFIRMED,
          },
        }),
      ]);
      await prisma.indexerState.updateMany({
        where: {
          id: "singleton",
          lastIndexedBlock: { lt: event.log.blockNumber },
        },
        data: { lastIndexedBlock: event.log.blockNumber },
      });
    },
  );
  escrowContract.on(
    EventNames.REFUNDED,
    async (
      address: string,
      buyer: string,
      amount: bigint,
      event: ethers.ContractEventPayload,
    ) => {
      await prisma.$transaction([
        prisma.events.create({
          data: {
            escrowId: address,
            eventName: EventName.REFUNDED,
            txHash: event.log.transactionHash,
            blockNumber: event.log.blockNumber,
            blockHash: event.log.blockHash,
            logIndex: event.log.index,
            data: {
              escrow: address,
              buyer: buyer,
              amount: String(amount),
            },
          },
        }),
        prisma.escrows.update({
          where: { id: address },
          data: {
            status: EscrowStatus.REFUNDED,
          },
        }),
      ]);
      await prisma.indexerState.updateMany({
        where: {
          id: "singleton",
          lastIndexedBlock: { lt: event.log.blockNumber },
        },
        data: { lastIndexedBlock: event.log.blockNumber },
      });
    },
  );
}

async function startFactoryListener(factoryContract: ethers.Contract) {
  factoryContract.on(
    EventNames.ESCROW_CREATED,
    async (
      address: string,
      buyer: string,
      seller: string,
      amount: bigint,
      deadline: bigint,
      event: ethers.ContractEventPayload,
    ) => {
      await prisma.$transaction([
        prisma.escrows.create({
          data: {
            id: address,
            buyer: buyer,
            seller: seller,
            amount: String(amount),
            deadline: new Date(Number(deadline) * 1000),
            status: EscrowStatus.AWAITING_DEPOSIT,
            createdTxHash: event.log.transactionHash,
            createdBlockNumber: event.log.blockNumber,
          },
        }),
        prisma.events.create({
          data: {
            escrowId: address,
            eventName: EventName.ESCROW_CREATED,
            txHash: event.log.transactionHash,
            blockNumber: event.log.blockNumber,
            blockHash: event.log.blockHash,
            logIndex: event.log.index,
            data: {
              escrow: address,
              buyer: buyer,
              seller: seller,
              amount: String(amount),
              deadline: new Date(Number(deadline) * 1000).toString(),
            },
          },
        }),
      ]);

      await prisma.indexerState.updateMany({
        where: {
          id: "singleton",
          lastIndexedBlock: { lt: event.log.blockNumber },
        },
        data: { lastIndexedBlock: event.log.blockNumber },
      });

      const newEscrowContract = createWebSocketEscrowContracts(address);
      startEscrowListener(newEscrowContract);
    },
  );
}
