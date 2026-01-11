import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WalletService from '../services/WalletService';

export default function SendScreen({ navigation }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [sending, setSending] = useState(false);

  const chains = [
    { id: 'ethereum', name: 'Ethereum', emoji: '⟠' },
    { id: 'base', name: 'Base', emoji: '🔵' },
    { id: 'polygon', name: 'Polygon', emoji: '🟣' },
    { id: 'solana', name: 'Solana', emoji: '⚡' }
  ];

  const handleScan = () => {
    navigation.navigate('Scan', {
      onScan: (address) => {
        setRecipient(address);
      }
    });
  };

  const handleSend = async () => {
    if (!recipient || !amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Amount must be greater than 0');
      return;
    }

    Alert.alert('Confirm Transaction', `Send ${amount} AETH to ${recipient.substring(0, 10)}...?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: confirmSend }
    ]);
  };

  const confirmSend = async () => {
    setSending(true);
    try {
      const walletData = await AsyncStorage.getItem('aetheron_wallet');
      if (!walletData) {
        throw new Error('Wallet not found');
      }

      const wallet = JSON.parse(walletData);

      // In a real app, this would sign and broadcast the transaction
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate network delay

      Alert.alert(
        'Success!',
        `Transaction sent successfully!\n\nAmount: ${amount} AETH\nTo: ${recipient}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setRecipient('');
              setAmount('');
              navigation.navigate('Wallet');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send transaction: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Chain Selector */}
        <Text style={styles.label}>Select Network</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chainSelector}>
          {chains.map((chain) => (
            <TouchableOpacity
              key={chain.id}
              style={[styles.chainButton, selectedChain === chain.id && styles.chainButtonActive]}
              onPress={() => setSelectedChain(chain.id)}
            >
              <Text style={styles.chainEmoji}>{chain.emoji}</Text>
              <Text
                style={[styles.chainText, selectedChain === chain.id && styles.chainTextActive]}
              >
                {chain.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Recipient Address */}
        <Text style={styles.label}>Recipient Address</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="0x... or Solana address"
            placeholderTextColor="#666"
            value={recipient}
            onChangeText={setRecipient}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.scanButton} onPress={handleScan}>
            <Text style={styles.scanButtonText}>📷</Text>
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <Text style={styles.label}>Amount (AETH)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          placeholderTextColor="#666"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        {/* Fee Estimate */}
        <View style={styles.feeContainer}>
          <Text style={styles.feeLabel}>Estimated Fee</Text>
          <Text style={styles.feeAmount}>~0.001 ETH</Text>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#0f2027" />
          ) : (
            <Text style={styles.sendButtonText}>Send Transaction</Text>
          )}
        </TouchableOpacity>

        {/* Warning */}
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Double-check the recipient address before sending. Transactions cannot be reversed!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f2027'
  },
  content: {
    padding: 20
  },
  label: {
    color: '#b2ebf2',
    fontSize: 14,
    marginTop: 15,
    marginBottom: 8,
    fontWeight: '600'
  },
  chainSelector: {
    marginBottom: 10
  },
  chainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  chainButtonActive: {
    borderColor: '#00eaff',
    backgroundColor: '#00eaff22'
  },
  chainEmoji: {
    fontSize: 18,
    marginRight: 5
  },
  chainText: {
    color: '#b2ebf2',
    fontSize: 14
  },
  chainTextActive: {
    color: '#00eaff'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1f2e',
    borderWidth: 1,
    borderColor: '#00eaff',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16
  },
  scanButton: {
    backgroundColor: '#00eaff',
    padding: 15,
    borderRadius: 10,
    marginLeft: 10
  },
  scanButtonText: {
    fontSize: 24
  },
  feeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1a1f2e',
    padding: 15,
    borderRadius: 10,
    marginTop: 20
  },
  feeLabel: {
    color: '#b2ebf2',
    fontSize: 14
  },
  feeAmount: {
    color: '#00eaff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  sendButton: {
    backgroundColor: '#00eaff',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30
  },
  sendButtonDisabled: {
    opacity: 0.5
  },
  sendButtonText: {
    color: '#0f2027',
    fontSize: 18,
    fontWeight: 'bold'
  },
  warningContainer: {
    backgroundColor: '#ff525222',
    borderLeftWidth: 4,
    borderLeftColor: '#ff5252',
    padding: 15,
    borderRadius: 10,
    marginTop: 20
  },
  warningText: {
    color: '#ff5252',
    fontSize: 12
  }
});

SendScreen.propTypes = {
  navigation: PropTypes.object.isRequired
};
