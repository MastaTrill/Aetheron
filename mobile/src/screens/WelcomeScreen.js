import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import WalletService from '../services/WalletService';

export default function WelcomeScreen({ navigation }) {
  const [importMode, setImportMode] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');

  const createNewWallet = async () => {
    try {
      const wallet = await WalletService.createWallet();

      Alert.alert(
        'Wallet Created!',
        `Your wallet has been created successfully.\n\nAddress: ${wallet.address}\n\nPlease save your recovery phrase securely.`,
        [
          {
            text: 'Show Recovery Phrase',
            onPress: () => showRecoveryPhrase(wallet.mnemonic)
          }
        ]
      );

      await saveWallet(wallet);
    } catch (error) {
      Alert.alert('Error', 'Failed to create wallet: ' + error.message);
    }
  };

  const importWallet = async () => {
    if (!seedPhrase.trim()) {
      Alert.alert('Error', 'Please enter your recovery phrase');
      return;
    }

    try {
      const wallet = await WalletService.importWallet(seedPhrase.trim());

      Alert.alert(
        'Wallet Imported!',
        `Your wallet has been imported successfully.\n\nAddress: ${wallet.address}`,
        [{ text: 'OK', onPress: () => saveWallet(wallet) }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to import wallet: ' + error.message);
    }
  };

  const saveWallet = async (wallet) => {
    try {
      await AsyncStorage.setItem('aetheron_wallet', JSON.stringify(wallet));
      await AsyncStorage.setItem('aetheron_address', wallet.address);

      // Set up biometric if available
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (compatible && enrolled) {
        await AsyncStorage.setItem('biometric_enabled', 'true');
      }

      // Reload app to show main screens
      navigation.replace('Main');
    } catch (error) {
      Alert.alert('Error', 'Failed to save wallet');
    }
  };

  const showRecoveryPhrase = (mnemonic) => {
    Alert.alert(
      '🔐 Recovery Phrase',
      `Write this down and keep it safe:\n\n${mnemonic}\n\n⚠️ Never share this with anyone!`,
      [{ text: 'I have saved it', onPress: () => {} }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>⚡️</Text>
        <Text style={styles.title}>Aetheron Wallet</Text>
        <Text style={styles.subtitle}>Secure Multi-Chain Crypto Wallet</Text>

        {!importMode ? (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={createNewWallet}>
              <Text style={styles.primaryButtonText}>Create New Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => setImportMode(true)}>
              <Text style={styles.secondaryButtonText}>Import Existing Wallet</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Enter your 12-word recovery phrase"
              placeholderTextColor="#666"
              value={seedPhrase}
              onChangeText={setSeedPhrase}
              multiline
              numberOfLines={3}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={importWallet}>
              <Text style={styles.primaryButtonText}>Import Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => setImportMode(false)}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.features}>
          <Text style={styles.featureText}>✅ Multi-Chain Support</Text>
          <Text style={styles.featureText}>🔒 Biometric Security</Text>
          <Text style={styles.featureText}>📱 QR Code Scanning</Text>
          <Text style={styles.featureText}>🌐 Ethereum, Base, Polygon, Solana</Text>
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
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: {
    fontSize: 80,
    marginBottom: 20
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00eaff',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#b2ebf2',
    marginBottom: 40,
    textAlign: 'center'
  },
  primaryButton: {
    backgroundColor: '#00eaff',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#0f2027',
    fontSize: 18,
    fontWeight: 'bold'
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00eaff',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: '#00eaff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  input: {
    backgroundColor: '#1a1f2e',
    borderWidth: 1,
    borderColor: '#00eaff',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    width: '100%',
    marginBottom: 20,
    textAlignVertical: 'top'
  },
  features: {
    marginTop: 40,
    alignItems: 'center'
  },
  featureText: {
    color: '#b2ebf2',
    fontSize: 14,
    marginVertical: 5
  }
});

WelcomeScreen.propTypes = {
  navigation: PropTypes.object.isRequired
};
