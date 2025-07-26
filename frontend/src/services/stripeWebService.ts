import { Platform } from 'react-native';
import { loadStripe, Stripe as StripeJS } from '@stripe/stripe-js';

// Import Stripe React Native only on mobile
let StripeReactNative: any = null;
if (Platform.OS !== 'web') {
  try {
    StripeReactNative = require('@stripe/stripe-react-native');
  } catch (e) {
    console.log('Stripe React Native not available');
  }
}

interface StripeAdapter {
  createPaymentMethod: (params: any) => Promise<any>;
  confirmPayment: (clientSecret: string, params?: any) => Promise<any>;
  initializePaymentSheet: (params: any) => Promise<any>;
  presentPaymentSheet: () => Promise<any>;
}

class StripeWebAdapter implements StripeAdapter {
  private stripe: StripeJS | null = null;

  async initialize() {
    if (!this.stripe) {
      const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        throw new Error('Stripe publishable key not found');
      }
      this.stripe = await loadStripe(publishableKey);
    }
    return this.stripe;
  }

  async createPaymentMethod(params: any) {
    const stripe = await this.initialize();
    if (!stripe) throw new Error('Stripe not initialized');

    return await stripe.createPaymentMethod({
      type: 'card',
      card: params.card,
      billing_details: params.billing_details,
    });
  }

  async confirmPayment(clientSecret: string, params?: any) {
    const stripe = await this.initialize();
    if (!stripe) throw new Error('Stripe not initialized');

    return await stripe.confirmCardPayment(clientSecret, {
      payment_method: params?.payment_method || {
        card: params?.card,
        billing_details: params?.billing_details,
      },
    });
  }

  async initializePaymentSheet(params: any) {
    // For web, we don't use payment sheet, so this is a no-op
    return { error: null };
  }

  async presentPaymentSheet() {
    // For web, we handle payment directly without payment sheet
    return { error: null };
  }

  // Web-specific method for creating card element
  async createCardElement() {
    const stripe = await this.initialize();
    if (!stripe) throw new Error('Stripe not initialized');

    const elements = stripe.elements();
    return elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
      },
    });
  }
}

class StripeMobileAdapter implements StripeAdapter {
  async initialize() {
    if (!StripeReactNative) {
      throw new Error('Stripe React Native not available');
    }
    
    const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      throw new Error('Stripe publishable key not found');
    }

    await StripeReactNative.initStripe({
      publishableKey,
      merchantIdentifier: 'merchant.klipz.app',
    });
  }

  async createPaymentMethod(params: any) {
    await this.initialize();
    return await StripeReactNative.createPaymentMethod(params);
  }

  async confirmPayment(clientSecret: string, params?: any) {
    await this.initialize();
    return await StripeReactNative.confirmPayment(clientSecret, params);
  }

  async initializePaymentSheet(params: any) {
    await this.initialize();
    return await StripeReactNative.initPaymentSheet(params);
  }

  async presentPaymentSheet() {
    return await StripeReactNative.presentPaymentSheet();
  }
}

// Export the appropriate adapter based on platform
export const stripeAdapter: StripeAdapter = Platform.OS === 'web' 
  ? new StripeWebAdapter() 
  : new StripeMobileAdapter();

// Export types for use in components
export type { StripeAdapter };
export { StripeWebAdapter, StripeMobileAdapter };