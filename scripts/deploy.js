const hre = require("hardhat");

async function main() {
  // 1. Deploy ERC20
  const ERC20 = await hre.ethers.getContractFactory("AetheronToken");
  const erc20 = await ERC20.deploy(
    hre.ethers.utils.parseEther("1000000") // initial supply: 1,000,000 AETH
  );
  await erc20.deployed();
  console.log("ERC20 deployed to:", erc20.address);

  // 2. Deploy ERC721
  const ERC721 = await hre.ethers.getContractFactory("AetheronGlyphs");
  const erc721 = await ERC721.deploy();
  await erc721.deployed();
  console.log("ERC721 deployed to:", erc721.address);

  // 3. Deploy BurnToMint
  const BurnToMint = await hre.ethers.getContractFactory("BurnToMint");
  const burnToMint = await BurnToMint.deploy(erc20.address, erc721.address);
  await burnToMint.deployed();
  console.log("BurnToMint deployed to:", burnToMint.address);
}

// Run script
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});