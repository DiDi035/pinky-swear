# Contracts

Smart contracts for the Pinky-swear escrow dApp.

## Local Development Setup

### Prerequisites

- Node.js (see `.tool-versions` for version)
- npm

### Installation

```bash
cd contracts
npm install
```

### Commands

```bash
npm run compile          # Compile contracts
npm test                 # Run all tests
npm run test:sol         # Run Solidity tests only
npm run test:ts          # Run TypeScript tests only
npm run clean            # Clear artifacts/cache
```

## Testnet Deployment

### Prerequisites

1. Create a dedicated MetaMask wallet for deployment (not your main wallet)
2. Get free Sepolia ETH from a faucet:
   - https://cloud.google.com/application/web3/faucet/ethereum/sepolia (no signup)
   - https://sepoliafaucet.com (requires Alchemy account)
3. Get a free RPC URL from Alchemy or Infura
4. Get a free Etherscan API key from https://etherscan.io/apis

### Setup Secrets

```bash
npx hardhat keystore set SEPOLIA_RPC_URL      # Alchemy/Infura RPC URL
npx hardhat keystore set SEPOLIA_PRIVATE_KEY  # Deployer wallet private key
npx hardhat keystore set ETHERSCAN_API_KEY    # Etherscan API key
```

### Deploy to Sepolia

```bash
npm run deploy:sepolia
```

Deployment addresses are saved in `ignition/deployments/chain-11155111/deployed_addresses.json`
