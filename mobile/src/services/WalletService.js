import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { ethers } from 'ethers';

class WalletService {
  constructor() {
    this.wallet = null;
  }

  /**
   * Create a new wallet with mnemonic phrase
   */
  async createWallet() {
    try {
      // Generate random wallet
      const wallet = ethers.Wallet.createRandom();

      const walletData = {
        address: wallet.address,
        mnemonic: wallet.mnemonic.phrase,
        publicKey: wallet.publicKey,
        createdAt: new Date().toISOString()
      };

      // Store wallet data
      await AsyncStorage.setItem('aetheron_wallet', JSON.stringify(walletData));

      // Store private key securely
      await SecureStore.setItemAsync('wallet_private_key', wallet.privateKey);

      this.wallet = wallet;
      return walletData;
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  /**
   * Import wallet from mnemonic phrase
   */
  async importWallet(mnemonic) {
    try {
      // Validate and restore wallet from mnemonic
      const wallet = ethers.Wallet.fromPhrase(mnemonic);

      const walletData = {
        address: wallet.address,
        mnemonic: wallet.mnemonic.phrase,
        publicKey: wallet.publicKey,
        importedAt: new Date().toISOString()
      };

      // Store wallet data
      await AsyncStorage.setItem('aetheron_wallet', JSON.stringify(walletData));

      // Store private key securely
      await SecureStore.setItemAsync('wallet_private_key', wallet.privateKey);

      this.wallet = wallet;
      return walletData;
    } catch (error) {
      console.error('Error importing wallet:', error);
      throw new Error('Invalid recovery phrase');
    }
  }

  /**
   * Load existing wallet from storage
   */
  async loadWallet() {
    try {
      const walletData = await AsyncStorage.getItem('aetheron_wallet');
      if (!walletData) {
        return null;
      }

      const privateKey = await SecureStore.getItemAsync('wallet_private_key');
      if (!privateKey) {
        throw new Error('Private key not found');
      }

      this.wallet = new ethers.Wallet(privateKey);
      return JSON.parse(walletData);
    } catch (error) {
      console.error('Error loading wallet:', error);
      throw error;
    }
  }

  /**
   * Get wallet address
   */
  getAddress() {
    return this.wallet?.address || null;
  }

  /**
   * Sign a transaction for EVM chains (Ethereum, Base, Polygon)
   */
  async signTransaction(transaction) {
    if (!this.wallet) {
      throw new Error('Wallet not loaded');
    }

    try {
      const signedTx = await this.wallet.signTransaction(transaction);
      return signedTx;
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw error;
    }
  }

  /**
   * Sign a message
   */
  async signMessage(message) {
    if (!this.wallet) {
      throw new Error('Wallet not loaded');
    }

    try {
      const signature = await this.wallet.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }

  /**
   * Get Solana-compatible keypair (derived from Ethereum private key)
   * Note: This is a simplified approach. For production, consider using separate key derivation
   */
  getSolanaAddress() {
    if (!this.wallet) {
      return null;
    }

    // For demo purposes, use the same Ethereum address format
    // In production, you'd derive a proper Solana keypair
    return this.wallet.address;
  }

  /**
   * Clear wallet data
   */
  async clearWallet() {
    try {
      await AsyncStorage.removeItem('aetheron_wallet');
      await SecureStore.deleteItemAsync('wallet_private_key');
      this.wallet = null;
    } catch (error) {
      console.error('Error clearing wallet:', error);
      throw error;
    }
  }

  /**
   * Export private key (use with caution!)
   */
  async getPrivateKey() {
    try {
      const privateKey = await SecureStore.getItemAsync('wallet_private_key');
      return privateKey;
    } catch (error) {
      console.error('Error getting private key:', error);
      throw error;
    }
  }

  /**
   * Validate address format
   */
  isValidAddress(address, chain = 'ethereum') {
    if (chain === 'solana') {
      // Solana addresses are base58 and 32-44 characters
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    } else {
      // EVM addresses (Ethereum, Base, Polygon)
      return ethers.isAddress(address);
    }
  }
}

export default new WalletService();
