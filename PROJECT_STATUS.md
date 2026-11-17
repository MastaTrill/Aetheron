# Aetheron — Repository Status

**Status:** Finalized (`@aetheron/sdk` + Mobile Client + Local Contract Reference)  
**Canonical role:** Official Developer SDK (`sdk/`), Mobile Wallet Client (`mobile/`), and local Hardhat reference contracts (`aetheron-contracts/`) for the Aetheron & Sentinel L3 ecosystem.

## Canonical project locations

- Commercial token, presale, staking, and public platform: `MastaTrill/Aetheron_platform`
- Sentinel security guardrails (`v0.2.0`): `MastaTrill/Aetheron-Sentinel-L3`
- AI-agent platform: `MastaTrill/JarvisAI`

## Keep here

- Mobile-client code (`mobile/`) integrated with Aetheron Platform and Sentinel L3 health checks
- Standalone `@aetheron/sdk` (`sdk/`) with Sentinel L3 risk evaluation and L3Relay status methods
- Local Hardhat reference contracts (`aetheron-contracts/`) and deployment scripts for Base Sepolia (`chainId: 84532`)
- Historical application prototypes

## Do not treat as canonical

- Mainnet commercial token and presale addresses (see `MastaTrill/Aetheron_platform`)
- Production Sentinel L3 Python interceptor nodes (see `MastaTrill/Aetheron-Sentinel-L3`)

## Cleanup queue

- [x] Inventory unique mobile and SDK components.
- [x] Move production-ready components into a clearly named `mobile/` or `sdk/` package.
- [x] Remove or archive duplicate smart contracts after comparing them with canonical repositories (see `aetheron-contracts/README.md`).
- [x] Replace duplicated deployment documentation with links to canonical registries.
- [x] Finalize this repository's role as the dedicated Aetheron Mobile Client & `@aetheron/sdk` source with Sentinel L3 integration.

## Component Inventory

### 1. Mobile Client (`mobile/`)
* **Screens (`mobile/src/screens/`)**:
  * `WelcomeScreen.js`: User onboarding, wallet generation and recovery entry point.
  * `WalletScreen.js`: Main account dashboard, asset balance overview, quick action buttons.
  * `SendScreen.js`: Token transfer interface with recipient validation and fee estimation.
  * `ReceiveScreen.js`: Deposit screen with dynamic QR code generation.
  * `ScanScreen.js`: Camera-based QR code scanner for wallet addresses and invoice payloads.
  * `TransactionHistoryScreen.js`: Chronological transaction ledger with status filtering.
  * `SettingsScreen.js`: Network switcher (Base / Sepolia / local), security, and RPC configuration.
* **Services (`mobile/src/services/`)**:
  * `WalletService.js`: Key management, mnemonic seed generation, and secure local keychain storage.
  * `ApiService.js`: HTTP and WebSocket communication client for Aetheron node, Sentinel L3 health (`getSentinelHealth`, `evaluateBridgeRisk`), and L3Relay (`getL3RelayMessageStatus`).

### 2. Developer SDK (`sdk/` & `sdk.js`)
* **Client Class**: `AetheronSDK` (`@aetheron/sdk` v1.1.0)
* **Features**:
  * Blockchain query methods (`getBlockchain`, `getBlock`, `getTransaction`, `getBalance`).
  * Wallet operations (`createWallet`, `importWallet`, `exportWallet`).
  * Sentinel L3 & L3Relay guardrails (`getSentinelHealth`, `getSentinelNodeStatus`, `reportSentinelAnomaly`, `evaluateBridgeRisk`, `submitL3RelayMessage`, `getL3RelayMessageStatus`).
  * Transaction dispatch & mining simulation (`createTransaction`, `mineBlock`).
  * WebSocket real-time subscription client (`subscribe`, `on`, `emit`).
