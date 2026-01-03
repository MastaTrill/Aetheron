import hre from 'hardhat';

async function main() {
  const network = hre.network.name;
  console.log(`Deploying to network: ${network}`);

  // 1. Deploy ERC20 Token
  console.log('Deploying AetheronToken...');
  const AetheronToken = await hre.ethers.getContractFactory('AetheronToken');
  const erc20 = await AetheronToken.deploy(
    hre.ethers.parseEther('1000000') // initial supply: 1,000,000 AETH
  );
  await erc20.waitForDeployment();
  const tokenAddress = await erc20.getAddress();
  console.log(`✅ AetheronToken (ERC20) deployed to: ${tokenAddress}`);

  // 2. Deploy ERC721 NFT
  console.log('Deploying AetheronGlyphs...');
  const AetheronGlyphs = await hre.ethers.getContractFactory('AetheronGlyphs');
  const erc721 = await AetheronGlyphs.deploy();
  await erc721.waitForDeployment();
  const nftAddress = await erc721.getAddress();
  console.log(`✅ AetheronGlyphs (ERC721) deployed to: ${nftAddress}`);

  // Save deployment info
  const deploymentInfo = {
    network,
    chainId: hre.network.config.chainId,
    tokenAddress,
    nftAddress,
    deployer: (await hre.ethers.getSigners())[0].address,
    timestamp: new Date().toISOString()
  };

  console.log('\n📋 Deployment Summary:');
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = await import('fs');
  const deploymentPath = `./deployments/${network}.json`;
  await fs.promises.mkdir('./deployments', { recursive: true });
  await fs.promises.writeFile(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${deploymentPath}`);

  // Verification instructions
  if (network !== 'hardhat') {
    console.log('\n🔍 To verify contracts on block explorer:');
    console.log(`npx hardhat verify --network ${network} ${tokenAddress} "1000000000000000000000000"`);
    console.log(`npx hardhat verify --network ${network} ${nftAddress}`);
  }
}

// Run script
main().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exitCode = 1;
});
