# Project Structure

```
pinky-swear/
├── contracts/          # Solidity smart contracts (Hardhat 3)
│   ├── contracts/      # Escrow.sol, EscrowFactory.sol
│   ├── test/           # Mocha/ethers.js integration tests
│   └── deployments/    # Recorded addresses + ABIs
├── indexer/            # Event indexer + REST API
│   ├── src/            # TypeScript source
│   └── prisma/         # Database schema + migrations
└── .github/workflows/  # CI/CD pipelines
```

| Package | Details |
|---------|---------|
| [**contracts/**](../contracts/) | Escrow + Factory contracts, Hardhat 3, Foundry + Mocha tests, Sepolia deployment |
| [**indexer/**](../indexer/) | Event backfiller, WebSocket listeners, reorg detection, Express REST API, Prisma + PostgreSQL |
