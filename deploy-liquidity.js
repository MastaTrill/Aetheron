import { ethers } from 'ethers';
import 'dotenv/config';

// Contract Addresses for Base
const AETHX_ADDRESS = '0xFe0c0B15798B8c9107CD4aa556A87Eb031263e8b';
const POSITION_MANAGER_ADDRESS = '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1'; // Uniswap V3 Position Manager on Base
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'; // Wrapped Ether on Base

// Uniswap V3 Position Manager ABI (minimal for mint and events)
const POSITION_MANAGER_ABI = [
  'function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline) params) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event IncreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)'
];

// Alchemy Provider & Signer
if (!process.env.DEPLOYER_PRIVATE_KEY) {
  throw new Error('DEPLOYER_PRIVATE_KEY environment variable is required');
}
const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

async function deployLiquidity() {
  console.log('Starting Deployment for AETHX...');

  // Determine token order (token0 < token1)
  const token0 = AETHX_ADDRESS < WETH_ADDRESS ? AETHX_ADDRESS : WETH_ADDRESS;
  const token1 = AETHX_ADDRESS < WETH_ADDRESS ? WETH_ADDRESS : AETHX_ADDRESS;
  const isAethxToken0 = token0 === AETHX_ADDRESS;

  console.log(`Token0: ${token0} (${isAethxToken0 ? 'AETHX' : 'WETH'})`);
  console.log(`Token1: ${token1} (${isAethxToken0 ? 'WETH' : 'AETHX'})`);

  // 1. APPROVE both tokens for Uniswap
  const aethxContract = new ethers.Contract(
    AETHX_ADDRESS,
    ['function approve(address spender, uint256 amount) public returns (bool)'],
    wallet
  );
  const wethContract = new ethers.Contract(
    WETH_ADDRESS,
    ['function approve(address spender, uint256 amount) public returns (bool)'],
    wallet
  );

  const amountToApprove = ethers.parseEther('1000000'); // Adjust based on your bag size

  console.log('Approving AETHX...');
  const approveAethxTx = await aethxContract.approve(POSITION_MANAGER_ADDRESS, amountToApprove);
  await approveAethxTx.wait();
  console.log('AETHX Approval Successful! Tx Hash:', approveAethxTx.hash);

  console.log('Approving WETH...');
  const approveWethTx = await wethContract.approve(POSITION_MANAGER_ADDRESS, amountToApprove);
  await approveWethTx.wait();
  console.log('WETH Approval Successful! Tx Hash:', approveWethTx.hash);

  // 2. MINT POSITION (Full Range Strategy)
  const positionManager = new ethers.Contract(
    POSITION_MANAGER_ADDRESS,
    POSITION_MANAGER_ABI,
    wallet
  );

  const fee = 3000; // 0.3% fee tier
  const tickLower = -887272; // Min tick for full range
  const tickUpper = 887272; // Max tick for full range

  const amount0Desired = ethers.parseEther('1'); // 1 token0
  const amount1Desired = ethers.parseEther('1'); // 1 token1

  const amount0Min = ethers.parseEther('0.9'); // 10% slippage protection
  const amount1Min = ethers.parseEther('0.9');
  const recipient = wallet.address;
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

  const params = {
    token0,
    token1,
    fee,
    tickLower,
    tickUpper,
    amount0Desired,
    amount1Desired,
    amount0Min,
    amount1Min,
    recipient,
    deadline
  };

  console.log('Minting liquidity position...');
  const mintTx = await positionManager.mint(params);
  const receipt = await mintTx.wait();
  console.log('Liquidity Minted! Tx Hash:', mintTx.hash);

  // Extract tokenId from Transfer event
  const transferEvent = receipt.logs.find((log) => {
    if (log.address !== POSITION_MANAGER_ADDRESS) return false;
    try {
      const parsed = positionManager.interface.parseLog(log);
      return parsed.name === 'Transfer' && parsed.args.from === ethers.ZeroAddress;
    } catch {
      return false;
    }
  });
  if (transferEvent) {
    const parsedLog = positionManager.interface.parseLog(transferEvent);
    console.log('Position Token ID:', parsedLog.args.tokenId);
  }

  console.log('Deployment Complete!');
}

deployLiquidity().catch((error) => {
  console.error('Deployment failed:', error);
});
