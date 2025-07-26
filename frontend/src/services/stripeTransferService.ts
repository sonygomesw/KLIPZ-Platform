import { supabase } from '../config/supabase';

export interface StripeTransfer {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  arrival_date?: number;
  destination?: string;
  description?: string;
}

class StripeTransferService {
  /**
   * Vérifier les transferts Stripe pour un utilisateur
   */
  async checkUserTransfers(userId: string): Promise<StripeTransfer[]> {
    try {
      // Appeler l'Edge Function pour récupérer les transferts Stripe
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/stripe-get-transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error lors de la récupération des transferts');
      }

      const data = await response.json();
      return data.transfers || [];
    } catch (error) {
      console.error('Error lors de la vérification des transferts Stripe:', error);
      throw error;
    }
  }

  /**
   * Vérifier le statut d'un transfert spécifique
   */
  async checkTransferStatus(transferId: string): Promise<StripeTransfer | null> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/stripe-get-transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ transferId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error lors de la vérification du transfert');
      }

      const data = await response.json();
      return data.transfer;
    } catch (error) {
      console.error('Error lors de la vérification du statut du transfert:', error);
      throw error;
    }
  }

  /**
   * Vérifier les transferts récents (derniers 30 jours)
   */
  async getRecentTransfers(userId: string, days: number = 30): Promise<StripeTransfer[]> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/stripe-get-recent-transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ userId, days }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error lors de la récupération des transferts récents');
      }

      const data = await response.json();
      return data.transfers || [];
    } catch (error) {
      console.error('Error lors de la récupération des transferts récents:', error);
      throw error;
    }
  }

  /**
   * Formater le montant pour l'affichage
   */
  formatAmount(amount: number, currency: string = 'eur'): string {
    const formattedAmount = (amount / 100).toFixed(2);
    return `${formattedAmount} ${currency.toUpperCase()}`;
  }

  /**
   * Formater la date pour l'affichage
   */
  formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Obtenir le statut en français
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'paid':
        return 'Payé';
      case 'pending':
        return 'Pending';
      case 'in_transit':
        return 'En transit';
      case 'canceled':
        return 'Annulé';
      case 'failed':
        return 'Échoué';
      default:
        return status;
    }
  }

  /**
   * Obtenir la couleur du statut
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'paid':
        return '#4CAF50'; // Vert
      case 'pending':
        return '#FF9800'; // Orange
      case 'in_transit':
        return '#2196F3'; // Bleu
      case 'canceled':
        return '#F44336'; // Rouge
      case 'failed':
        return '#F44336'; // Rouge
      default:
        return '#9E9E9E'; // Gris
    }
  }
}

export const stripeTransferService = new StripeTransferService(); 