import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';

export default function ReceiveScreen() {
  const [address, setAddress] = useState('');
  const [selectedChain, setSelectedChain] = useState('ethereum');

  const chains = [
    { id: 'ethereum', name: 'Ethereum', emoji: '⟠' },
    { id: 'base', name: 'Base', emoji: '🔵' },
    { id: 'polygon', name: 'Polygon', emoji: '🟣' },
    { id: 'solana', name: 'Solana', emoji: '⚡' }
  ];

  useEffect(() => {
    loadAddress();
  }, [selectedChain]);

  const loadAddress = async () => {
    try {
      const walletData = await AsyncStorage.getItem('aetheron_wallet');
      if (walletData) {
        const wallet = JSON.parse(walletData);
        setAddress(selectedChain === 'solana' ? wallet.solanaAddress : wallet.address);
      }
    } catch (error) {
      console.error('Failed to load address:', error);
    }
  };

  const copyAddress = async () => {
    // In a real app, use Clipboard API
    Alert.alert('Copied!', 'Address copied to clipboard');
  };

  const shareAddress = () => {
    // In a real app, use Share API
    Alert.alert('Share', 'Share functionality coming soon');
  };

  return (
    <View style={styles.container}>
      {/* Chain Selector */}
      <View style={styles.chainContainer}>
        {chains.map((chain) => (
          <TouchableOpacity
            key={chain.id}
            style={[styles.chainButton, selectedChain === chain.id && styles.chainButtonActive]}
            onPress={() => setSelectedChain(chain.id)}
          >
            <Text style={styles.chainEmoji}>{chain.emoji}</Text>
            <Text style={[styles.chainText, selectedChain === chain.id && styles.chainTextActive]}>
              {chain.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* QR Code */}
      <View style={styles.qrContainer}>
        <View style={styles.qrWrapper}>
          {address ? (
            <QRCode value={address} size={250} color="#0f2027" backgroundColor="#ffffff" />
          ) : (
            <Text style={styles.loadingText}>Loading...</Text>
          )}
        </View>
      </View>

      {/* Address Display */}
      <View style={styles.addressContainer}>
        <Text style={styles.label}>Your Address</Text>
        <TouchableOpacity onPress={copyAddress}>
          <Text style={styles.address}>{address}</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={copyAddress}>
          <Text style={styles.actionButtonText}>📋 Copy Address</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={shareAddress}>
          <Text style={styles.actionButtonText}>📤 Share</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>How to Receive</Text>
        <Text style={styles.instructionsText}>
          1. Share your QR code or address with the sender{'\n'}
          2. Ensure they select the correct network{'\n'}
          3. Wait for the transaction to confirm
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f2027',
    padding: 20
  },
  chainContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30
  },
  chainButton: {
    backgroundColor: '#1a1f2e',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 70,
    alignItems: 'center'
  },
  chainButtonActive: {
    borderColor: '#00eaff',
    backgroundColor: '#00eaff22'
  },
  chainEmoji: {
    fontSize: 24,
    marginBottom: 5
  },
  chainText: {
    color: '#b2ebf2',
    fontSize: 12
  },
  chainTextActive: {
    color: '#00eaff'
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 30
  },
  qrWrapper: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20
  },
  loadingText: {
    color: '#666',
    padding: 100
  },
  addressContainer: {
    backgroundColor: '#1a1f2e',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00eaff',
    marginBottom: 20
  },
  label: {
    color: '#b2ebf2',
    fontSize: 12,
    marginBottom: 10
  },
  address: {
    color: '#00eaff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30
  },
  actionButton: {
    backgroundColor: '#00eaff',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center'
  },
  actionButtonText: {
    color: '#0f2027',
    fontSize: 16,
    fontWeight: 'bold'
  },
  instructionsContainer: {
    backgroundColor: '#1a1f2e',
    padding: 20,
    borderRadius: 10
  },
  instructionsTitle: {
    color: '#00eaff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10
  },
  instructionsText: {
    color: '#b2ebf2',
    fontSize: 14,
    lineHeight: 22
  }
});
