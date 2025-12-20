# Aetheron Mobile Wallet

A secure, multi-chain mobile wallet for the Aetheron blockchain platform built with React Native and Expo.

## Features

### ✨ Core Features

- **Multi-Chain Support**: Ethereum, Base, Polygon, and Solana networks
- **Secure Wallet Management**: Create or import wallets with mnemonic phrases
- **Biometric Authentication**: Face ID / Touch ID / Fingerprint support
- **QR Code Scanning**: Scan wallet addresses for quick transactions
- **Real-time Updates**: WebSocket integration for live blockchain data
- **Transaction History**: Track all your sends and receives
- **Secure Storage**: Private keys stored in device secure storage

### 🔒 Security

- Private keys encrypted and stored in Expo SecureStore
- Biometric authentication for sensitive operations
- Recovery phrase backup and restore
- Transaction confirmation dialogs
- Secure key derivation using ethers.js

### 🌐 Supported Networks

- **Ethereum** (Mainnet) - Chain ID: 1
- **Base** - Chain ID: 8453
- **Polygon** - Chain ID: 137
- **Solana** - Mainnet Beta

## Installation

### Prerequisites

- Node.js 18+ installed
- Expo CLI installed globally: `npm install -g expo-cli`
- iOS Simulator (for Mac) or Android Studio (for Android development)
- Physical device with Expo Go app (optional)

### Setup

1. Navigate to the mobile directory:

```bash
cd mobile
```

2. Install dependencies:

```bash
npm install
```

3. Update API endpoint in `src/services/ApiService.js`:

```javascript
const API_BASE_URL = 'http://YOUR_SERVER_IP:3000';
```

4. Start the Expo development server:

```bash
npm start
```

5. Run on your device:
   - **iOS Simulator**: Press `i` in the terminal
   - **Android Emulator**: Press `a` in the terminal
   - **Physical Device**: Scan QR code with Expo Go app

## Project Structure

```
mobile/
├── App.js                          # Main navigation and authentication
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── src/
│   ├── screens/
│   │   ├── WelcomeScreen.js       # Wallet creation/import
│   │   ├── WalletScreen.js        # Main wallet dashboard
│   │   ├── SendScreen.js          # Send transactions
│   │   ├── ReceiveScreen.js       # Receive via QR code
│   │   ├── ScanScreen.js          # QR code scanner
│   │   ├── TransactionHistoryScreen.js  # Transaction list
│   │   └── SettingsScreen.js      # App settings
│   └── services/
│       ├── WalletService.js       # Wallet management
│       └── ApiService.js          # Backend API communication
```

## Screen Descriptions

### Welcome Screen

- First-time user experience
- Create new wallet with auto-generated mnemonic
- Import existing wallet using recovery phrase
- Biometric authentication setup

### Wallet Screen

- Multi-chain balance display
- Network selector (Ethereum, Base, Polygon, Solana)
- Quick actions (Send, Receive, Scan)
- Real-time balance updates

### Send Screen

- Enter recipient address or scan QR code
- Select network
- Enter amount to send
- Fee estimation
- Transaction confirmation

### Receive Screen

- Display wallet address as QR code
- Copy address to clipboard
- Share address
- Network-specific addresses

### Scan Screen

- Camera-based QR code scanner
- Address validation
- Auto-fill recipient address in Send screen

### Transaction History

- List of all transactions
- Filter by type (send/receive)
- Transaction status indicators
- Chain-specific icons

### Settings Screen

- Biometric authentication toggle
- View recovery phrase (with authentication)
- Notification preferences
- App information
- Clear wallet data

## API Integration

The mobile app connects to the Aetheron backend server for:

- Balance queries (`/multichain/balance/:chain/:address`)
- Token balance (`/multichain/token-balance/:chain/:address`)
- Transaction broadcasting (`/multichain/send`)
- Gas price estimation (`/multichain/gas-price/:chain`)
- Real-time updates via WebSocket (`ws://localhost:3001`)

## Development

### Adding a New Screen

1. Create screen component in `src/screens/`
2. Add route in `App.js` navigation stack
3. Update bottom tab navigator if needed

### Testing on Device

1. Install Expo Go from App Store/Google Play
2. Ensure device and computer are on same network
3. Scan QR code from terminal
4. App will hot-reload on code changes

### Building for Production

**iOS:**

```bash
expo build:ios
```

**Android:**

```bash
expo build:android
```

## Security Best Practices

⚠️ **Important Security Notes:**

1. **Never expose private keys**: Keys are stored in SecureStore, never log them
2. **Recovery phrase**: Users must save their 12-word phrase securely
3. **API endpoints**: Use HTTPS in production
4. **Biometric fallback**: Always provide alternative authentication
5. **Transaction validation**: Always confirm transaction details before sending

## Troubleshooting

### Common Issues

**Camera not working:**

- Grant camera permissions in device settings
- Check `app.json` for camera permission configuration

**WebSocket connection fails:**

- Ensure backend server is running on port 3001
- Update WebSocket URL in ApiService.js
- Check firewall settings

**Balance not updating:**

- Verify API endpoint is reachable
- Check network selection matches wallet address
- Ensure backend server is synced with blockchain

**Biometric authentication unavailable:**

- Device must support Face ID/Touch ID/Fingerprint
- Check device settings for biometric enrollment
- Fallback to standard authentication

## Dependencies

### Core

- `expo` - Development platform
- `react-native` - Mobile framework
- `ethers` - Ethereum library for wallet management

### Navigation

- `@react-navigation/native` - Navigation library
- `@react-navigation/native-stack` - Stack navigator
- `@react-navigation/bottom-tabs` - Tab navigator

### Storage

- `@react-native-async-storage/async-storage` - Local storage
- `expo-secure-store` - Secure encrypted storage

### Security

- `expo-local-authentication` - Biometric authentication

### QR Code

- `expo-camera` - Camera access
- `expo-barcode-scanner` - QR code scanning (deprecated, using expo-camera)
- `react-native-qrcode-svg` - QR code generation

### UI

- `react-native-safe-area-context` - Safe area handling
- `react-native-screens` - Native screen optimization
- `react-native-svg` - SVG support for QR codes

## Roadmap

- [ ] Push notifications for incoming transactions
- [ ] Multi-language support
- [ ] Fiat currency conversion
- [ ] Transaction export (CSV)
- [ ] Contact book for addresses
- [ ] NFT gallery
- [ ] DApp browser
- [ ] Hardware wallet integration

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:

- GitHub Issues: [Aetheron Issues](https://github.com/aetheron/issues)
- Documentation: See main README.md
- Discord: [Aetheron Community](https://discord.gg/aetheron)

## Acknowledgments

- Built with [Expo](https://expo.dev)
- Powered by [ethers.js](https://docs.ethers.org)
- Icons and design inspiration from Material Design

---

**⚠️ Disclaimer**: This is a cryptocurrency wallet. Always ensure you have backed up your recovery phrase before using real funds. The developers are not responsible for any loss of funds.
