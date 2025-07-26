// Importer les polyfills nécessaires pour React Native
import './src/polyfills';

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Alert, Platform } from 'react-native';
// import { StripeProvider } from '@stripe/stripe-react-native';
import * as Linking from 'expo-linking';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/constants';

export default function App() {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

  useEffect(() => {
    // Handle deep link redirects from Stripe onboarding (mobile only)
    if (Platform.OS !== 'web') {
      const handleDeepLink = (event: { url: string }) => {
        if (event.url.includes('stripe-onboarding-success')) {
                Alert.alert('Success', 'Your bank account has been successfully configured!');
    } else if (event.url.includes('stripe-onboarding-cancel')) {
      Alert.alert('Cancelled', 'Bank account setup cancelled.');
        }
      };

      const subscription = Linking.addEventListener('url', handleDeepLink);
      return () => subscription?.remove();
    }
  }, []);

  // On web, don't wrap with StripeProvider as we handle Stripe differently
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, styles.webContainer]}>
        <SafeAreaProvider>
          <AppNavigator />
        </SafeAreaProvider>
      </View>
    );
  }

  // On mobile, use StripeProvider (disabled for now)
  return (
    <View style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  webContainer: {
    // Web-specific styles
    minHeight: '100vh',
    ...(Platform.OS === 'web' && {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }),
  },
});
