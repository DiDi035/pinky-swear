# Project Structure

```
pinky-swear/
├── contracts/          # Solidity smart contracts (Hardhat 3)
│   ├── contracts/      # Escrow.sol, EscrowFactory.sol
│   ├── test/           # Mocha/ethers.js integration tests
│   └── deployments/    # Recorded addresses + ABIs
├── frontend/           # React SPA (Vite)
│   ├── src/            # Components, pages, hooks, lib
│   └── Dockerfile      # Multi-stage build (Nginx)
├── indexer/            # Event indexer + REST API
│   ├── src/            # TypeScript source
│   └── prisma/         # Database schema + migrations
└── .github/workflows/  # CI/CD pipelines
```

| Package | Details |
|---------|---------|
| [**contracts/**](../contracts/) | Escrow + Factory contracts, Hardhat 3, Foundry + Mocha tests, Sepolia deployment |
| [**frontend/**](../frontend/) | React 19 SPA, Wagmi + RainbowKit wallet integration, CSS Modules, Vite |
| [**indexer/**](../indexer/) | Event backfiller, WebSocket listeners, reorg detection, Express REST API, Prisma + PostgreSQL |
