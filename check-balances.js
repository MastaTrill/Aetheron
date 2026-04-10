import { Blockchain, Wallet } from './blockchain.js';
import { Bridge, AtomicSwap } from './bridge.js';

const bridge = new Bridge();
const atomicSwap = new AtomicSwap();
const blockchain = new Blockchain();

console.log('=== Aetheron Internal Balances ===\n');

console.log('--- Bridge Locked Balances ---');
const bridgeBalances = bridge.getAllBalances();
if (Object.keys(bridgeBalances).length === 0) {
  console.log('No locked balances');
} else {
  for (const [address, amount] of Object.entries(bridgeBalances)) {
    console.log(`${address}: ${amount} AETH`);
  }
}

console.log('\n--- Blockchain Wallet Balances ---');
const testWallet = new Wallet();
console.log(`Test Wallet Address: ${testWallet.publicKey.substring(27, 67)}`);
const testAddress = testWallet.publicKey;
console.log(`Balance: ${blockchain.getBalance(testAddress)} AETH`);

console.log('\n--- Atomic Swaps ---');
const swaps = atomicSwap.swaps;
if (swaps.length === 0) {
  console.log('No active swaps');
} else {
  swaps.forEach((swap, i) => {
    console.log(`Swap ${i}: ${swap.amountA} AETH <-> ${swap.amountB} (${swap.status})`);
  });
}

console.log('\n--- Blockchain Stats ---');
console.log(`Chain Length: ${blockchain.chain.length}`);
console.log(`Pending Transactions: ${blockchain.pendingTransactions.length}`);
console.log(`Consensus: ${blockchain.consensus}`);
