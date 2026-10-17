# Aetheron Smart Contracts (Archived / Local Development Reference)

> **Notice**: As defined in [`PROJECT_STATUS.md`](../PROJECT_STATUS.md), this directory contains local testing implementations and prototype contracts for mobile and SDK integration.

## Canonical Repositories

| Component | Canonical Location | Description |
| :--- | :--- | :--- |
| **Sentinel Guardrails & L3 Relay** | [`MastaTrill/Aetheron-Sentinel-L3`](https://github.com/MastaTrill/Aetheron-Sentinel-L3) | Production Sentinel nodes, anomaly detection, slashing, and L3 message relay. |
| **Platform Token & Governance** | [`MastaTrill/Aetheron_platform`](https://github.com/MastaTrill/Aetheron_platform) | Commercial token, presale, staking, and treasury releases. |
| **AI Agent Intelligence** | [`MastaTrill/JarvisAI`](https://github.com/MastaTrill/JarvisAI) | Agent runtime and autonomous execution models. |

## Local Contracts Overview

The contracts here are preserved for local integration tests and developer SDK mocking:

- `AetheronToken.sol` — ERC-20 reference token with minting cap and voting extensions.
- `AetheronGlyphs.sol` — ERC-721 NFT collection (OpenZeppelin v5 compatible).
- `KeeperRegistry.sol` — Keeper staking, execution tracking, and slashing cooldowns.
- `EpochManager.sol` — Epoch transitions and periodic reward distribution.
- `Sentinel.sol` — Network anomaly detection and health monitor node registration.
- `L3Relay.sol` — Cross-chain message dispatching between Base L2 and Aetheron L3.
- `Treasury.sol` — Protocol treasury with emission reception limits.
- `AetherTimelock.sol` & `AetherGovernor.sol` — OpenZeppelin governance stack.

## Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Base Sepolia (local testing)
npm run deploy:sepolia
```
