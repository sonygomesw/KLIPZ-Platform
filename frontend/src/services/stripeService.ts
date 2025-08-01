import { supabase } from '../config/supabase';
import { Linking, Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

// Limites Stripe (en centimes)
const STRIPE_LIMITS = {
  MIN_AMOUNT: 100, // 1 EUR minimum
  MAX_AMOUNT: 99999999, // 999,999.99 EUR maximum (limite Stripe)
  RECOMMENDED_MAX: 1000000, // 10,000 EUR recommandé
};

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
  // Valider le montant avant création de session
  static validateAmount(amount: number): { isValid: boolean; error?: string } {
    const amountInCents = Math.round(amount * 100);
    
    if (amountInCents < STRIPE_LIMITS.MIN_AMOUNT) {
      return { 
        isValid: false, 
        error: `Le montant minimum est ${STRIPE_LIMITS.MIN_AMOUNT / 100} EUR` 
      };
    }
    
    if (amountInCents > STRIPE_LIMITS.MAX_AMOUNT) {
      return { 
        isValid: false, 
        error: `Le montant maximum est ${STRIPE_LIMITS.MAX_AMOUNT / 100} EUR` 
      };
    }
    
    if (amountInCents > STRIPE_LIMITS.RECOMMENDED_MAX) {
      return { 
        isValid: true, 
        error: `Attention : Montant élevé (${amount} EUR). Contactez le support pour des montants > 10,000 EUR.` 
      };
    }
    
    return { isValid: true };
  }

  // Créer une session de checkout pour recharger le wallet
  static async createCheckoutSession(amount: number, streamerId: string): Promise<CheckoutSessionResponse> {
    try {
      console.log('🔍 createCheckoutSession - Début, amount:', amount, 'streamerId:', streamerId);
      
      // Valider le montant
      const validation = this.validateAmount(amount);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      
      if (validation.error) {
        console.warn('⚠️ Avertissement:', validation.error);
      }
      
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
      console.log('💰 Déclenchement paiement Stripe Connect:', { clipperId, amount, submissionId });
      
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
          source: 'tiktok_metrics' // Indiquer que c'est basé sur les vraies métriques
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error payout clipper');
      }

      const data = await response.json();
      console.log('✅ Paiement Stripe Connect réussi:', data);
      return data;
    } catch (error) {
      console.error('❌ Error payout clipper:', error);
      throw error;
    }
  }

  // Payer automatiquement basé sur les métriques TikTok
  static async autoPayoutBasedOnViews(submissionId: string, clipperId: string, views: number, cpmRate: number, requiredViews: number): Promise<{
    success: boolean;
    paymentTriggered: boolean;
    amount?: number;
    error?: string;
  }> {
    try {
      console.log('🔍 Vérification paiement automatique:', {
        submissionId,
        views,
        requiredViews,
        cpmRate
      });

      // Vérifier si le seuil de vues est atteint
      if (views < requiredViews) {
        console.log('⏳ Seuil de vues non atteint:', `${views}/${requiredViews}`);
        return {
          success: true,
          paymentTriggered: false
        };
      }

      // Calculer le montant à payer
      const amount = (views / 1000) * cpmRate;
      
      if (amount < 1) {
        console.log('⚠️ Montant trop faible pour paiement:', amount);
        return {
          success: true,
          paymentTriggered: false
        };
      }

      console.log('💰 Déclenchement paiement automatique:', {
        views,
        cpmRate,
        amount: amount.toFixed(2)
      });

      // Déclencher le paiement via Stripe Connect
      const payout = await this.payoutClipper(clipperId, amount, submissionId);

      return {
        success: true,
        paymentTriggered: true,
        amount: payout.amount
      };

    } catch (error) {
      console.error('❌ Error paiement automatique:', error);
      return {
        success: false,
        paymentTriggered: false,
        error: error.message
      };
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