import { supabase } from '../config/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

export interface StripeConnectResponse {
  success: boolean;
  accountId?: string;
  url?: string;
  transferId?: string;
  message?: string;
  error?: string;
}

class StripeConnectService {
  /**
   * Create a Stripe Connect Express account for a user
   */
  async createStripeAccount(userId: string): Promise<StripeConnectResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-create-account', {
        body: { userId }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating Stripe account:', error);
      throw error;
    }
  }

  /**
   * Generate an onboarding link for a user's Stripe Connect account
   */
  async createOnboardingLink(userId: string): Promise<StripeConnectResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-onboarding-link', {
        body: { userId }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating onboarding link:', error);
      throw error;
    }
  }

  /**
   * Start the Stripe Connect onboarding process
   * This will create an account if needed and open the onboarding flow
   */
  async startOnboarding(userId: string): Promise<void> {
    try {
      // First, try to create a Stripe account if the user doesn't have one
      let accountResponse: StripeConnectResponse;
      try {
        accountResponse = await this.createStripeAccount(userId);
      } catch (error) {
        // If account already exists, that's fine
        console.log('Account might already exist, continuing with onboarding...');
      }

      // Generate onboarding link
      const linkResponse = await this.createOnboardingLink(userId);
      
      if (!linkResponse.success || !linkResponse.url) {
        throw new Error('Failed to create onboarding link');
      }

      // Open the onboarding URL in the browser
      const result = await WebBrowser.openBrowserAsync(linkResponse.url);
      
      if (result.type === 'cancel') {
        throw new Error('Onboarding was cancelled');
      }

    } catch (error) {
      console.error('Error starting onboarding:', error);
      throw error;
    }
  }

  /**
   * Trigger a payout to a user's Stripe Connect account
   */
  async triggerPayout(withdrawalId: string): Promise<StripeConnectResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('stripe-payout', {
        body: { withdrawalId }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error triggering payout:', error);
      throw error;
    }
  }

  /**
   * Check if a user has completed Stripe Connect onboarding
   */
  async checkOnboardingStatus(userId: string): Promise<boolean> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('stripe_account_id')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return !!user.stripe_account_id;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }
}

export const stripeConnectService = new StripeConnectService(); 