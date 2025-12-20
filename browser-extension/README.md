# Aetheron Browser Extension Wallet

A secure, non-custodial cryptocurrency wallet extension for Chrome and Firefox.

## Features

- 🔐 **Secure Storage**: Private keys encrypted in browser storage
- 💰 **Send & Receive**: Transfer AETH tokens easily
- 🌐 **dApp Integration**: Full Web3 provider support (window.ethereum)
- 📱 **Transaction History**: Track all your transactions
- 🎨 **Beautiful UI**: Modern, gradient-based design
- 🔔 **Notifications**: Real-time transaction alerts

## Installation

### Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `browser-extension` folder
5. The Aetheron Wallet icon should appear in your toolbar

### Firefox

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Navigate to the `browser-extension` folder
4. Select `manifest.json`

## Usage

### Creating a Wallet

1. Click the Aetheron icon in your toolbar
2. A new wallet will be created automatically
3. **IMPORTANT**: Export and backup your private key immediately

### Sending Tokens

1. Open the extension
2. Click "Send"
3. Enter recipient address and amount
4. Click "Confirm"

### Receiving Tokens

1. Open the extension
2. Click "Receive"
3. Share your address or QR code

### Connecting to dApps

The extension automatically injects a Web3 provider into web pages:

```javascript
// Check if wallet is available
if (window.ethereum) {
  // Request account access
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });

  // Send transaction
  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [
      {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5',
        value: '0xDE0B6B3A7640000' // 1 AETH in wei
      }
    ]
  });
}
```

## Supported Methods

The extension implements the EIP-1193 provider specification:

- `eth_requestAccounts` - Request account access
- `eth_accounts` - Get connected accounts
- `eth_chainId` - Get current chain ID
- `eth_getBalance` - Get account balance
- `eth_sendTransaction` - Send transaction
- `eth_sign` - Sign message
- `personal_sign` - Sign personal message
- `eth_signTypedData_v4` - Sign typed data (EIP-712)

## Security

- ✅ Private keys never leave your device
- ✅ All transactions require user confirmation
- ✅ Content Security Policy (CSP) enforced
- ✅ Isolated storage per origin
- ⚠️ **Never share your private key**
- ⚠️ **Always backup your private key**

## Development

### File Structure

```
browser-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Wallet UI
├── popup.js              # UI logic
├── background.js         # Background service worker
├── content-script.js     # Injected into web pages
├── injected.js           # window.ethereum provider
└── icons/                # Extension icons
```

### Testing

1. Load extension in development mode
2. Open extension popup
3. Test sending/receiving transactions
4. Test dApp integration on a test site

### Building for Production

1. Update version in `manifest.json`
2. Add real icons to `icons/` folder (16, 32, 48, 128px)
3. Test thoroughly on both Chrome and Firefox
4. Package for distribution:
   - Chrome: Zip the folder and upload to Chrome Web Store
   - Firefox: Sign at addons.mozilla.org

## API Integration

The extension connects to `https://api.aetheron.network`:

- `POST /api/transaction` - Broadcast transaction
- `GET /api/balance/:address` - Get balance
- `GET /api/price` - Get current AETH price

## Troubleshooting

### Extension not loading

- Check that all files are present
- Verify manifest.json syntax
- Check browser console for errors

### Transactions failing

- Verify sufficient balance
- Check network connection
- Ensure API endpoint is accessible

### dApps not detecting wallet

- Refresh the page after installing
- Check browser console for errors
- Verify content script is injected

## Contributing

Contributions welcome! Please ensure:

- Code follows existing style
- All features are tested
- Security best practices followed

## License

MIT License - see LICENSE file

## Disclaimer

This is experimental software. Use at your own risk. Always:

- Test with small amounts first
- Keep backups of your private keys
- Verify all transaction details
- Use on trusted websites only
