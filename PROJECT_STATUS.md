# Aetheron — Repository Status

**Status:** Maintenance / consolidation candidate  
**Canonical role:** Legacy application, mobile, multichain, and SDK source for the Aetheron ecosystem.

## Canonical project locations

- Commercial token, presale, staking, and public platform: `MastaTrill/Aetheron_platform`
- Sentinel security guardrails: `MastaTrill/Aetheron-Sentinel-L3`
- AI-agent platform: `MastaTrill/JarvisAI`

## Keep here

- Mobile-client code that can be reused by Aetheron Platform
- Reusable SDK and API-client code
- Multichain research not yet approved for production
- Historical application prototypes

## Do not treat as canonical

- Token addresses
- Presale addresses
- Production deployment instructions
- Sentinel release contracts
- Main public website configuration

## Cleanup queue

- [x] Inventory unique mobile and SDK components.
- [x] Move production-ready components into a clearly named `mobile/` or `sdk/` package.
- [x] Remove or archive duplicate smart contracts after comparing them with canonical repositories (see `aetheron-contracts/README.md`).
- [x] Replace duplicated deployment documentation with links to canonical registries.
- [ ] Archive this repository after unique code is migrated, or rename it to reflect its final mobile/SDK role.

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
  * `ApiService.js`: HTTP and WebSocket communication client for Aetheron node and backend endpoints.

### 2. Developer SDK (`sdk.js`)
* **Client Class**: `AetheronSDK`
* **Features**:
  * Blockchain query methods (`getBlockchain`, `getBlock`, `getTransaction`, `getBalance`).
  * Wallet operations (`createWallet`, `importWallet`, `exportWallet`).
  * Transaction dispatch & mining simulation (`createTransaction`, `mineBlock`).
  * WebSocket real-time subscription client (`subscribe`, `on`, `emit`).
