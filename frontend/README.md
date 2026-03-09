# Frontend

React SPA for interacting with the Pinky Swear escrow contracts. Browse escrows, create new ones, deposit funds, confirm delivery, or claim refunds — all through a wallet-connected interface.

## Setup

```bash
cd frontend
cp .env.example .env    # Configure VITE_API_URL and VITE_WALLETCONNECT_PROJECT_ID
npm install
npm run dev             # Start dev server (Vite)
```

Requires the [indexer](../indexer/) API running on port 4000 and a WalletConnect project ID.

## Commands

```bash
npm run dev             # Start dev server with HMR
npm run build           # Type-check + production build
npm run preview         # Preview production build locally
npm run lint            # Run ESLint
```

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Landing page with 3-step explainer |
| `/create` | CreateEscrow | Form to deploy a new escrow (owner-only) |
| `/escrows` | EscrowList | Browsable grid with buyer/seller filters and pagination |
| `/escrows/:address` | EscrowDetail | Escrow state, action buttons, event timeline |

## Key Directories

```
frontend/
├── src/
│   ├── components/     # Reusable UI (EscrowCard, StatusPill, ProgressStepper, etc.)
│   ├── hooks/          # useEscrow, useEscrows, useCountdown
│   ├── lib/            # API client, contract ABIs/addresses, formatting utils
│   ├── pages/          # Route-level page components
│   └── styles/         # Global CSS variables, animations
├── Dockerfile          # Multi-stage build (Node → Nginx)
└── nginx.conf          # SPA fallback config
```

## Provider Stack

```
WagmiProvider → QueryClientProvider → RainbowKitProvider → BrowserRouter
```

Wagmi config (`src/wagmi.ts`) targets Sepolia only, using RainbowKit's default wallet connectors.

## Styling

CSS Modules per component, no framework. Global design tokens in `src/styles/global.css`:

- **Fonts**: Fredoka (display), DM Sans (body), JetBrains Mono (addresses)
- **Palette**: warm cream base, pink/mint/sunny/lilac accent colors
- **Style**: thick borders, offset box-shadows, rounded corners

## Deployment

Multi-stage Docker build: Vite builds static assets, Nginx serves them. `VITE_API_URL` is baked in at build time via build arg.
