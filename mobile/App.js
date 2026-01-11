import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import WalletScreen from './src/screens/WalletScreen';
import SendScreen from './src/screens/SendScreen';
import ReceiveScreen from './src/screens/ReceiveScreen';
import ScanScreen from './src/screens/ScanScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TransactionHistoryScreen from './src/screens/TransactionHistoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f2027'
        },
        headerTintColor: '#00eaff',
        tabBarStyle: {
          backgroundColor: '#1a1f2e',
          borderTopColor: '#00eaff',
          borderTopWidth: 1
        },
        tabBarActiveTintColor: '#00eaff',
        tabBarInactiveTintColor: '#b2ebf2'
      }}
    >
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>💼</Text>
        }}
      />
      <Tab.Screen
        name="Send"
        component={SendScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>📤</Text>
        }}
      />
      <Tab.Screen
        name="Receive"
        component={ReceiveScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>📥</Text>
        }}
      />
      <Tab.Screen
        name="History"
        component={TransactionHistoryScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>📜</Text>
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>⚙️</Text>
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkWalletAndAuth();
  }, []);

  const checkWalletAndAuth = async () => {
    try {
      // Check if wallet exists
      const wallet = await AsyncStorage.getItem('aetheron_wallet');
      setHasWallet(!!wallet);

      // Check biometric availability
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (compatible && enrolled && wallet) {
        // Require biometric authentication
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to access your Aetheron Wallet',
          fallbackLabel: 'Use passcode'
        });
        setIsAuthenticated(result.success);
      } else {
        // No biometric or no wallet, skip auth
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setIsAuthenticated(true); // Fallback to allow access
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0f2027'
          },
          headerTintColor: '#00eaff',
          contentStyle: {
            backgroundColor: '#0f2027'
          }
        }}
      >
        {!hasWallet || !isAuthenticated ? (
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="Scan"
              component={ScanScreen}
              options={{
                title: 'Scan QR Code',
                presentation: 'modal'
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
