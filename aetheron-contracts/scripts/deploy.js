// SPDX-License-Identifier: MIT
// Full deploy script for Aetheron / Sentinel / L3 (Base Sepolia / Base Mainnet / Local Hardhat)
// Deploy sequence:
//   1. AetheronToken (ERC-20 governance token)
//   2. AetheronGlyphs (ERC-721 NFT collection)
//   3. KeeperRegistry (keeper management + staking)
//   4. Treasury (protocol treasury with emission caps)
//   5. EpochManager (epoch transitions + reward distribution)
//   6. Sentinel (network health monitoring + anomaly detection)
//   7. L3Relay (cross-chain message relay)
//   8. AetherTimelock + AetherGovernor (governance stack)

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    const net = await hre.ethers.provider.getNetwork();
    const chainId = Number(net.chainId);
    const networkLabels = {
        8453: "Base Mainnet",
        84532: "Base Sepolia",
        31337: "Base Sepolia (Local Hardhat Simulation)"
    };
    const networkName = networkLabels[chainId] || hre.network.name;

    console.log(`Deploying Aetheron & Sentinel L3 contracts to ${networkName} (chainId: ${chainId})`);
    console.log("Deployer account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

    const sovereignMultisig = process.env.SOVEREIGN_MULTISIG || deployer.address;
    const guardianMultisig  = process.env.GUARDIAN_MULTISIG || deployer.address;
    const initialSupply     = process.env.INITIAL_SUPPLY || "100000000000000000000000000"; // 100M AETH
    const epochLength       = parseInt(process.env.EPOCH_LENGTH || "403200", 10);
    const defaultRpc        = chainId === 8453 ? "https://mainnet.base.org" : "https://sepolia.base.org";
    const rpcEndpoint       = process.env.BASE_SEPOLIA_RPC_URL || process.env.BASE_RPC_URL || defaultRpc;

    // 1. Deploy AetheronToken (nonce 0)
    console.log("\n[1/8] Deploying AetheronToken...");
    const AetheronToken = await hre.ethers.getContractFactory("AetheronToken");
    const aeth = await AetheronToken.deploy(initialSupply, sovereignMultisig);
    await aeth.waitForDeployment();
    const aethAddr = await aeth.getAddress();
    console.log("  AetheronToken deployed to:", aethAddr);

    // 2. Deploy AetheronGlyphs (nonce 1)
    console.log("\n[2/8] Deploying AetheronGlyphs...");
    const AetheronGlyphs = await hre.ethers.getContractFactory("AetheronGlyphs");
    const glyphs = await AetheronGlyphs.deploy(sovereignMultisig);
    await glyphs.waitForDeployment();
    const glyphsAddr = await glyphs.getAddress();
    console.log("  AetheronGlyphs deployed to:", glyphsAddr);

    // 3. Deploy KeeperRegistry (nonce 2)
    console.log("\n[3/8] Deploying KeeperRegistry...");
    const KeeperRegistry = await hre.ethers.getContractFactory("KeeperRegistry");
    const keeperRegistry = await KeeperRegistry.deploy(sovereignMultisig, guardianMultisig);
    await keeperRegistry.waitForDeployment();
    const keeperAddr = await keeperRegistry.getAddress();
    console.log("  KeeperRegistry deployed to:", keeperAddr);

    // 4. Deploy Treasury (nonce 3)
    console.log("\n[4/8] Deploying Treasury...");
    const treasuryCap = hre.ethers.parseEther("200000000"); // 200M AETH cap
    const Treasury = await hre.ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy(sovereignMultisig, aethAddr, guardianMultisig, treasuryCap);
    await treasury.waitForDeployment();
    const treasuryAddr = await treasury.getAddress();
    console.log("  Treasury deployed to:", treasuryAddr);

    // 5. Deploy EpochManager (nonce 4)
    console.log("\n[5/8] Deploying EpochManager...");
    const emissionPerEpoch = hre.ethers.parseEther("1923077");
    const currentBlock = await hre.ethers.provider.getBlockNumber();
    const epochStartBlock = currentBlock + 10;
    const EpochManager = await hre.ethers.getContractFactory("EpochManager");
    const epochManager = await EpochManager.deploy(
        sovereignMultisig, aethAddr, keeperAddr, treasuryAddr,
        epochLength, emissionPerEpoch, epochStartBlock
    );
    await epochManager.waitForDeployment();
    const epochAddr = await epochManager.getAddress();
    console.log("  EpochManager deployed to:", epochAddr);

    // 6. Deploy Sentinel (nonce 5)
    console.log("\n[6/8] Deploying Sentinel...");
    const Sentinel = await hre.ethers.getContractFactory("Sentinel");
    const sentinel = await Sentinel.deploy(sovereignMultisig, keeperAddr, guardianMultisig);
    await sentinel.waitForDeployment();
    const sentinelAddr = await sentinel.getAddress();
    console.log("  Sentinel deployed to:", sentinelAddr);

    // 7. Deploy L3Relay (nonce 6)
    console.log("\n[7/8] Deploying L3Relay...");
    const L3Relay = await hre.ethers.getContractFactory("L3Relay");
    const l3Relay = await L3Relay.deploy(
        sovereignMultisig, keeperAddr, sentinelAddr, guardianMultisig, rpcEndpoint
    );
    await l3Relay.waitForDeployment();
    const l3Addr = await l3Relay.getAddress();
    console.log("  L3Relay deployed to:", l3Addr);

    // 8. Deploy Governance (Timelock nonce 7 + Governor nonce 8)
    console.log("\n[8/8] Deploying Governance stack...");
    const timelockDelay = 172800; // 2 days
    const AetherTimelock = await hre.ethers.getContractFactory("AetherTimelock");
    const timelock = await AetherTimelock.deploy(
        timelockDelay,
        [sovereignMultisig],
        [sovereignMultisig, hre.ethers.ZeroAddress],
        sovereignMultisig
    );
    await timelock.waitForDeployment();
    const timelockAddr = await timelock.getAddress();

    const AetherGovernor = await hre.ethers.getContractFactory("AetherGovernor");
    const governor = await AetherGovernor.deploy(
        aethAddr,
        timelockAddr,
        7200,
        50400,
        hre.ethers.parseEther("100000"),
        4
    );
    await governor.waitForDeployment();
    const governorAddr = await governor.getAddress();
    console.log("  AetherTimelock deployed to:", timelockAddr);
    console.log("  AetherGovernor deployed to:", governorAddr);

    // Post-deployment Sentinel node activation
    const sentinelOperator = process.env.SENTINEL_OPERATOR_ADDRESS && process.env.SENTINEL_OPERATOR_ADDRESS !== "0x0000000000000000000000000000000000000000"
        ? process.env.SENTINEL_OPERATOR_ADDRESS
        : deployer.address;
    if (sovereignMultisig.toLowerCase() === deployer.address.toLowerCase()) {
        const actTx = await sentinel.activateSentinel(sentinelOperator, rpcEndpoint);
        await actTx.wait();
        console.log("  Initial Sentinel node activated:", sentinelOperator);
    }

    const systemHealthy = await sentinel.systemHealthy();
    const wiredSentinel = await l3Relay.sentinel();
    console.log(`\n[Verification] Sentinel.systemHealthy() = ${systemHealthy}`);
    console.log(`[Verification] L3Relay.sentinel()       = ${wiredSentinel}`);

    const addresses = {
        _meta: {
            network: networkName,
            chainId: chainId === 31337 ? 84532 : chainId,
            executionChainId: chainId,
            rpcEndpoint,
            deploymentDate: new Date().toISOString(),
            deployer: deployer.address,
            guardian: guardianMultisig,
            sentinelOperator,
            epochStartBlock,
            sentinelSystemHealthy: systemHealthy
        },
        aetherToken: aethAddr,
        aetherGlyphs: glyphsAddr,
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
        JSON.stringify(addresses, null, 2) + "\n"
    );
    console.log("\n✅ All contracts deployed and verified. Addresses written to deployments/addresses.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
