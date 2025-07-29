// Importer les polyfills nécessaires pour React Native
import './src/polyfills';

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Alert, Platform, Text } from 'react-native';
// import { StripeProvider } from '@stripe/stripe-react-native';
import * as Linking from 'expo-linking';
import * as Font from 'expo-font';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/constants';
import ENV from './src/config/env';

export default function App() {
  const publishableKey = ENV.STRIPE_PUBLISHABLE_KEY;
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Inter fonts
    const loadFonts = async () => {
      try {
        console.log('🔵 Loading fonts...');
        await Font.loadAsync({
          'Inter_18pt-Regular': require('./Inter/static/Inter_18pt-Regular.ttf'),
          'Inter_18pt-Medium': require('./Inter/static/Inter_18pt-Medium.ttf'),
          'Inter_18pt-SemiBold': require('./Inter/static/Inter_18pt-SemiBold.ttf'),
          'Inter_18pt-Light': require('./Inter/static/Inter_18pt-Light.ttf'),
        });
        console.log('✅ Fonts loaded successfully');
        setFontsLoaded(true);
      } catch (err) {
        console.error('❌ Error loading fonts:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Continue without fonts
        setFontsLoaded(true);
      }
    };

    loadFonts();
  }, []);

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

  // Show error if fonts failed to load
  if (error) {
    return (
      <View style={styles.container}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Erreur de chargement: {error}</Text>
            <Text style={styles.errorSubtext}>L'application continue sans les polices personnalisées</Text>
          </View>
        </SafeAreaProvider>
      </View>
    );
  }

  // Wait for fonts to load
  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        </SafeAreaProvider>
      </View>
    );
  }

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.error,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 5,
  },
});
