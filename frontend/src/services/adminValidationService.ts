import { supabase } from '../config/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

export interface PendingSubmission {
  id: string;
  tiktok_url: string;
  views: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  earnings: number;
  potential_earnings: number;
  meets_requirement: boolean;
  has_stripe_account: boolean;
  status: string;
  created_at: string;
  campaigns: {
    title: string;
    cpm_rate: number;
    required_views: number;
  };
  users: {
    username: string;
    tiktok_username?: string;
    stripe_account_id?: string;
  };
}

export interface ValidationResult {
  success: boolean;
  paymentTriggered?: boolean;
  amount?: number;
  error?: string;
}

export class AdminValidationService {

  // Récupérer toutes les soumissions en attente de validation
  static async getPendingSubmissions(adminId: string): Promise<{
    success: boolean;
    submissions?: PendingSubmission[];
    error?: string;
  }> {
    try {
      console.log('🔍 Récupération soumissions en attente...');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-validate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'get-pending-submissions',
          adminId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur récupération soumissions');
      }

      const data = await response.json();
      console.log('✅ Soumissions récupérées:', data.submissions?.length || 0);
      
      return data;
    } catch (error) {
      console.error('❌ Error récupération soumissions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Valider une soumission et déclencher le paiement
  static async validateSubmission(
    adminId: string, 
    submissionId: string, 
    approved: boolean, 
    adminNotes?: string
  ): Promise<ValidationResult> {
    try {
      console.log('🔍 Validation soumission:', { submissionId, approved, adminNotes });

      const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-validate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'validate-payment',
          adminId,
          submissionId,
          approved,
          adminNotes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur validation soumission');
      }

      const data = await response.json();
      
      if (approved && data.paymentTriggered) {
        console.log('✅ Soumission approuvée et paiement déclenché:', data.amount);
      } else if (approved) {
        console.log('✅ Soumission approuvée (paiement non déclenché)');
      } else {
        console.log('❌ Soumission rejetée');
      }
      
      return data;
    } catch (error) {
      console.error('❌ Error validation soumission:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Approuver une soumission et déclencher le paiement
  static async approveAndPay(
    adminId: string, 
    submissionId: string, 
    adminNotes?: string
  ): Promise<ValidationResult> {
    return this.validateSubmission(adminId, submissionId, true, adminNotes);
  }

  // Rejeter une soumission
  static async rejectSubmission(
    adminId: string, 
    submissionId: string, 
    reason: string
  ): Promise<ValidationResult> {
    return this.validateSubmission(adminId, submissionId, false, reason);
  }

  // Calculer les statistiques pour l'admin
  static calculateStats(submissions: PendingSubmission[]): {
    total: number;
    readyForPayment: number;
    totalPotentialEarnings: number;
    missingStripeAccounts: number;
    belowThreshold: number;
  } {
    const stats = {
      total: submissions.length,
      readyForPayment: 0,
      totalPotentialEarnings: 0,
      missingStripeAccounts: 0,
      belowThreshold: 0
    };

    submissions.forEach(sub => {
      stats.totalPotentialEarnings += sub.potential_earnings || 0;
      
      if (!sub.has_stripe_account) {
        stats.missingStripeAccounts++;
      }
      
      if (!sub.meets_requirement) {
        stats.belowThreshold++;
      }
      
      if (sub.meets_requirement && sub.has_stripe_account && sub.potential_earnings >= 1) {
        stats.readyForPayment++;
      }
    });

    return stats;
  }

  // Vérifier les droits admin de l'utilisateur
  static async checkAdminRights(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return false;
      }

      return data.role === 'admin';
    } catch (error) {
      console.error('❌ Error vérification droits admin:', error);
      return false;
    }
  }

  // Formater les montants pour l'affichage
  static formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Formater les vues pour l'affichage
  static formatViews(views: number): string {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  }

  // Obtenir le statut coloré pour l'interface
  static getStatusColor(submission: PendingSubmission): string {
    if (!submission.has_stripe_account) return '#FF6B6B'; // Rouge
    if (!submission.meets_requirement) return '#FFB800'; // Orange
    if (submission.potential_earnings < 1) return '#95A5A6'; // Gris
    return '#00C851'; // Vert
  }

  // Obtenir le message de statut pour l'interface
  static getStatusMessage(submission: PendingSubmission): string {
    if (!submission.has_stripe_account) {
      return 'Compte Stripe Connect requis';
    }
    if (!submission.meets_requirement) {
      return `${this.formatViews(submission.views)}/${this.formatViews(submission.campaigns.required_views)} vues`;
    }
    if (submission.potential_earnings < 1) {
      return 'Montant trop faible (< 1€)';
    }
    return 'Prêt pour paiement';
  }
}

export default AdminValidationService;