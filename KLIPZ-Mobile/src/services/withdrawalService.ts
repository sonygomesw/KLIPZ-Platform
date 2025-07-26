import { supabase } from '../config/supabase';
import { stripeConnectService } from './stripeConnectService';

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  method?: string;
  created_at: string;
  processed_at?: string;
}

class WithdrawalService {
  /**
   * Request a withdrawal for a clipper
   * This will check if they have a Stripe Connect account and initiate onboarding if needed
   */
  async requestWithdrawal(userId: string, amount: number): Promise<Withdrawal> {
    try {
      // Check if user has a Stripe Connect account
      const hasAccount = await stripeConnectService.checkOnboardingStatus(userId);
      
      if (!hasAccount) {
        // Start Stripe Connect onboarding
        await stripeConnectService.startOnboarding(userId);
        throw new Error('Onboarding Stripe Connect requis');
      }

      // Check if user has sufficient balance
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      
      if (!user.balance || user.balance < amount) {
        throw new Error(`Solde insuffisant. Votre solde actuel est de €${user.balance?.toFixed(2) || '0.00'}, vous demandez €${amount.toFixed(2)}`);
      }

      // Create withdrawal request
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: userId,
          amount,
          status: 'pending',
          method: 'stripe_connect'
        })
        .select()
        .single();

      if (withdrawalError) throw withdrawalError;

      // Deduct amount from user balance
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: user.balance - amount })
        .eq('id', userId);

      if (balanceError) throw balanceError;

      return withdrawal;
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      throw error;
    }
  }

  /**
   * Process a withdrawal (admin function)
   * This will trigger the actual payout via Stripe Connect
   */
  async processWithdrawal(withdrawalId: string): Promise<void> {
    try {
      const response = await stripeConnectService.triggerPayout(withdrawalId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to process payout');
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      throw error;
    }
  }

  /**
   * Get all withdrawals for a specific user
   */
  async getWithdrawalsForUser(userId: string): Promise<Withdrawal[]> {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user withdrawals:', error);
      throw error;
    }
  }

  /**
   * Get all pending withdrawals (admin function)
   */
  async getPendingWithdrawals(): Promise<Withdrawal[]> {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          users:user_id(email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending withdrawals:', error);
      throw error;
    }
  }

  /**
   * Get withdrawal statistics for a user
   */
  async getWithdrawalStats(userId: string): Promise<{
    totalRequested: number;
    totalCompleted: number;
    totalPending: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('amount, status')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        totalRequested: 0,
        totalCompleted: 0,
        totalPending: 0
      };

      data?.forEach(withdrawal => {
        stats.totalRequested += withdrawal.amount;
        if (withdrawal.status === 'completed') {
          stats.totalCompleted += withdrawal.amount;
        } else if (withdrawal.status === 'pending') {
          stats.totalPending += withdrawal.amount;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching withdrawal stats:', error);
      throw error;
    }
  }
}

export const withdrawalService = new WithdrawalService(); 