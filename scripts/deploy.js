import hre from 'hardhat';

async function main() {
  const network = hre.network.name;
  const chainId = hre.network.config.chainId;
  console.log(`🚀 Deploying Aetheron contracts to network: ${network} (Chain ID: ${chainId})`);

  // 🚨 MAINNET SAFETY CHECKS
  const mainnetChains = [1, 137, 8453]; // Ethereum, Polygon, Base
  if (mainnetChains.includes(chainId)) {
    console.log('\n⚠️  WARNING: You are deploying to MAINNET!');
    console.log('💰 This will cost real money and cannot be undone!');
    console.log('📋 Please confirm:');
    console.log(`   - Network: ${network}`);
    console.log(`   - Chain ID: ${chainId}`);
    console.log('   - You have sufficient funds for gas');
    console.log('   - You have backed up your private key');
    console.log('   - You understand the risks\n');

    // In a real deployment, you'd want user confirmation here
    // For now, we'll proceed with warnings
  }

  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await hre.ethers.provider.getBalance(deployerAddress);
  console.log(`👤 Deployer: ${deployerAddress}`);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} ${network === 'polygon' || network === 'polygonAmoy' ? 'MATIC' : 'ETH'}`);

  // Estimate deployment costs
  console.log('\n📊 Estimating deployment costs...');
  const gasPrice = await hre.ethers.provider.getFeeData();
  console.log(`⛽ Gas Price: ${hre.ethers.formatUnits(gasPrice.gasPrice || gasPrice.maxFeePerGas || 0, 'gwei')} gwei`);

  // 1. Deploy ERC20 Token
  console.log('\n🏭 Deploying AetheronToken (ERC20)...');
  const AetheronToken = await hre.ethers.getContractFactory('AetheronToken');
  const initialSupply = hre.ethers.parseEther('1000000'); // 1,000,000 AETH

  // Estimate gas for token deployment
  const tokenGasEstimate = await AetheronToken.signer.estimateGas(
    AetheronToken.getDeployTransaction(initialSupply)
  );
  console.log(`⛽ Estimated gas for token: ${tokenGasEstimate.toString()}`);

  const erc20 = await AetheronToken.deploy(initialSupply);
  await erc20.waitForDeployment();
  const tokenAddress = await erc20.getAddress();
  console.log(`✅ AetheronToken deployed to: ${tokenAddress}`);

  // 2. Deploy ERC721 NFT
  console.log('\n🎨 Deploying AetheronGlyphs (ERC721)...');
  const AetheronGlyphs = await hre.ethers.getContractFactory('AetheronGlyphs');

  // Estimate gas for NFT deployment
  const nftGasEstimate = await AetheronGlyphs.signer.estimateGas(
    AetheronGlyphs.getDeployTransaction()
  );
  console.log(`⛽ Estimated gas for NFT: ${nftGasEstimate.toString()}`);

  const erc721 = await AetheronGlyphs.deploy();
  await erc721.waitForDeployment();
  const nftAddress = await erc721.getAddress();
  console.log(`✅ AetheronGlyphs deployed to: ${nftAddress}`);

  // Save deployment info
  const deploymentInfo = {
    network,
    chainId,
    tokenAddress,
    nftAddress,
    tokenSymbol: 'AETH',
    nftSymbol: 'AGLYPH',
    initialSupply: initialSupply.toString(),
    deployer: deployerAddress,
    timestamp: new Date().toISOString(),
    gasEstimates: {
      token: tokenGasEstimate.toString(),
      nft: nftGasEstimate.toString()
    }
  };

  console.log('\n📋 Deployment Summary:');
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = await import('fs');
  const deploymentPath = `./deployments/${network}.json`;
  await fs.promises.mkdir('./deployments', { recursive: true });
  await fs.promises.writeFile(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${deploymentPath}`);

  // Update chain-config.json if it exists
  const chainConfigPath = './chain-config.json';
  try {
    const chainConfig = JSON.parse(await fs.promises.readFile(chainConfigPath, 'utf8'));
    if (!chainConfig[chainId]) {
      chainConfig[chainId] = {};
    }
    chainConfig[chainId].tokenAddress = tokenAddress;
    chainConfig[chainId].nftAddress = nftAddress;
    chainConfig[chainId].network = network;
    await fs.promises.writeFile(chainConfigPath, JSON.stringify(chainConfig, null, 2));
    console.log(`🔄 Updated ${chainConfigPath} with deployed addresses`);
  } catch (error) {
    console.log(`⚠️  Could not update ${chainConfigPath}: ${error.message}`);
  }

  // Verification instructions
  if (network !== 'hardhat' && network !== 'localhost') {
    console.log('\n🔍 Contract Verification:');
    console.log(`npx hardhat verify --network ${network} ${tokenAddress} "${initialSupply}"`);
    console.log(`npx hardhat verify --network ${network} ${nftAddress}`);

    // Auto-verify if on mainnet (optional)
    if (mainnetChains.includes(chainId)) {
      console.log('\n⏳ Auto-verifying contracts...');
      try {
        await hre.run('verify:verify', {
          address: tokenAddress,
          constructorArguments: [initialSupply],
          network: network
        });
        console.log('✅ Token contract verified');

        await hre.run('verify:verify', {
          address: nftAddress,
          constructorArguments: [],
          network: network
        });
        console.log('✅ NFT contract verified');
      } catch (error) {
        console.log(`⚠️  Auto-verification failed: ${error.message}`);
        console.log('Manual verification commands shown above');
      }
    }
  }

  console.log('\n🎉 Deployment completed successfully!');
  console.log('📖 Next steps:');
  console.log('1. Update your frontend with the new contract addresses');
  console.log('2. Test the contracts on the deployed network');
  console.log('3. Set up liquidity and trading pairs if needed');
  console.log('4. Announce the deployment to your community');
}
}

// Run script
main().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exitCode = 1;
});
