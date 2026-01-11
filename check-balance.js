import { ethers } from 'ethers';
import 'dotenv/config';

const provider = new ethers.JsonRpcProvider(
  `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
);
const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

async function checkBalance() {
  try {
    const balance = await provider.getBalance(wallet.address);
    console.log('Wallet Address:', wallet.address);
    console.log('Balance:', ethers.formatEther(balance), 'ETH');

    // Check pending transactions
    const nonce = await provider.getTransactionCount(wallet.address, 'pending');
    const currentNonce = await provider.getTransactionCount(wallet.address, 'latest');
    console.log('Current nonce:', currentNonce);
    console.log('Pending nonce:', nonce);
    console.log('Pending transactions:', nonce - currentNonce);

    // Check gas price
    const gasPrice = await provider.getFeeData();
    console.log('Gas Price (gwei):', ethers.formatUnits(gasPrice.gasPrice, 'gwei'));
  } catch (error) {
    console.error('Error checking balance:', error.message);
  }
}

checkBalance();
