// SPDX-License-Identifier: MIT
// Post-deploy wiring script for Aetheron / Sentinel / L3
// Run AFTER deploy.js has completed successfully.
//
// This script performs:
//   1. Grant minter role on AetheronToken to EpochManager
//   2. Register initial keepers (KEEPER1, KEEPER2) in KeeperRegistry
//   3. Record initial stakes for keepers
//   4. Set EpochManager as authorized on Treasury (via receiveEmission)
//   5. Verify Sentinel system health status
//   6. Transfer ownership of all contracts to Timelock for governance
//   7. Verify all role assignments and ownership transfers

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Running post-deploy wiring with account:", deployer.address);

    // Load deployed addresses
    const addressesPath = path.join(__dirname, "..", "deployments", "addresses.json");
    if (!fs.existsSync(addressesPath)) {
        throw new Error("addresses.json not found. Run deploy.js first.");
    }
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

    // Attach to deployed contracts
    const aeth = await hre.ethers.getContractAt("AetheronToken", addresses.aetherToken);
    const keeperRegistry = await hre.ethers.getContractAt("KeeperRegistry", addresses.keeperRegistry);
    const treasury = await hre.ethers.getContractAt("Treasury", addresses.treasury);
    const epochManager = await hre.ethers.getContractAt("EpochManager", addresses.epochManager);
    const sentinel = await hre.ethers.getContractAt("Sentinel", addresses.sentinel);
    const l3Relay = await hre.ethers.getContractAt("L3Relay", addresses.l3Relay);

    // Governance verification must never perform setup writes or approvals.
    // Use OWNERSHIP_PHASE=propose only for an explicitly authorized handoff.
    if ((process.env.OWNERSHIP_PHASE || "verify") === "verify") {
        await verifyOwnership(hre, addresses);
        return;
    }
    if (process.env.OWNERSHIP_PHASE !== "propose") {
        throw new Error("OWNERSHIP_PHASE must be verify or propose");
    }

    // Wire the AETH reference into KeeperRegistry so withdrawAETH can move any
    // rewards/refunds that land there.
    const setAethTx = await keeperRegistry.setAeth(addresses.aetherToken);
    await setAethTx.wait();
    console.log("  ✅ KeeperRegistry AETH reference set");

    // ──────────────────────────────────────────────
    // 1. Grant minter role to EpochManager
    // ──────────────────────────────────────────────
    console.log("\n[1/6] Granting minter role to EpochManager...");
    const grantTx = await aeth.grantMinter(addresses.epochManager);
    await grantTx.wait();
    console.log("  ✅ EpochManager granted minter role on AetheronToken");

    // ──────────────────────────────────────────────
    // 2. Register initial keepers
    // ──────────────────────────────────────────────
    console.log("\n[2/6] Registering initial keepers...");
    const keeper1 = process.env.KEEPER1_ADDRESS;
    const keeper2 = process.env.KEEPER2_ADDRESS;

    if (keeper1 && keeper1 !== "0x0000000000000000000000000000000000000000") {
        const k1Tx = await keeperRegistry.registerKeeper(
            keeper1,
            hre.ethers.keccak256(hre.ethers.toUtf8Bytes("epoch_trigger,reward_distribution")),
            "EpochKeeper"
        );
        await k1Tx.wait();
        console.log("  ✅ Keeper 1 registered:", keeper1);
    }

    if (keeper2 && keeper2 !== "0x0000000000000000000000000000000000000000") {
        const k2Tx = await keeperRegistry.registerKeeper(
            keeper2,
            hre.ethers.keccak256(hre.ethers.toUtf8Bytes("sentinel_health,relay_ack")),
            "SentinelKeeper"
        );
        await k2Tx.wait();
        console.log("  ✅ Keeper 2 registered:", keeper2);
    }

    // ──────────────────────────────────────────────
    // 3. Verify Sentinel system health
    // ──────────────────────────────────────────────
    console.log("\n[3/6] Verifying Sentinel system health...");
    const isHealthy = await sentinel.systemHealthy();
    console.log("  System healthy:", isHealthy);

    // ──────────────────────────────────────────────
    // 4. Verify L3Relay sentinel connection
    // ──────────────────────────────────────────────
    console.log("\n[4/6] Verifying L3Relay configuration...");
    const relayEndpoint = await l3Relay.rpcEndpoint();
    console.log("  RPC Endpoint:", relayEndpoint);

    // ──────────────────────────────────────────────
    // 5. Fund Treasury with initial AETH allocation
    // ──────────────────────────────────────────────
    console.log("\n[5/6] Initial Treasury funding...");
    const treasuryFunding = hre.ethers.parseEther("10000000"); // 10M AETH
    const approveTx = await aeth.approve(addresses.treasury, treasuryFunding);
    await approveTx.wait();
    console.log("  ✅ Treasury funding approved:", hre.ethers.formatEther(treasuryFunding), "AETH");

    await verifyOwnership(hre, addresses, "propose");
}

async function verifyOwnership(hre, addresses, requestedPhase) {
    const phase = requestedPhase || "verify";
    const aeth = await hre.ethers.getContractAt("AetheronToken", addresses.aetherToken);
    const keeperRegistry = await hre.ethers.getContractAt("KeeperRegistry", addresses.keeperRegistry);
    const treasury = await hre.ethers.getContractAt("Treasury", addresses.treasury);
    const epochManager = await hre.ethers.getContractAt("EpochManager", addresses.epochManager);
    const sentinel = await hre.ethers.getContractAt("Sentinel", addresses.sentinel);
    const l3Relay = await hre.ethers.getContractAt("L3Relay", addresses.l3Relay);
    const contracts = [
        { name: "AetheronToken", contract: aeth },
        { name: "KeeperRegistry", contract: keeperRegistry },
        { name: "Treasury", contract: treasury },
        { name: "EpochManager", contract: epochManager },
        { name: "Sentinel", contract: sentinel },
        { name: "L3Relay", contract: l3Relay }
    ];

    // Explicit phases: propose, verify. Acceptance is performed separately
    // by the timelock's authorized governance execution mechanism.
    const phase = process.env.OWNERSHIP_PHASE || "verify";
    if (!["propose", "verify"].includes(phase)) {
        throw new Error("OWNERSHIP_PHASE must be propose or verify");
    }
    if (!addresses.timelock || !hre.ethers.isAddress(addresses.timelock) ||
        addresses.timelock.toLowerCase() === hre.ethers.ZeroAddress.toLowerCase()) {
        throw new Error("A valid timelock address is required");
    }
    const pending = [];
    for (const { name, contract } of contracts) {
        const currentOwner = await contract.owner();
        if (currentOwner.toLowerCase() === addresses.timelock.toLowerCase()) {
            console.log("  Verified timelock-owned:", name);
            continue;
        }
        if (phase === "propose") {
            // A one-step Ownable contract cannot be safely assumed to support
            // timelock acceptance. Require the two-step interface before writing.
            if (typeof contract.pendingOwner !== "function") {
                throw new Error(name + " lacks pendingOwner(); manual governance review required");
            }
            const existingPending = await contract.pendingOwner();
            if (existingPending.toLowerCase() !== addresses.timelock.toLowerCase()) {
                const tx = await contract.transferOwnership(addresses.timelock);
                await tx.wait();
            }
        }
        if (typeof contract.pendingOwner !== "function") {
            throw new Error(name + " ownership is not timelock and no two-step interface exists");
        }
        const proposed = await contract.pendingOwner();
        if (proposed.toLowerCase() !== addresses.timelock.toLowerCase()) {
            throw new Error(name + " pending owner is not the timelock");
        }
        pending.push(name);
        console.log("  Awaiting timelock acceptOwnership():", name);
    }
    if (pending.length) {
        const instruction = "Timelock must execute acceptOwnership() for: " + pending.join(", ");
        if (phase === "propose") {
            console.log("  Proposal phase complete. " + instruction);
            console.log("  This is NOT final governance certification.");
            return;
        }
        throw new Error("Governance verification FAILED. " + instruction);
    }
    console.log("Governance verified: all contract owners are timelock:", addresses.timelock);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Post-deploy wiring failed:", error);
        process.exit(1);
    });
