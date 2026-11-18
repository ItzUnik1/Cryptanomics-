# CRYPTANOMICS

A mobile-first, real-inspired cryptocurrency trading simulation. This is a fictional market; it does not connect to real exchanges or use real funds.

## Phase 1 scope

- 15 fictional crypto assets with independently simulated price movements.
- Dashboard, market list, search, asset selection, and price chart.
- Buy/sell orders with 0.15% fees and balance/quantity validation.
- Portfolio valuation, average entry, unrealised P/L, and transaction history.
- Market mood, simulated news events, and manual day advancement.
- Local save/load using browser storage.
- Responsive dark trading-terminal interface.
- Capacitor Android packaging and a GitHub Actions debug APK workflow.

## Starting position

The player begins on Day 1 with **0 CR**, no holdings, no business, no exchange, and no debt. No starter cash is granted.

## Run locally

```bash
npm install
npm run dev
```

Create a production web build:

```bash
npm run build
```

## Android

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

The GitHub Actions workflow builds a debug APK on pushes affecting app files. Download it from the completed workflow's Artifacts section.

## Notes

This is an early Phase 1 scaffold. The zero-cash opening state is intentional. A future progression system needs to provide a balanced way to earn initial capital without granting a large free balance.
