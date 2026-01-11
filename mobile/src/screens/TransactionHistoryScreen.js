import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function TransactionHistoryScreen() {
  const transactions = [
    // Mock data - in a real app, this would come from the API
    {
      id: '1',
      type: 'send',
      amount: '0.5',
      address: '0x1234...5678',
      date: '2025-12-18',
      status: 'confirmed',
      chain: 'ethereum'
    },
    {
      id: '2',
      type: 'receive',
      amount: '1.2',
      address: '0xabcd...efgh',
      date: '2025-12-17',
      status: 'confirmed',
      chain: 'base'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
    case 'confirmed':
      return '#4caf50';
    case 'pending':
      return '#ffa726';
    case 'failed':
      return '#ff5252';
    default:
      return '#666';
    }
  };

  const getChainEmoji = (chain) => {
    switch (chain) {
    case 'ethereum':
      return '⟠';
    case 'base':
      return '🔵';
    case 'polygon':
      return '🟣';
    case 'solana':
      return '⚡';
    default:
      return '🔗';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Your transaction history will appear here</Text>
          </View>
        ) : (
          transactions.map((tx) => (
            <View key={tx.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View style={styles.transactionType}>
                  <Text style={styles.transactionEmoji}>{tx.type === 'send' ? '📤' : '📥'}</Text>
                  <Text style={styles.transactionTypeText}>
                    {tx.type === 'send' ? 'Sent' : 'Received'}
                  </Text>
                  <Text style={styles.chainEmoji}>{getChainEmoji(tx.chain)}</Text>
                </View>
                <Text style={[styles.transactionStatus, { color: getStatusColor(tx.status) }]}>
                  {tx.status}
                </Text>
              </View>

              <View style={styles.transactionDetails}>
                <Text style={styles.transactionAmount}>
                  {tx.type === 'send' ? '-' : '+'}
                  {tx.amount} AETH
                </Text>
                <Text style={styles.transactionAddress}>
                  {tx.type === 'send' ? 'To: ' : 'From: '}
                  {tx.address}
                </Text>
                <Text style={styles.transactionDate}>{tx.date}</Text>
              </View>
            </View>
          ))
        )}
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
    padding: 15
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20
  },
  emptyText: {
    color: '#b2ebf2',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14
  },
  transactionCard: {
    backgroundColor: '#1a1f2e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#00eaff'
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  transactionType: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  transactionEmoji: {
    fontSize: 24,
    marginRight: 10
  },
  transactionTypeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10
  },
  chainEmoji: {
    fontSize: 18
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  transactionDetails: {
    marginLeft: 34
  },
  transactionAmount: {
    color: '#00eaff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5
  },
  transactionAddress: {
    color: '#b2ebf2',
    fontSize: 14,
    marginBottom: 5
  },
  transactionDate: {
    color: '#666',
    fontSize: 12
  }
});
