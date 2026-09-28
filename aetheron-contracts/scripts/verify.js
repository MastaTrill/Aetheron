// SPDX-License-Identifier: MIT
// Verify deployed Aetheron contracts on the configured explorer.
// Reads addresses from deployments/addresses.json (produced by deploy.js).
// Constructor args are taken from env (INITIAL_SUPPLY, SOVEREIGN_MULTISIG),
// falling back to the deployer recorded in addresses.json.

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

  console.log("Verifying AetheronToken...");
  await hre.run("verify:verify", {
    address: addresses.aetherToken,
    constructorArguments: [initialSupply, initialOwner],
  });

  console.log("Verifying AetheronGlyphs...");
  await hre.run("verify:verify", {
    address: addresses.aetherGlyphs,
    constructorArguments: [initialOwner],
  });

  console.log("Verification complete.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Verification failed:", error);
    process.exit(1);
  });
