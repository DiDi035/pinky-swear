# Indexer

Event indexer and REST API for the Pinky Swear escrow dApp. Tracks on-chain escrow events, persists them to PostgreSQL, and serves them through a REST API.

## Startup Sequence

```mermaid
flowchart LR
    Start([Start]) --> BF[Backfill<br/>historical events]
    BF --> LS[Attach WebSocket<br/>listeners]
    LS --> RD[Start reorg<br/>detectors]
    RD --> API[Start REST API<br/>:4000]
```

## Data Flow

```mermaid
flowchart TB
    subgraph Ethereum
        FC[Factory Contract]
        EC[Escrow Contracts]
    end

    subgraph Indexer
        direction TB
        BF[Backfiller<br/><i>HTTP provider, batches of 10 blocks</i>]
        LS[WebSocket Listeners<br/><i>real-time events</i>]
        RD[Reorg Detector<br/><i>verifies block hashes after 12 confirmations</i>]
    end

    DB[(PostgreSQL)]
    API[REST API :4000]

    FC -->|"EscrowCreated"| BF
    FC -->|"EscrowCreated"| LS
    EC -->|"Deposited, Confirmed, Refunded"| BF
    EC -->|"Deposited, Confirmed, Refunded"| LS

    BF -->|upsert| DB
    LS -->|insert| DB
    RD -->|"verify & finalize<br/>or rollback"| DB
    API -->|query| DB
```

## Reorg Detection

The indexer tracks block confirmations for every event. After 12 confirmations, it compares the stored `blockHash` against the canonical chain:

```mermaid
flowchart TD
    NewBlock[New block received] --> Check{Unfinalized<br/>events?}
    Check -->|No| Done([Wait for next block])
    Check -->|Yes| Conf{">= 12<br/>confirmations?"}
    Conf -->|No| Update[Update confirmation count]
    Conf -->|Yes| Hash{Block hash<br/>matches?}
    Hash -->|Yes| Finalize[Mark event + escrow as finalized]
    Hash -->|No| Rollback[Delete event, revert escrow status]
    Update --> Done
    Finalize --> Done
    Rollback --> Done
```

## API Endpoints

| Method | Path                       | Query Params                                  | Description                       |
| ------ | -------------------------- | --------------------------------------------- | --------------------------------- |
| `GET`  | `/escrows`                 | `buyer`, `seller`, `offset`, `limit`, `order` | List escrows (paginated, max 100) |
| `GET`  | `/escrows/:address`        | —                                             | Get escrow with all events        |
| `GET`  | `/escrows/:address/status` | —                                             | Get escrow finalization status    |
| `GET`  | `/events/:id`              | —                                             | Get a single event                |
| `GET`  | `/events/:id/status`       | —                                             | Get event finalization status     |

## Database Schema

Three Prisma models in `prisma/schema.prisma`:

| Model            | Key                                | Purpose                                                |
| ---------------- | ---------------------------------- | ------------------------------------------------------ |
| **Escrows**      | contract address                   | Escrow state (buyer, seller, amount, deadline, status) |
| **Events**       | uuid (unique on txHash + logIndex) | On-chain events linked to escrows                      |
| **IndexerState** | singleton                          | Tracks `lastIndexedBlock` for resumable backfilling    |

## Development

### Prerequisites

- Node.js 22.10.0 (see `.tool-versions`)
- PostgreSQL running locally

### Setup

```bash
cd indexer
npm install
cp .env.example .env   # then fill in values
npx prisma generate
npx prisma migrate dev
```

### Environment Variables

| Variable        | Description                                                  |
| --------------- | ------------------------------------------------------------ |
| `DATABASE_URL`  | PostgreSQL connection string                                 |
| `RPC_HTTPS_URL` | Ethereum HTTP RPC (e.g. Alchemy)                             |
| `RPC_WS_URL`    | Ethereum WebSocket RPC                                       |
| `NETWORK`       | Network name matching `contracts/deployments/{network}.json` |

### Run

```bash
npx tsx src/index.ts
```
