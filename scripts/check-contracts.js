import hre from 'hardhat';

async function checkContracts() {
  const tokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const nftAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

  console.log('Checking contract code at addresses...\n');

  // Check token contract
  const tokenCode = await hre.ethers.provider.getCode(tokenAddress);
  console.log(`Token contract (${tokenAddress}):`);
  console.log(`Has code: ${tokenCode !== '0x'}`);
  console.log(`Code length: ${tokenCode.length} bytes\n`);

  // Check NFT contract
  const nftCode = await hre.ethers.provider.getCode(nftAddress);
  console.log(`NFT contract (${nftAddress}):`);
  console.log(`Has code: ${nftCode !== '0x'}`);
  console.log(`Code length: ${nftCode.length} bytes\n`);

  if (tokenCode !== '0x') {
    console.log('✅ Contracts are properly deployed on local Hardhat network');
    console.log('These addresses only exist locally and are safe to use for testing');
  } else {
    console.log('❌ No contracts found at these addresses');
  }
}

checkContracts().catch(console.error);
