import { supabase } from '../config/supabase';
import { Linking, Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

export interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
}

export interface ConnectLinkResponse {
  url: string;
  accountId: string;
}

export interface PayoutResponse {
  success: boolean;
  transferId: string;
  amount: number;
  newBalance: number;
}

export class StripeService {
  // Créer une session de checkout pour recharger le wallet
  static async createCheckoutSession(amount: number, streamerId: string): Promise<CheckoutSessionResponse> {
    try {
      console.log('🔍 createCheckoutSession - Début, amount:', amount, 'streamerId:', streamerId);
      console.log('🔍 createCheckoutSession - URL:', `${SUPABASE_URL}/functions/v1/create-checkout-session`);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          streamerId,
        }),
      });

      console.log('🔍 createCheckoutSession - Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🔍 createCheckoutSession - Erreur:', errorData);
        throw new Error(errorData.error || 'Error création session checkout');
      }

      const data = await response.json();
      console.log('🔍 createCheckoutSession - Données reçues:', data);
      return data;
    } catch (error) {
      console.error('Error création session checkout:', error);
      throw error;
    }
  }

  // Ouvrir la page de paiement Stripe
  static async openCheckout(amount: number, streamerId: string): Promise<void> {
    try {
      console.log('🔍 openCheckout - Début, amount:', amount, 'streamerId:', streamerId);
      const { url } = await this.createCheckoutSession(amount, streamerId);
      console.log('🔍 openCheckout - URL reçue:', url);
      
      if (url) {
        if (Platform.OS === 'web') {
          console.log('🔍 openCheckout - Ouverture sur web avec window.open');
          const newWindow = window.open(url, '_blank');
          if (newWindow) {
            console.log('🔍 openCheckout - Nouvelle fenêtre ouverte avec succès');
          } else {
            console.error('🔍 openCheckout - Échec de l\'ouverture de la fenêtre (probablement bloquée par le navigateur)');
            // Fallback: redirection directe
            window.location.href = url;
          }
        } else {
          console.log('🔍 openCheckout - Ouverture sur mobile avec Linking');
          await Linking.openURL(url);
        }
      } else {
        throw new Error('URL de checkout non reçue');
      }
    } catch (error) {
      console.error('Error ouverture checkout:', error);
      throw error;
    }
  }

  // Créer un lien de connexion Stripe Connect pour les clippers
  static async createConnectLink(userId: string, email?: string): Promise<ConnectLinkResponse> {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-connect-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error création lien connect');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error création lien connect:', error);
      throw error;
    }
  }

  // Ouvrir la page de connexion Stripe Connect
  static async openConnectOnboarding(userId: string, email?: string): Promise<void> {
    try {
      const { url } = await this.createConnectLink(userId, email);
      
      if (url) {
        if (Platform.OS === 'web') {
          window.open(url, '_blank');
        } else {
          await Linking.openURL(url);
        }
      } else {
        throw new Error('URL de connexion non reçue');
      }
    } catch (error) {
      console.error('Error ouverture connexion connect:', error);
      throw error;
    }
  }

  // Payer un clipper via Stripe Connect
  static async payoutClipper(clipperId: string, amount: number, submissionId?: string): Promise<PayoutResponse> {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/payout-clipper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          clipperId,
          amount,
          submissionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error payout clipper');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error payout clipper:', error);
      throw error;
    }
  }

  // Récupérer le solde du wallet d'un utilisateur
  static async getWalletBalance(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Wallet n'existe pas, le créer avec un solde de 0
          const { data: newWallet, error: createError } = await supabase
            .from('wallets')
            .insert({ user_id: userId, balance: 0 })
            .select('balance')
            .single();

          if (createError) {
            throw createError;
          }

          return newWallet.balance;
        }
        throw error;
      }

      return data.balance;
    } catch (error) {
      console.error('Error récupération solde:', error);
      throw error;
    }
  }

  // Vérifier si un utilisateur est connecté à Stripe Connect
  static async isConnectedToStripe(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('stripe_account_id')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      return !!data.stripe_account_id;
    } catch (error) {
      console.error('Error vérification connexion Stripe:', error);
      return false;
    }
  }
} 