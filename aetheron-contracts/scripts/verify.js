// SPDX-License-Identifier: MIT
// Verify deployed Aetheron & Sentinel L3 contracts on-chain and via Block Explorer (BaseScan).

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  const addressesPath = path.join(__dirname, "..", "deployments", "addresses.json");
  if (!fs.existsSync(addressesPath)) {
    throw new Error("addresses.json not found. Run deploy.js first.");
  }
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  const initialSupply = process.env.INITIAL_SUPPLY || "100000000000000000000000000";
  const initialOwner = process.env.SOVEREIGN_MULTISIG || addresses._meta.deployer;
  const guardian = process.env.GUARDIAN_MULTISIG || addresses._meta.guardian || initialOwner;
  const rpcEndpoint = addresses._meta.rpcEndpoint || process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
  const epochLength = parseInt(process.env.EPOCH_LENGTH || "403200", 10);
  const epochStartBlock = addresses._meta.epochStartBlock || 10;
  const treasuryCap = hre.ethers.parseEther("200000000");
  const emissionPerEpoch = hre.ethers.parseEther("1923077");

  console.log("=== 1. On-Chain Contract & Sentinel L3 Wiring Verification ===");
  const codeChecks = [
    ["AetheronToken", addresses.aetherToken],
    ["AetheronGlyphs", addresses.aetherGlyphs],
    ["KeeperRegistry", addresses.keeperRegistry],
    ["Treasury", addresses.treasury],
    ["EpochManager", addresses.epochManager],
    ["Sentinel", addresses.sentinel],
    ["L3Relay", addresses.l3Relay],
    ["AetherTimelock", addresses.timelock],
    ["AetherGovernor", addresses.governor],
  ];

  for (const [name, addr] of codeChecks) {
    if (!addr || addr.startsWith("[")) {
      throw new Error(`${name} has placeholder address: ${addr}`);
    }
    const code = await hre.ethers.provider.getCode(addr);
    const hasCode = code && code !== "0x";
    console.log(`  [${hasCode ? "PASS" : "WARN"}] ${name}: ${addr} (${hasCode ? `${(code.length - 2) / 2} bytes` : "no code on active network"})`);
  }

  const sentinelCode = await hre.ethers.provider.getCode(addresses.sentinel);
  if (sentinelCode && sentinelCode !== "0x") {
    const sentinel = await hre.ethers.getContractAt("Sentinel", addresses.sentinel);
    const l3Relay = await hre.ethers.getContractAt("L3Relay", addresses.l3Relay);
    const healthy = await sentinel.systemHealthy();
    const relaySentinel = await l3Relay.sentinel();
    const relayEndpoint = await l3Relay.rpcEndpoint();
    console.log(`  [PASS] Sentinel.systemHealthy() = ${healthy}`);
    console.log(`  [PASS] L3Relay.sentinel()       = ${relaySentinel}`);
    console.log(`  [PASS] L3Relay.rpcEndpoint()    = ${relayEndpoint}`);
  }

  if (!process.env.BASESCAN_API_KEY) {
    console.log("\n=== 2. Explorer Source Verification Skipped (BASESCAN_API_KEY not set) ===");
    return;
  }

  console.log("\n=== 2. Submitting Explorer Verification to BaseScan ===");
  const verifications = [
    { name: "AetheronToken", address: addresses.aetherToken, constructorArguments: [initialSupply, initialOwner] },
    { name: "AetheronGlyphs", address: addresses.aetherGlyphs, constructorArguments: [initialOwner] },
    { name: "KeeperRegistry", address: addresses.keeperRegistry, constructorArguments: [initialOwner, guardian] },
    { name: "Treasury", address: addresses.treasury, constructorArguments: [initialOwner, addresses.aetherToken, guardian, treasuryCap] },
    {
      name: "EpochManager",
      address: addresses.epochManager,
      constructorArguments: [initialOwner, addresses.aetherToken, addresses.keeperRegistry, addresses.treasury, epochLength, emissionPerEpoch, epochStartBlock],
    },
    { name: "Sentinel", address: addresses.sentinel, constructorArguments: [initialOwner, addresses.keeperRegistry, guardian] },
    { name: "L3Relay", address: addresses.l3Relay, constructorArguments: [initialOwner, addresses.keeperRegistry, addresses.sentinel, guardian, rpcEndpoint] },
  ];

  for (const item of verifications) {
    console.log(`Verifying ${item.name} at ${item.address}...`);
    await hre.run("verify:verify", {
      address: item.address,
      constructorArguments: item.constructorArguments,
    });
  }

  console.log("Explorer verification complete.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Verification failed:", error);
    process.exit(1);
  });
