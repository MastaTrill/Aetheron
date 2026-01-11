/* global chrome */
/**
 * Content Script
 * Injected into web pages to enable dApp interaction
 */

// Inject the provider script
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Listen for requests from injected script
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  if (!event.data.type || event.data.type !== 'AETHERON_REQUEST') return;

  const { id, method, params } = event.data;

  try {
    const response = await handleRequest(method, params);

    window.postMessage(
      {
        type: 'AETHERON_RESPONSE',
        id,
        result: response
      },
      '*'
    );
  } catch (error) {
    window.postMessage(
      {
        type: 'AETHERON_RESPONSE',
        id,
        error: error.message
      },
      '*'
    );
  }
});

/**
 * Handle dApp requests
 */
async function handleRequest(method, params) {
  switch (method) {
  case 'eth_requestAccounts':
    return await requestAccounts();

  case 'eth_accounts':
    return await getAccounts();

  case 'eth_chainId':
    return '0x1'; // Aetheron mainnet

  case 'eth_getBalance':
    return await getBalance(params[0]);

  case 'eth_sendTransaction':
    return await sendTransaction(params[0]);

  case 'eth_sign':
    return await signMessage(params[1]);

  case 'personal_sign':
    return await signMessage(params[0]);

  case 'eth_signTypedData_v4':
    return await signTypedData(params[1]);

  default:
    throw new Error(`Unsupported method: ${method}`);
  }
}

/**
 * Request accounts (show permission dialog)
 */
async function requestAccounts() {
  const allowed = await showPermissionDialog();

  if (!allowed) {
    throw new Error('User rejected the request');
  }

  return getAccounts();
}

/**
 * Get connected accounts
 */
async function getAccounts() {
  const response = await chrome.runtime.sendMessage({
    action: 'getAccounts'
  });

  return response.accounts || [];
}

/**
 * Get balance
 */
async function getBalance(address) {
  const response = await chrome.runtime.sendMessage({
    action: 'getBalance',
    data: { address }
  });

  return '0x' + response.balance.toString(16);
}

/**
 * Send transaction
 */
async function sendTransaction(tx) {
  const confirmed = await showTransactionDialog(tx);

  if (!confirmed) {
    throw new Error('User rejected the transaction');
  }

  const response = await chrome.runtime.sendMessage({
    action: 'sendTransaction',
    data: {
      to: tx.to,
      amount: parseInt(tx.value, 16)
    }
  });

  return response.txHash;
}

/**
 * Sign message
 */
async function signMessage(message) {
  const confirmed = await showSignDialog(message);

  if (!confirmed) {
    throw new Error('User rejected signature request');
  }

  const response = await chrome.runtime.sendMessage({
    action: 'signMessage',
    data: { message }
  });

  return response.signature;
}

/**
 * Sign typed data (EIP-712)
 */
async function signTypedData(data) {
  const parsed = typeof data === 'string' ? JSON.parse(data) : data;
  const confirmed = await showSignDialog(JSON.stringify(parsed, null, 2));

  if (!confirmed) {
    throw new Error('User rejected signature request');
  }

  const response = await chrome.runtime.sendMessage({
    action: 'signMessage',
    data: { message: JSON.stringify(parsed) }
  });

  return response.signature;
}

/**
 * Show permission dialog
 */
async function showPermissionDialog() {
  return new Promise((resolve) => {
    const dialog = createDialog(
      'Connect to Aetheron',
      `${window.location.hostname} wants to connect to your wallet`,
      [
        { text: 'Reject', action: () => resolve(false) },
        { text: 'Connect', action: () => resolve(true), primary: true }
      ]
    );

    document.body.appendChild(dialog);
  });
}

/**
 * Show transaction confirmation dialog
 */
async function showTransactionDialog(tx) {
  const amount = parseInt(tx.value, 16);

  return new Promise((resolve) => {
    const dialog = createDialog('Confirm Transaction', `Send ${amount} AETH to ${tx.to}?`, [
      { text: 'Reject', action: () => resolve(false) },
      { text: 'Confirm', action: () => resolve(true), primary: true }
    ]);

    document.body.appendChild(dialog);
  });
}

/**
 * Show signature dialog
 */
async function showSignDialog(message) {
  return new Promise((resolve) => {
    const dialog = createDialog(
      'Sign Message',
      `Sign this message?\n\n${message.substring(0, 100)}...`,
      [
        { text: 'Reject', action: () => resolve(false) },
        { text: 'Sign', action: () => resolve(true), primary: true }
      ]
    );

    document.body.appendChild(dialog);
  });
}

/**
 * Create dialog element
 */
function createDialog(title, message, buttons) {
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 999999;
    max-width: 400px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;

  const titleEl = document.createElement('h3');
  titleEl.textContent = title;
  titleEl.style.cssText = 'margin: 0 0 12px 0; color: #333;';

  const messageEl = document.createElement('p');
  messageEl.textContent = message;
  messageEl.style.cssText = 'margin: 0 0 20px 0; color: #666; white-space: pre-wrap;';

  const buttonsEl = document.createElement('div');
  buttonsEl.style.cssText = 'display: flex; gap: 12px; justify-content: flex-end;';

  buttons.forEach((btn) => {
    const button = document.createElement('button');
    button.textContent = btn.text;
    button.style.cssText = `
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      ${btn.primary ? 'background: #667eea; color: white;' : 'background: #e0e0e0; color: #333;'}
    `;
    button.onclick = () => {
      dialog.remove();
      btn.action();
    };
    buttonsEl.appendChild(button);
  });

  dialog.appendChild(titleEl);
  dialog.appendChild(messageEl);
  dialog.appendChild(buttonsEl);

  return dialog;
}
