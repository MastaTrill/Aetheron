// SPDX-License-Identifier: MIT
// Full deploy script for Aetheron / Sentinel / L3 — Base Mainnet
// Deploy sequence:
//   1. AetheronToken (ERC-20 governance token)
//   2. AetheronGlyphs (ERC-721 NFT collection)
//   3. KeeperRegistry (keeper management + staking)
//   4. Treasury (protocol treasury with emission caps)
//   5. EpochManager (epoch transitions + reward distribution)
//   6. Sentinel (network health monitoring + anomaly detection)
//   7. L3Relay (cross-chain message relay)
//   8. AetherTimelock + AetherGovernor (governance stack)
//
// Post-deploy wiring:
//   - Grant minter role on AetheronToken to EpochManager
//   - Register initial keepers in KeeperRegistry
//   - Set EpochManager as authorized caller on Treasury
//   - Wire Sentinel address into L3Relay
//   - Transfer ownership of all contracts to Timelock (via Governor)
//   - Write deployed addresses to deployments/addresses.json

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying Aetheron contracts with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

    const sovereignMultisig = process.env.SOVEREIGN_MULTISIG || deployer.address;
    const guardianMultisig  = process.env.GUARDIAN_MULTISIG || deployer.address;
    const initialSupply     = process.env.INITIAL_SUPPLY || "100000000000000000000000000"; // 100M AETH
    const epochLength       = parseInt(process.env.EPOCH_LENGTH || "403200");

    // ──────────────────────────────────────────────
    // 1. Deploy AetheronToken
    // ──────────────────────────────────────────────
    console.log("\n[1/8] Deploying AetheronToken...");
    const AetheronToken = await hre.ethers.getContractFactory("AetheronToken");
    const aeth = await AetheronToken.deploy(initialSupply, sovereignMultisig);
    await aeth.waitForDeployment();
    const aethAddr = await aeth.getAddress();
    console.log("  AetheronToken deployed to:", aethAddr);

    // ──────────────────────────────────────────────
    // 2. Deploy AetheronGlyphs
    // ──────────────────────────────────────────────
    console.log("\n[2/8] Deploying AetheronGlyphs...");
    const AetheronGlyphs = await hre.ethers.getContractFactory("AetheronGlyphs");
    const glyphs = await AetheronGlyphs.deploy(sovereignMultisig);
    await glyphs.waitForDeployment();
    console.log("  AetheronGlyphs deployed to:", await glyphs.getAddress());

    // ──────────────────────────────────────────────
    // 3. Deploy KeeperRegistry
    // ──────────────────────────────────────────────
    console.log("\n[3/8] Deploying KeeperRegistry...");
    const KeeperRegistry = await hre.ethers.getContractFactory("KeeperRegistry");
    const keeperRegistry = await KeeperRegistry.deploy(sovereignMultisig, guardianMultisig);
    await keeperRegistry.waitForDeployment();
    const keeperAddr = await keeperRegistry.getAddress();
    console.log("  KeeperRegistry deployed to:", keeperAddr);

    // ──────────────────────────────────────────────
    // 4. Deploy Treasury
    // ──────────────────────────────────────────────
    console.log("\n[4/8] Deploying Treasury...");
    const treasuryCap = hre.ethers.parseEther("200000000"); // 200M AETH cap
    const Treasury = await hre.ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy(sovereignMultisig, aethAddr, guardianMultisig, treasuryCap);
    await treasury.waitForDeployment();
    const treasuryAddr = await treasury.getAddress();
    console.log("  Treasury deployed to:", treasuryAddr);

    // ──────────────────────────────────────────────
    // 5. Deploy EpochManager
    // ──────────────────────────────────────────────
    console.log("\n[5/8] Deploying EpochManager...");
    const emissionPerEpoch = hre.ethers.parseEther("1923077");
    const currentBlock = await hre.ethers.provider.getBlockNumber();
    const EpochManager = await hre.ethers.getContractFactory("EpochManager");
    const epochManager = await EpochManager.deploy(
        sovereignMultisig, aethAddr, keeperAddr, treasuryAddr,
        epochLength, emissionPerEpoch, currentBlock + 10
    );
    await epochManager.waitForDeployment();
    const epochAddr = await epochManager.getAddress();
    console.log("  EpochManager deployed to:", epochAddr);

    // ──────────────────────────────────────────────
    // 6. Deploy Sentinel
    // ──────────────────────────────────────────────
    console.log("\n[6/8] Deploying Sentinel...");
    const Sentinel = await hre.ethers.getContractFactory("Sentinel");
    const sentinel = await Sentinel.deploy(sovereignMultisig, keeperAddr, guardianMultisig);
    await sentinel.waitForDeployment();
    const sentinelAddr = await sentinel.getAddress();
    console.log("  Sentinel deployed to:", sentinelAddr);

    // ──────────────────────────────────────────────
    // 7. Deploy L3Relay
    // ──────────────────────────────────────────────
    console.log("\n[7/8] Deploying L3Relay...");
    const rpcEndpoint = process.env.BASE_RPC_URL || "https://mainnet.base.org";
    const L3Relay = await hre.ethers.getContractFactory("L3Relay");
    const l3Relay = await L3Relay.deploy(
        sovereignMultisig, keeperAddr, sentinelAddr, guardianMultisig, rpcEndpoint
    );
    await l3Relay.waitForDeployment();
    const l3Addr = await l3Relay.getAddress();
    console.log("  L3Relay deployed to:", l3Addr);

    // ──────────────────────────────────────────────
    // 8. Deploy Governance (Timelock + Governor)
    // ──────────────────────────────────────────────
    console.log("\n[8/8] Deploying Governance stack...");
    const timelockDelay = 172800; // 2 days
    const AetherTimelock = await hre.ethers.getContractFactory("AetherTimelock");
    const timelock = await AetherTimelock.deploy(
        timelockDelay,
        [sovereignMultisig], // proposers
        [sovereignMultisig, hre.ethers.ZeroAddress], // executors (anyone can execute)
        sovereignMultisig    // admin
    );
    await timelock.waitForDeployment();
    const timelockAddr = await timelock.getAddress();

    const AetherGovernor = await hre.ethers.getContractFactory("AetherGovernor");
    const governor = await AetherGovernor.deploy(
        aethAddr,      // IVotes token
        timelockAddr,  // TimelockController
        7200,          // votingDelay (~1 day in blocks)
        50400,         // votingPeriod (~1 week in blocks)
        hre.ethers.parseEther("100000"), // proposalThreshold (100K AETH)
        4              // quorumNumerator (4%)
    );
    await governor.waitForDeployment();
    const governorAddr = await governor.getAddress();
    console.log("  AetherTimelock deployed to:", timelockAddr);
    console.log("  AetherGovernor deployed to:", governorAddr);

    // ──────────────────────────────────────────────
    // Write addresses.json
    // ──────────────────────────────────────────────
    const addresses = {
        _meta: {
            network: "Base Mainnet",
            chainId: 8453,
            deploymentDate: new Date().toISOString(),
            deployer: deployer.address
        },
        aetherToken: aethAddr,
        aetherGlyphs: await glyphs.getAddress(),
        keeperRegistry: keeperAddr,
        treasury: treasuryAddr,
        epochManager: epochAddr,
        sentinel: sentinelAddr,
        l3Relay: l3Addr,
        timelock: timelockAddr,
        governor: governorAddr
    };

    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });
    fs.writeFileSync(
        path.join(deploymentsDir, "addresses.json"),
        JSON.stringify(addresses, null, 2)
    );
    console.log("\n✅ All contracts deployed. Addresses written to deployments/addresses.json");
    console.log("\n⚠️  Run post-deploy.js next to wire roles and transfer ownership.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });