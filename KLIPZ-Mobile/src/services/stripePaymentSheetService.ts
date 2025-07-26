// import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { supabase } from '../config/supabase';

export class StripePaymentSheetService {
  private static publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

  static async initializePaymentSheet(amount: number, userId: string) {
    try {
      // 1. Créer le Payment Intent via notre Edge Function
      const { data: paymentIntentData, error: paymentIntentError } = await supabase.functions.invoke('create-payment-intent', {
        body: { amount, userId }
      });

      if (paymentIntentError) {
        console.error('Error création Payment Intent:', paymentIntentError);
        throw new Error('Impossible de créer le paiement');
      }

      const { clientSecret } = paymentIntentData;

      // 2. Initialiser le Payment Sheet (disabled for web)
      console.log('Payment sheet initialization disabled for web compatibility');

      return true;
    } catch (error) {
      console.error('Error initialisation Payment Sheet:', error);
      throw error;
    }
  }

  static async presentPaymentSheet() {
    // Disabled for web compatibility
    console.log('Payment sheet presentation disabled for web compatibility');
    return true;
  }

  static async processWalletRecharge(amount: number, userId: string) {
    try {
      // 1. Initialiser le Payment Sheet
      await this.initializePaymentSheet(amount, userId);

      // 2. Présenter le Payment Sheet
      await this.presentPaymentSheet();

      // 3. Le webhook Stripe s'occupera de mettre à jour le wallet
      return true;
    } catch (error) {
      console.error('Error processus recharge wallet:', error);
      throw error;
    }
  }
} 