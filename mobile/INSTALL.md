# Aetheron Mobile Wallet - Installation Guide

This guide will help you set up and run the Aetheron Mobile Wallet on your development machine and test devices.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Running on Devices](#running-on-devices)
5. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)

   - Download from [nodejs.org](https://nodejs.org)
   - Verify installation: `node --version`

2. **npm** or **yarn**

   - Comes with Node.js
   - Verify: `npm --version`

3. **Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

### Optional (for native builds)

4. **For iOS Development** (Mac only):

   - Xcode 14+ from Mac App Store
   - Xcode Command Line Tools
   - iOS Simulator

5. **For Android Development**:
   - Android Studio
   - Android SDK Platform 33+
   - Android Virtual Device (AVD)

## Quick Start

```bash
# 1. Navigate to mobile directory
cd mobile

# 2. Install dependencies
npm install

# 3. Start Expo development server
npm start

# 4. Choose your platform:
# - Press 'i' for iOS Simulator
# - Press 'a' for Android Emulator
# - Scan QR code with Expo Go app on physical device
```

## Detailed Setup

### Step 1: Backend Server Setup

The mobile app requires the Aetheron backend server to be running.

1. In the main Aetheron directory (not mobile/):

   ```bash
   npm install
   npm start
   ```

2. Verify server is running:
   - API: http://localhost:3000
   - WebSocket: ws://localhost:3001

### Step 2: Configure API Endpoint

Edit `mobile/src/services/ApiService.js`:

**For local development (device same network as computer):**

```javascript
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:3000';
// Example: const API_BASE_URL = 'http://192.168.1.100:3000';
```

**To find your computer's IP:**

- **Windows**: Open Command Prompt, run `ipconfig`, look for IPv4 Address
- **Mac/Linux**: Open Terminal, run `ifconfig | grep "inet "`, look for 192.168.x.x

**Important**: Do NOT use `localhost` or `127.0.0.1` when testing on a physical device!

### Step 3: Install Mobile Dependencies

```bash
cd mobile
npm install
```

This will install all required packages including:

- React Native and Expo
- Navigation libraries
- Biometric authentication
- QR code scanner and generator
- Wallet libraries (ethers.js)
- Secure storage

### Step 4: Start Development Server

```bash
npm start
```

You should see:

```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

## Running on Devices

### Option 1: Physical Device (Recommended for Testing)

#### iOS (iPhone/iPad):

1. Install **Expo Go** from App Store
2. Open Camera app
3. Scan QR code from terminal
4. App will open in Expo Go

#### Android:

1. Install **Expo Go** from Google Play Store
2. Open Expo Go app
3. Scan QR code from terminal
4. App will open

**Note**: Ensure your phone and computer are on the same WiFi network.

### Option 2: iOS Simulator (Mac only)

1. Install Xcode from Mac App Store
2. Open Xcode → Preferences → Components
3. Install iOS Simulator
4. In terminal with Expo running, press `i`
5. Simulator will launch and app will load

### Option 3: Android Emulator

1. Install Android Studio
2. Open AVD Manager
3. Create a new virtual device (Pixel 5 recommended)
4. Start the emulator
5. In terminal with Expo running, press `a`
6. App will install and launch

## Configuration

### Camera Permissions

Already configured in `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow Aetheron to access your camera for QR code scanning"
        }
      ]
    ]
  }
}
```

### Biometric Authentication

Configured automatically via expo-local-authentication. Works with:

- iOS: Face ID, Touch ID
- Android: Fingerprint, Face Unlock

## Testing the App

### 1. Create a New Wallet

- Launch app → Welcome screen
- Tap "Create New Wallet"
- **Save the recovery phrase!** (12 words)
- Set up biometric authentication (optional)

### 2. Test Wallet Screen

- Should show balances for all chains
- Switch between Ethereum, Base, Polygon, Solana
- Balances will load from backend API

### 3. Test Send Transaction

- Tap "Send" button
- Select network
- Enter recipient address or scan QR code
- Enter amount
- Review fee estimate
- Confirm transaction

### 4. Test Receive

- Tap "Receive" button
- View your wallet address as QR code
- Test "Copy" and "Share" buttons
- Switch networks to see different addresses

### 5. Test QR Scanner

- From Send screen, tap QR icon
- Point camera at a wallet address QR code
- Should auto-fill recipient field

## Building for Production

### iOS App Store

1. Configure app in `app.json`:

   ```json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.yourcompany.aetheron",
         "buildNumber": "1.0.0"
       }
     }
   }
   ```

2. Build:

   ```bash
   eas build --platform ios
   ```

3. Submit to App Store:
   ```bash
   eas submit --platform ios
   ```

### Google Play Store

1. Configure app in `app.json`:

   ```json
   {
     "expo": {
       "android": {
         "package": "com.yourcompany.aetheron",
         "versionCode": 1
       }
     }
   }
   ```

2. Build:

   ```bash
   eas build --platform android
   ```

3. Submit to Play Store:
   ```bash
   eas submit --platform android
   ```

## Troubleshooting

### "Unable to resolve module"

```bash
cd mobile
rm -rf node_modules
npm install
npm start -- --reset-cache
```

### "Network request failed"

- Verify backend server is running
- Check API_BASE_URL in ApiService.js
- Ensure device and computer on same network
- Check firewall settings

### "Camera permission denied"

- iOS: Settings → Privacy → Camera → Enable for Expo Go
- Android: Settings → Apps → Expo Go → Permissions → Camera

### "WebSocket connection failed"

- Update WebSocket URL in ApiService.js
- Use computer's IP address, not localhost
- Ensure port 3001 is not blocked

### "Biometric authentication not available"

- Ensure device has Face ID/Touch ID/Fingerprint set up
- Go to device Settings → Face ID/Touch ID
- Enroll your biometric data

### App crashes on launch

```bash
# Clear Expo cache
expo start -c

# Or manually clear
rm -rf .expo
rm -rf node_modules
npm install
```

### "ethers.js not found"

```bash
npm install ethers@^6.13.0
```

## Development Tips

### Hot Reload

- Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android)
- Enable "Fast Refresh" for automatic updates

### Debug Menu

- **iOS Simulator**: `Cmd+D`
- **Android Emulator**: `Cmd+M` or `Ctrl+M`
- **Physical Device**: Shake the device

### Viewing Logs

```bash
# All logs
npm start

# iOS only
npm run ios

# Android only
npm run android
```

### Remote Debugging

1. Open debug menu
2. Select "Debug Remote JS"
3. Opens Chrome DevTools
4. Use Console, Network tabs for debugging

## Environment Variables

Create `.env` file in mobile directory:

```
API_URL=http://192.168.1.100:3000
WS_URL=ws://192.168.1.100:3001
```

Then update ApiService.js:

```javascript
import Constants from 'expo-constants';
const API_BASE_URL = Constants.expoConfig.extra.apiUrl;
```

## Security Checklist

Before deploying:

- [ ] Replace API_BASE_URL with production server
- [ ] Enable HTTPS for API communication
- [ ] Set up proper error logging (Sentry, etc.)
- [ ] Test biometric authentication on multiple devices
- [ ] Verify recovery phrase backup flow
- [ ] Test transaction confirmation dialogs
- [ ] Review all permission requests
- [ ] Test on low-end devices for performance

## Next Steps

After successful installation:

1. ✅ Test all screens and features
2. ✅ Create test wallet and transactions
3. ✅ Test on both iOS and Android
4. ✅ Verify backend API integration
5. ✅ Test biometric authentication
6. ✅ Document any bugs or issues

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [ethers.js Documentation](https://docs.ethers.org)
- [React Navigation](https://reactnavigation.org)

## Support

Need help?

- Check the main [README.md](README.md)
- Review [Troubleshooting](#troubleshooting) section
- Open an issue on GitHub
- Join our Discord community

---

**Happy Building! 🚀**
