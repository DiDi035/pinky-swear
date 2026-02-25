import { ethers } from "ethers";

import { prisma } from "./db";
import { EscrowStatus, EventName } from "../generated/prisma/client";
import {
  deployments,
  createHTTPFactoryContracts,
  jsonRpcProvider,
  createHTTPEscrowContracts,
} from "./contracts_helper";

export async function startIndexer() {
  console.log("[DEBUG] Starting indexer...");

  const factoryAddressToStartBlock = deployments.factories.reduce(
    (acc: { [key: string]: number }, factory: any) => {
      acc[factory.address] = factory.startBlock;
      return acc;
    },
    {},
  );
  const escrowFactoryContracts = deployments.factories.map((factory: any) =>
    createHTTPFactoryContracts(factory.address),
  );

  let indexerState = await prisma.indexerState.findFirst();
  let lastIndexedBlock;

  if (!indexerState) {
    lastIndexedBlock = Math.min(
      ...deployments.factories.map((factory: any) => factory.startBlock),
    );
    console.log(`[DEBUG] Fresh start from block: ${lastIndexedBlock}`);
  } else {
    lastIndexedBlock = indexerState.lastIndexedBlock;
    console.log(`[DEBUG] Continuing from block: ${lastIndexedBlock}`);
  }

  console.log("[DEBUG] Starting backfill...");
  await backfill(
    lastIndexedBlock,
    factoryAddressToStartBlock,
    escrowFactoryContracts,
  );
}

async function backfill(
  lastIndexedBlock: number,
  factoryAddressToStartBlock: { [key: string]: number },
  escrowFactoryContracts: ethers.Contract[],
) {
  const currentBlock = await jsonRpcProvider.getBlockNumber();
  const batchSize = 10; // Alchemy free tier limit
  let factoryAddressToEscrowCreatedLogs: { [key: string]: ethers.EventLog[] } =
    {};
  let depositedLogs: ethers.EventLog[] = [];
  let confirmedLogs: ethers.EventLog[] = [];
  let refundedLogs: ethers.EventLog[] = [];
  console.log("[DEBUG] Starting factories scan...");
  for (const factoryContract of escrowFactoryContracts) {
    let from = Math.max(
      factoryAddressToStartBlock[String(factoryContract.target)] ?? 0,
      lastIndexedBlock,
    );
    let escrowCreatedLogs: ethers.EventLog[] = [];
    for (; from <= currentBlock; from += batchSize) {
      const to = Math.min(from + batchSize - 1, currentBlock);
      const escrowCreatedLog = await queryWithRetry(
        factoryContract,
        factoryContract.filters.EscrowCreated(),
        from,
        to,
      );
      escrowCreatedLogs.push(...(escrowCreatedLog as ethers.EventLog[]));

      await sleep(50); // 50ms
    }
    factoryAddressToEscrowCreatedLogs[String(factoryContract.target)] =
      escrowCreatedLogs;
    console.log(
      `[DEBUG] Done scanning factory ${String(factoryContract.target)}, found ${escrowCreatedLogs.length} escrow created logs`,
    );
  }
  const allEscrowCreatedLogs = Object.values(
    factoryAddressToEscrowCreatedLogs,
  ).flat();
  console.log("[DEBUG] Starting escrows scan...");
  for (const escrowCreatedLog of allEscrowCreatedLogs) {
    const escrowContract = createHTTPEscrowContracts(
      escrowCreatedLog.args._escrow,
    );
    let from = Math.max(escrowCreatedLog.blockNumber, lastIndexedBlock);
    for (; from <= currentBlock; from += batchSize) {
      const to = Math.min(from + batchSize - 1, currentBlock);
      const depositedLog = await queryWithRetry(
        escrowContract,
        escrowContract.filters.Deposited(),
        from,
        to,
      );
      const confirmedLog = await queryWithRetry(
        escrowContract,
        escrowContract.filters.Confirmed(),
        from,
        to,
      );
      const refundedLog = await queryWithRetry(
        escrowContract,
        escrowContract.filters.Refunded(),
        from,
        to,
      );
      depositedLogs.push(...(depositedLog as ethers.EventLog[]));
      confirmedLogs.push(...(confirmedLog as ethers.EventLog[]));
      refundedLogs.push(...(refundedLog as ethers.EventLog[]));

      await sleep(50); // 50ms
    }
    console.log(
      `[DEBUG] Done scanning escrow ${String(escrowContract.target)}`,
    );
  }

  console.log("[DEBUG] Start persisting events...");
  await upsertEvents(
    allEscrowCreatedLogs,
    depositedLogs,
    confirmedLogs,
    refundedLogs,
  );

  console.log("[DEBUG] Updating indexer state...");
  await prisma.indexerState.upsert({
    where: { id: "singleton" },
    create: { lastIndexedBlock: currentBlock },
    update: { lastIndexedBlock: currentBlock },
  });
  console.log("[DEBUG] Done");
}

async function upsertEvents(
  escrowCreatedLogs: ethers.EventLog[],
  depositedLogs: ethers.EventLog[],
  confirmedLogs: ethers.EventLog[],
  refundedLogs: ethers.EventLog[],
) {
  const escrowCreatedUpsertPromises = escrowCreatedLogs.map(async (log) => {
    return prisma.$transaction([
      prisma.escrows.upsert({
        where: { id: log.args._escrow },
        create: {
          id: log.args._escrow,
          buyer: log.args._buyer,
          seller: log.args._seller,
          amount: String(log.args._amount),
          // Note: The _deadline from the Solidity event is a uint (Unix timestamp in seconds),
          // which ethers v6 returns as a BigInt. Prisma's DateTime expects a JavaScript Date object:
          // - log.args._deadline — BigInt (seconds since epoch)
          // - Number(...) — convert BigInt to number
          // - * 1000 — JavaScript Date expects milliseconds, Solidity timestamps are in seconds
          deadline: new Date(Number(log.args._deadline) * 1000),
          status: EscrowStatus.AWAITING_DEPOSIT,
          createdTxHash: log.transactionHash,
          createdBlockNumber: log.blockNumber,
        },
        update: {
          createdTxHash: log.transactionHash,
          createdBlockNumber: log.blockNumber,
        },
      }),
      prisma.events.upsert({
        where: {
          txHash_logIndex: { txHash: log.transactionHash, logIndex: log.index },
        },
        create: {
          escrowId: log.args._escrow,
          eventName: EventName.ESCROW_CREATED,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          blockHash: log.blockHash,
          logIndex: log.index,
          data: {
            escrow: log.args._escrow,
            buyer: log.args._buyer,
            seller: log.args._seller,
            amount: String(log.args._amount),
            deadline: new Date(Number(log.args._deadline) * 1000).toString(),
          },
        },
        update: {},
      }),
    ]);
  });

  const depositedUpsertPromises = depositedLogs.map(async (log) => {
    return prisma.$transaction([
      prisma.events.upsert({
        where: {
          txHash_logIndex: { txHash: log.transactionHash, logIndex: log.index },
        },
        create: {
          escrowId: log.args._escrow,
          eventName: EventName.DEPOSITED,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          blockHash: log.blockHash,
          logIndex: log.index,
          data: {
            escrow: log.args._escrow,
            buyer: log.args._buyer,
            amount: String(log.args._amount),
          },
        },
        update: {},
      }),
      prisma.escrows.update({
        where: { id: log.args._escrow },
        data: {
          status: EscrowStatus.DEPOSITED,
        },
      }),
    ]);
  });

  const confirmedUpsertPromises = confirmedLogs.map(async (log) => {
    return prisma.$transaction([
      prisma.events.upsert({
        where: {
          txHash_logIndex: { txHash: log.transactionHash, logIndex: log.index },
        },
        create: {
          escrowId: log.args._escrow,
          eventName: EventName.CONFIRMED,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          blockHash: log.blockHash,
          logIndex: log.index,
          data: {
            escrow: log.args._escrow,
            seller: log.args._seller,
            amount: String(log.args._amount),
          },
        },
        update: {},
      }),
      prisma.escrows.update({
        where: { id: log.args._escrow },
        data: {
          status: EscrowStatus.CONFIRMED,
        },
      }),
    ]);
  });

  const refundedUpsertPromises = refundedLogs.map(async (log) => {
    return prisma.$transaction([
      prisma.events.upsert({
        where: {
          txHash_logIndex: { txHash: log.transactionHash, logIndex: log.index },
        },
        create: {
          escrowId: log.args._escrow,
          eventName: EventName.REFUNDED,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          blockHash: log.blockHash,
          logIndex: log.index,
          data: {
            escrow: log.args._escrow,
            buyer: log.args._buyer,
            amount: String(log.args._amount),
          },
        },
        update: {},
      }),
      prisma.escrows.update({
        where: { id: log.args._escrow },
        data: {
          status: EscrowStatus.REFUNDED,
        },
      }),
    ]);
  });

  console.log("[DEBUG] Persisting escrow created events");
  await Promise.all(escrowCreatedUpsertPromises);
  console.log("[DEBUG] Persisting deposited events");
  await Promise.all(depositedUpsertPromises);
  console.log("[DEBUG] Persisting confirmed events");
  await Promise.all(confirmedUpsertPromises);
  console.log("[DEBUG] Persisting refunded events");
  await Promise.all(refundedUpsertPromises);
  console.log("[DEBUG] Done persisting events");
}

async function queryWithRetry(
  contract: ethers.Contract,
  filter: ethers.ContractEventName,
  from: number,
  to: number,
  maxRetries: number = 3,
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await contract.queryFilter(filter, from, to);
    } catch (error: any) {
      if (error?.error?.code === 429 && attempt < maxRetries - 1) {
        const delay = 1000 * (attempt + 1);
        console.log(`[DEBUG] Rate limited, retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  return [];
}

// Simple helper to tackle rate limiting issue from Alchemy free tier
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
