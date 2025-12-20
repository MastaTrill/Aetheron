/* global chrome */
/**
 * Background Service Worker
 * Handles wallet operations and blockchain communication
 */

const crypto = require('crypto');

// Wallet state
let currentWallet = null;
let networkUrl = 'https://api.aetheron.network';

// Initialize service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('Aetheron Wallet installed');

  // Create alarm for price updates
  chrome.alarms.create('priceUpdate', { periodInMinutes: 5 });
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender)
    .then(sendResponse)
    .catch((error) => sendResponse({ error: error.message }));

  return true; // Keep channel open for async response
});

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'priceUpdate') {
    updatePrices();
  }
});

/**
 * Handle messages
 */
async function handleMessage(request, sender) {
  switch (request.action) {
  case 'createWallet':
    return { wallet: await createWallet() };

  case 'importWallet':
    return { wallet: await importWallet(request.data.privateKey) };

  case 'exportPrivateKey':
    return { privateKey: await exportPrivateKey() };

  case 'sendTransaction':
    return await sendTransaction(request.data);

  case 'getBalance':
    return { balance: await getBalance(request.data.address) };

  case 'signMessage':
    return { signature: await signMessage(request.data.message) };

  default:
    throw new Error('Unknown action: ' + request.action);
  }
}

/**
 * Create new wallet
 */
async function createWallet() {
  const privateKey = crypto.randomBytes(32).toString('hex');
  const publicKey = crypto.createHash('sha256').update(privateKey).digest('hex');
  const address = '0x' + publicKey.substring(0, 40);

  const wallet = {
    address,
    privateKey,
    balance: 0,
    createdAt: Date.now()
  };

  currentWallet = wallet;
  await chrome.storage.local.set({ wallet });

  return wallet;
}

/**
 * Import wallet from private key
 */
async function importWallet(privateKey) {
  const publicKey = crypto.createHash('sha256').update(privateKey).digest('hex');
  const address = '0x' + publicKey.substring(0, 40);

  const wallet = {
    address,
    privateKey,
    balance: await getBalance(address),
    importedAt: Date.now()
  };

  currentWallet = wallet;
  await chrome.storage.local.set({ wallet });

  return wallet;
}

/**
 * Export private key
 */
async function exportPrivateKey() {
  const result = await chrome.storage.local.get(['wallet']);
  if (!result.wallet) {
    throw new Error('No wallet found');
  }
  return result.wallet.privateKey;
}

/**
 * Send transaction
 */
async function sendTransaction({ to, amount }) {
  const result = await chrome.storage.local.get(['wallet']);
  const wallet = result.wallet;

  if (!wallet) {
    throw new Error('No wallet found');
  }

  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }

  // Create transaction
  const transaction = {
    from: wallet.address,
    to,
    amount,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(8).toString('hex')
  };

  // Sign transaction
  const signature = signTransaction(transaction, wallet.privateKey);
  transaction.signature = signature;

  // Send to network
  const response = await fetch(`${networkUrl}/api/transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction)
  });

  if (!response.ok) {
    throw new Error('Transaction failed');
  }

  const result2 = await response.json();

  // Update balance
  wallet.balance -= amount;
  await chrome.storage.local.set({ wallet });

  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon-48.png',
    title: 'Transaction Sent',
    message: `Sent ${amount} AETH to ${to.substring(0, 10)}...`
  });

  return {
    success: true,
    txHash: result2.hash,
    transaction
  };
}

/**
 * Get balance for address
 */
async function getBalance(address) {
  try {
    const response = await fetch(`${networkUrl}/api/balance/${address}`);
    if (!response.ok) return 0;

    const data = await response.json();
    return data.balance || 0;
  } catch (error) {
    console.error('Failed to get balance:', error);
    return 0;
  }
}

/**
 * Sign transaction
 */
function signTransaction(transaction, privateKey) {
  const data = JSON.stringify({
    from: transaction.from,
    to: transaction.to,
    amount: transaction.amount,
    timestamp: transaction.timestamp,
    nonce: transaction.nonce
  });

  return crypto.createHmac('sha256', privateKey).update(data).digest('hex');
}

/**
 * Sign message
 */
async function signMessage(message) {
  const result = await chrome.storage.local.get(['wallet']);
  const wallet = result.wallet;

  if (!wallet) {
    throw new Error('No wallet found');
  }

  return crypto.createHmac('sha256', wallet.privateKey).update(message).digest('hex');
}

/**
 * Update prices
 */
async function updatePrices() {
  try {
    const response = await fetch(`${networkUrl}/api/price`);
    if (!response.ok) return;

    const data = await response.json();
    await chrome.storage.local.set({ price: data.price });

    // Update badge with price
    chrome.action.setBadgeText({ text: `$${data.price.toFixed(2)}` });
    chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
  } catch (error) {
    console.error('Failed to update prices:', error);
  }
}

// Update prices on startup
updatePrices();
