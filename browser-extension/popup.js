/* global chrome */
/**
 * Popup UI Logic
 */

let wallet = null;
let transactions = [];

// Initialize popup
async function init() {
  // Load wallet from storage
  const result = await chrome.storage.local.get(['wallet', 'transactions']);
  wallet = result.wallet;
  transactions = result.transactions || [];

  if (!wallet) {
    // Create new wallet if none exists
    await createWallet();
  }

  updateUI();
  setupEventListeners();
}

// Create new wallet
async function createWallet() {
  const response = await chrome.runtime.sendMessage({ action: 'createWallet' });
  wallet = response.wallet;
  await chrome.storage.local.set({ wallet });
}

// Update UI with wallet data
function updateUI() {
  if (!wallet) return;

  // Update address
  const addressElements = document.querySelectorAll('#address, #receiveAddress');
  addressElements.forEach((el) => {
    el.textContent = formatAddress(wallet.address);
  });

  // Update balance
  document.getElementById('balance').textContent = `${wallet.balance || 0} AETH`;
  document.getElementById('balanceUSD').textContent = `$${(wallet.balance * 1.23).toFixed(2)} USD`;

  // Update transactions
  updateTransactionsList();
}

// Format address
function formatAddress(address) {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Update transactions list
function updateTransactionsList() {
  const list = document.getElementById('transactionsList');

  if (transactions.length === 0) {
    list.innerHTML =
      '<div style="text-align: center; opacity: 0.5; padding: 20px;">No transactions yet</div>';
    return;
  }

  list.innerHTML = transactions
    .slice(-5)
    .reverse()
    .map(
      (tx) => `
    <div class="transaction">
      <div class="transaction-header">
        <span class="transaction-type">${tx.type === 'send' ? 'Sent' : 'Received'}</span>
        <span class="transaction-amount">${tx.type === 'send' ? '-' : '+'}${tx.amount} AETH</span>
      </div>
      <div class="transaction-address">${tx.type === 'send' ? 'To' : 'From'}: ${formatAddress(
  tx.address
)}</div>
    </div>
  `
    )
    .join('');
}

// Setup event listeners
function setupEventListeners() {
  // Copy address on click
  document.querySelectorAll('.address').forEach((el) => {
    el.addEventListener('click', () => {
      navigator.clipboard.writeText(wallet.address);
      showNotification('Address copied to clipboard!');
    });
  });

  // Send button
  document.getElementById('sendBtn').addEventListener('click', () => {
    document.getElementById('sendModal').classList.add('active');
  });

  // Receive button
  document.getElementById('receiveBtn').addEventListener('click', () => {
    document.getElementById('receiveModal').classList.add('active');
  });

  // Cancel send
  document.getElementById('cancelSend').addEventListener('click', () => {
    document.getElementById('sendModal').classList.remove('active');
  });

  // Confirm send
  document.getElementById('confirmSend').addEventListener('click', async () => {
    const address = document.getElementById('sendAddress').value;
    const amount = document.getElementById('sendAmount').value;

    if (!address || !amount) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'sendTransaction',
        data: { to: address, amount: parseFloat(amount) }
      });

      if (response.success) {
        // Add to transactions
        transactions.push({
          type: 'send',
          address,
          amount: parseFloat(amount),
          timestamp: Date.now(),
          hash: response.txHash
        });

        await chrome.storage.local.set({ transactions });

        // Update wallet balance
        wallet.balance -= parseFloat(amount);
        await chrome.storage.local.set({ wallet });

        updateUI();
        document.getElementById('sendModal').classList.remove('active');
        showNotification('Transaction sent successfully!');
      }
    } catch (error) {
      alert('Transaction failed: ' + error.message);
    }
  });

  // Close receive modal
  document.getElementById('closeReceive').addEventListener('click', () => {
    document.getElementById('receiveModal').classList.remove('active');
  });

  // Export private key
  document.getElementById('exportBtn').addEventListener('click', async () => {
    if (confirm('WARNING: Never share your private key! Continue?')) {
      const response = await chrome.runtime.sendMessage({ action: 'exportPrivateKey' });
      alert(`Private Key:\n${response.privateKey}\n\nStore this safely!`);
    }
  });

  // Lock wallet
  document.getElementById('lockBtn').addEventListener('click', () => {
    window.close();
  });

  // Tab switching
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;

      // Update active tab
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      // Show content
      document.getElementById('transactionsContent').style.display =
        tabName === 'transactions' ? 'block' : 'none';
      document.getElementById('settingsContent').style.display =
        tabName === 'settings' ? 'block' : 'none';
    });
  });
}

// Show notification
function showNotification(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon-48.png',
    title: 'Aetheron Wallet',
    message
  });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
