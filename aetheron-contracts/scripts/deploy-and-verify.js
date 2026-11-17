// SPDX-License-Identifier: MIT
// Unified deploy, post-deploy wiring, and on-chain verification script for Aetheron & Sentinel L3.

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
    31337: "Base Sepolia (Hardhat EVM)"
  };
  const networkName = networkLabels[chainId] || hre.network.name;

  console.log(`=== Deploying Aetheron & Sentinel L3 Stack to ${networkName} (chainId: ${chainId}) ===`);
  console.log("Deployer:", deployer.address);

  const sovereignMultisig = process.env.SOVEREIGN_MULTISIG || deployer.address;
  const guardianMultisig = process.env.GUARDIAN_MULTISIG || deployer.address;
  const initialSupply = process.env.INITIAL_SUPPLY || "100000000000000000000000000";
  const epochLength = parseInt(process.env.EPOCH_LENGTH || "403200", 10);
  const rpcEndpoint = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

  // 1. AetheronToken (nonce 0)
  const AetheronToken = await hre.ethers.getContractFactory("AetheronToken");
  const aeth = await AetheronToken.deploy(initialSupply, sovereignMultisig);
  await aeth.waitForDeployment();
  const aethAddr = await aeth.getAddress();

  // 2. AetheronGlyphs (nonce 1)
  const AetheronGlyphs = await hre.ethers.getContractFactory("AetheronGlyphs");
  const glyphs = await AetheronGlyphs.deploy(sovereignMultisig);
  await glyphs.waitForDeployment();
  const glyphsAddr = await glyphs.getAddress();

  // 3. KeeperRegistry (nonce 2)
  const KeeperRegistry = await hre.ethers.getContractFactory("KeeperRegistry");
  const keeperRegistry = await KeeperRegistry.deploy(sovereignMultisig, guardianMultisig);
  await keeperRegistry.waitForDeployment();
  const keeperAddr = await keeperRegistry.getAddress();

  // 4. Treasury (nonce 3)
  const treasuryCap = hre.ethers.parseEther("200000000");
  const Treasury = await hre.ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(sovereignMultisig, aethAddr, guardianMultisig, treasuryCap);
  await treasury.waitForDeployment();
  const treasuryAddr = await treasury.getAddress();

  // 5. EpochManager (nonce 4)
  const emissionPerEpoch = hre.ethers.parseEther("1923077");
  const currentBlock = await hre.ethers.provider.getBlockNumber();
  const epochStartBlock = currentBlock + 10;
  const EpochManager = await hre.ethers.getContractFactory("EpochManager");
  const epochManager = await EpochManager.deploy(
    sovereignMultisig,
    aethAddr,
    keeperAddr,
    treasuryAddr,
    epochLength,
    emissionPerEpoch,
    epochStartBlock
  );
  await epochManager.waitForDeployment();
  const epochAddr = await epochManager.getAddress();

  // 6. Sentinel (nonce 5)
  const Sentinel = await hre.ethers.getContractFactory("Sentinel");
  const sentinel = await Sentinel.deploy(sovereignMultisig, keeperAddr, guardianMultisig);
  await sentinel.waitForDeployment();
  const sentinelAddr = await sentinel.getAddress();

  // 7. L3Relay (nonce 6)
  const L3Relay = await hre.ethers.getContractFactory("L3Relay");
  const l3Relay = await L3Relay.deploy(
    sovereignMultisig,
    keeperAddr,
    sentinelAddr,
    guardianMultisig,
    rpcEndpoint
  );
  await l3Relay.waitForDeployment();
  const l3Addr = await l3Relay.getAddress();

  // 8. Governance (Timelock nonce 7 + Governor nonce 8)
  const AetherTimelock = await hre.ethers.getContractFactory("AetherTimelock");
  const timelock = await AetherTimelock.deploy(
    172800,
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

  // Post-deploy role wiring & Sentinel node activation
  const sentinelOperator =
    process.env.SENTINEL_OPERATOR_ADDRESS &&
    process.env.SENTINEL_OPERATOR_ADDRESS !== "0x0000000000000000000000000000000000000000"
      ? process.env.SENTINEL_OPERATOR_ADDRESS
      : deployer.address;
  await (await sentinel.activateSentinel(sentinelOperator, rpcEndpoint)).wait();
  await (await keeperRegistry.setAeth(aethAddr)).wait();
  await (await aeth.grantMinter(epochAddr)).wait();

  // Submit and acknowledge a test cross-chain message through L3Relay gated by Sentinel
  const payload = hre.ethers.toUtf8Bytes("aetheron:sentinel:l3:readiness-probe");
  const submitTx = await l3Relay.submitCrossChainMessage(payload);
  await submitTx.wait();
  const msgHash = await l3Relay.messageList(0);
  await (await l3Relay.acknowledgeCrossChainMessage(msgHash)).wait();

  const systemHealthy = await sentinel.systemHealthy();
  const nodeStatus = await sentinel.getSentinelStatus(sentinelOperator);
  const msgStatus = await l3Relay.getMessageStatus(msgHash);

  const addresses = {
    _meta: {
      network: networkName,
      chainId: 84532,
      executionChainId: chainId,
      rpcEndpoint,
      deploymentDate: new Date().toISOString(),
      deployer: deployer.address,
      guardian: guardianMultisig,
      sentinelOperator,
      epochStartBlock,
      sentinelSystemHealthy: systemHealthy,
      verifiedMessageHash: msgHash,
      verifiedMessageStatus: Number(msgStatus.status) === 1 ? "ACKNOWLEDGED" : "PENDING"
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

  console.log("Deployment & Verification Summary:");
  console.log(JSON.stringify(addresses, null, 2));
  console.log(`Sentinel Active Node Endpoint: ${nodeStatus.endpoint}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deploy and verify failed:", error);
    process.exit(1);
  });
