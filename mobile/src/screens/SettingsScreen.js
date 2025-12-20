import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

export default function SettingsScreen({ navigation }) {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    checkBiometric();
    loadSettings();
  }, []);

  const checkBiometric = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);

    const enabled = await AsyncStorage.getItem('biometric_enabled');
    setBiometricEnabled(enabled === 'true');
  };

  const loadSettings = async () => {
    const notifSettings = await AsyncStorage.getItem('notifications_enabled');
    setNotifications(notifSettings !== 'false');
  };

  const toggleBiometric = async (value) => {
    if (value && biometricAvailable) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometric security'
      });

      if (result.success) {
        setBiometricEnabled(true);
        await AsyncStorage.setItem('biometric_enabled', 'true');
      }
    } else {
      setBiometricEnabled(false);
      await AsyncStorage.setItem('biometric_enabled', 'false');
    }
  };

  const toggleNotifications = async (value) => {
    setNotifications(value);
    await AsyncStorage.setItem('notifications_enabled', value.toString());
  };

  const viewRecoveryPhrase = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to view recovery phrase'
    });

    if (result.success) {
      const walletData = await AsyncStorage.getItem('aetheron_wallet');
      if (walletData) {
        const wallet = JSON.parse(walletData);
        Alert.alert('🔐 Recovery Phrase', wallet.mnemonic || 'Recovery phrase not available', [
          { text: 'OK' }
        ]);
      }
    }
  };

  const clearWallet = () => {
    Alert.alert(
      'Clear Wallet',
      'Are you sure? This will remove your wallet from this device. Make sure you have your recovery phrase saved!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.replace('Welcome');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Biometric Authentication</Text>
            <Text style={styles.settingDescription}>
              {biometricAvailable ? 'Use fingerprint or face ID' : 'Not available on this device'}
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={toggleBiometric}
            disabled={!biometricAvailable}
            trackColor={{ false: '#666', true: '#00eaff88' }}
            thumbColor={biometricEnabled ? '#00eaff' : '#f4f4f4'}
          />
        </View>

        <TouchableOpacity style={styles.settingRow} onPress={viewRecoveryPhrase}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>View Recovery Phrase</Text>
            <Text style={styles.settingDescription}>Show your secret phrase</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDescription}>Get notified about transactions</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#666', true: '#00eaff88' }}
            thumbColor={notifications ? '#00eaff' : '#f4f4f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingDescription}>1.0.0</Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Supported Networks</Text>
            <Text style={styles.settingDescription}>Ethereum, Base, Polygon, Solana</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.dangerButton} onPress={clearWallet}>
          <Text style={styles.dangerButtonText}>Clear Wallet Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f2027'
  },
  section: {
    margin: 15
  },
  sectionTitle: {
    color: '#00eaff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  },
  settingRow: {
    backgroundColor: '#1a1f2e',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10
  },
  settingInfo: {
    flex: 1
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5
  },
  settingDescription: {
    color: '#666',
    fontSize: 12
  },
  arrow: {
    color: '#00eaff',
    fontSize: 24,
    marginLeft: 10
  },
  dangerButton: {
    backgroundColor: '#ff525222',
    borderWidth: 2,
    borderColor: '#ff5252',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center'
  },
  dangerButtonText: {
    color: '#ff5252',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
