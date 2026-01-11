import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WalletService from '../services/WalletService';
import ApiService from '../services/ApiService';

export default function WalletScreen({ navigation }) {
  const [wallet, setWallet] = useState(null);
  const [balances, setBalances] = useState({});
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const chains = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', emoji: '⟠' },
    { id: 'base', name: 'Base', symbol: 'ETH', emoji: '🔵' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC', emoji: '🟣' },
    { id: 'solana', name: 'Solana', symbol: 'SOL', emoji: '⚡' }
  ];

  useEffect(() => {
    loadWallet();
  }, []);

  useEffect(() => {
    if (wallet) {
      loadBalances();
    }
  }, [wallet, selectedChain]);

  const loadWallet = async () => {
    try {
      const walletData = await AsyncStorage.getItem('aetheron_wallet');
      if (walletData) {
        setWallet(JSON.parse(walletData));
      }
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBalances = async () => {
    if (!wallet) return;

    try {
      const address = selectedChain === 'solana' ? wallet.solanaAddress : wallet.address;

      // Load native balance
      const nativeBalance = await ApiService.getBalance(selectedChain, address);

      // Load AETH token balance
      const tokenBalance = await ApiService.getTokenBalance(selectedChain, address);

      setBalances({
        native: nativeBalance,
        aeth: tokenBalance
      });
    } catch (error) {
      console.error('Failed to load balances:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBalances();
    setRefreshing(false);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const copyAddress = async () => {
    // In a real app, use Clipboard API
    alert('Address copied to clipboard!');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00eaff" />
      </View>
    );
  }

  const currentChain = chains.find((c) => c.id === selectedChain);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00eaff" />
      }
    >
      {/* Chain Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chainSelector}>
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
      </ScrollView>

      {/* Wallet Address */}
      <View style={styles.addressCard}>
        <Text style={styles.label}>Wallet Address</Text>
        <TouchableOpacity onPress={copyAddress}>
          <Text style={styles.address}>
            {formatAddress(selectedChain === 'solana' ? wallet?.solanaAddress : wallet?.address)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Balances */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{currentChain?.symbol} Balance</Text>
        <Text style={styles.balanceAmount}>{balances.native?.toFixed(6) || '0.000000'}</Text>
        <Text style={styles.balanceUSD}>≈ ${((balances.native || 0) * 2000).toFixed(2)} USD</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>AETH Token Balance</Text>
        <Text style={styles.balanceAmount}>{balances.aeth?.toFixed(2) || '0.00'}</Text>
        <Text style={styles.balanceUSD}>Aetheron Token</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Send')}>
          <Text style={styles.actionEmoji}>📤</Text>
          <Text style={styles.actionText}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Receive')}
        >
          <Text style={styles.actionEmoji}>📥</Text>
          <Text style={styles.actionText}>Receive</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Scan')}>
          <Text style={styles.actionEmoji}>📷</Text>
          <Text style={styles.actionText}>Scan</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Transactions Preview */}
      <View style={styles.transactionsPreview}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <Text style={styles.emptyText}>No recent transactions</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f2027'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f2027'
  },
  chainSelector: {
    paddingVertical: 15,
    paddingHorizontal: 10
  },
  chainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1f2e',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  chainButtonActive: {
    borderColor: '#00eaff',
    backgroundColor: '#00eaff22'
  },
  chainEmoji: {
    fontSize: 20,
    marginRight: 5
  },
  chainText: {
    color: '#b2ebf2',
    fontSize: 14,
    fontWeight: '600'
  },
  chainTextActive: {
    color: '#00eaff'
  },
  addressCard: {
    backgroundColor: '#1a1f2e',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00eaff'
  },
  label: {
    color: '#b2ebf2',
    fontSize: 12,
    marginBottom: 5
  },
  address: {
    color: '#00eaff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  balanceCard: {
    backgroundColor: '#1a1f2e',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center'
  },
  balanceLabel: {
    color: '#b2ebf2',
    fontSize: 14,
    marginBottom: 10
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 5
  },
  balanceUSD: {
    color: '#666',
    fontSize: 16
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
    marginTop: 10
  },
  actionButton: {
    backgroundColor: '#1a1f2e',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#00eaff'
  },
  actionEmoji: {
    fontSize: 30,
    marginBottom: 5
  },
  actionText: {
    color: '#00eaff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  transactionsPreview: {
    margin: 15,
    padding: 15,
    backgroundColor: '#1a1f2e',
    borderRadius: 10
  },
  sectionTitle: {
    color: '#00eaff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    padding: 20
  }
});

WalletScreen.propTypes = {
  navigation: PropTypes.object.isRequired
};
