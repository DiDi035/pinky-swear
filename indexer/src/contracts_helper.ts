import { ethers } from "ethers";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { EscrowStatus } from "../generated/prisma/client";

export enum EventNames {
  ESCROW_CREATED = "EscrowCreated",
  DEPOSITED = "Deposited",
  CONFIRMED = "Confirmed",
  REFUNDED = "Refunded",
}

export const CONFIRMATIONS_REQUIRED = 12;

export const ESCROW_STATUS_REVERTED_STATE_MACHINE = {
  [EscrowStatus.AWAITING_DEPOSIT]: EscrowStatus.AWAITING_DEPOSIT,
  [EscrowStatus.DEPOSITED]: EscrowStatus.AWAITING_DEPOSIT,
  [EscrowStatus.CONFIRMED]: EscrowStatus.DEPOSITED,
  [EscrowStatus.REFUNDED]: EscrowStatus.DEPOSITED,
};

export const deployments = JSON.parse(
  readFileSync(
    resolve(
      __dirname,
      `../../contracts/deployments/${process.env.NETWORK}.json`,
    ),
    "utf-8",
  ),
);

export const escrowFactoryAbis = JSON.parse(
  readFileSync(
    resolve(__dirname, `../../contracts/deployments/abis/EscrowFactory.json`),
    "utf-8",
  ),
);

export const escrowAbis = JSON.parse(
  readFileSync(
    resolve(__dirname, `../../contracts/deployments/abis/Escrow.json`),
    "utf-8",
  ),
);

export const jsonRpcProvider = new ethers.JsonRpcProvider(
  process.env.RPC_HTTPS_URL as string,
);

export const wsJsonRpcProvider = new ethers.WebSocketProvider(
  process.env.RPC_WS_URL as string,
);

export function createHTTPFactoryContracts(address: string) {
  return new ethers.Contract(address, escrowFactoryAbis, jsonRpcProvider);
}

export function createHTTPEscrowContracts(address: string) {
  return new ethers.Contract(address, escrowAbis, jsonRpcProvider);
}

export function createWebSocketFactoryContracts(address: string) {
  return new ethers.Contract(address, escrowFactoryAbis, wsJsonRpcProvider);
}

export function createWebSocketEscrowContracts(address: string) {
  return new ethers.Contract(address, escrowAbis, wsJsonRpcProvider);
}
