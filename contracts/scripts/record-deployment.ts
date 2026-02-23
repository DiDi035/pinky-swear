import { readFileSync, writeFileSync, createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { ethers } from "ethers";

const NETWORKS: Record<string, { chainId: number; rpcEnvVar: string }> = {
  sepolia: { chainId: 11155111, rpcEnvVar: "SEPOLIA_RPC_URL" },
};

const FACTORY_FUTURE_ID = "EscrowFactoryModule#EscrowFactory";

async function main() {
  const network = process.argv[2];
  if (!network || !NETWORKS[network]) {
    console.error(`Usage: record-deployment.ts <network>`);
    console.error(`Available networks: ${Object.keys(NETWORKS).join(", ")}`);
    process.exit(1);
  }

  const { chainId, rpcEnvVar } = NETWORKS[network];
  const rpcUrl = process.env[rpcEnvVar];
  if (!rpcUrl) {
    console.error(`Missing env var: ${rpcEnvVar}`);
    process.exit(1);
  }

  const ignitionDir = resolve(`ignition/deployments/chain-${chainId}`);
  const addressesPath = resolve(ignitionDir, "deployed_addresses.json");
  const addresses = JSON.parse(readFileSync(addressesPath, "utf-8"));
  const address = addresses[FACTORY_FUTURE_ID];
  if (!address) {
    console.error(`Factory address not found in ${addressesPath}`);
    process.exit(1);
  }

  const journalPath = resolve(ignitionDir, "journal.jsonl");
  const txHash = await findDeployTxHash(journalPath);
  if (!txHash) {
    console.error(`Deploy transaction not found in ${journalPath}`);
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
    console.error(`Transaction receipt not found for ${txHash}`);
    process.exit(1);
  }
  const startBlock = receipt.blockNumber;

  const deploymentsPath = resolve(`deployments/${network}.json`);
  let deployments: { factories: Array<{ address: string; version: number; active: boolean; startBlock: number }> };
  try {
    deployments = JSON.parse(readFileSync(deploymentsPath, "utf-8"));
  } catch {
    deployments = { factories: [] };
  }

  const factories = deployments.factories ?? [];

  const maxVersion = factories.reduce(
    (max, f) => Math.max(max, f.version),
    0,
  );

  for (const factory of factories) {
    factory.active = false;
  }
  deployments.factories = factories;

  deployments.factories.push({
    address,
    version: maxVersion + 1,
    active: true,
    startBlock,
  });

  writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2) + "\n");

  console.log(`Recorded factory deployment:`);
  console.log(`  Address:    ${address}`);
  console.log(`  Block:      ${startBlock}`);
  console.log(`  Version:    ${maxVersion + 1}`);
  console.log(`  Network:    ${network}`);
}

async function findDeployTxHash(journalPath: string): Promise<string | null> {
  const rl = createInterface({
    input: createReadStream(journalPath),
    crlfDelay: Infinity,
  });

  let txHash: string | null = null;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let entry;
    try {
      entry = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (entry.type === "TRANSACTION_SEND" && entry.futureId === FACTORY_FUTURE_ID) {
      txHash = entry.transaction.hash;
    }
  }

  return txHash;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
