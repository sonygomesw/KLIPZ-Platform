import { supabase } from '../config/supabase';

export interface EarningsData {
  totalEarnings: number;
  thisMonth: number;
  pendingPayments: number;
  completedClips: number;
  averagePerClip: number;
  clipsThisWeek: number;
}

export interface PaymentHistory {
  id: string;
  streamer: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'rejected';
  campaignTitle: string;
}

export interface MonthlyEarnings {
  month: string;
  amount: number;
}

class EarningsService {
  async getClipperEarnings(clipperId: string): Promise<EarningsData> {
    try {
      console.log('🔵 getClipperEarnings - Récupération des gains pour clipper:', clipperId);
      
      // Récupérer toutes les soumissions du clipper (sans jointures complexes)
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('clipper_id', clipperId);

      if (error) {
        console.error('Error lors de la récupération des soumissions:', error);
        throw error;
      }

      if (error) {
        console.error('❌ Error lors de la récupération des soumissions:', error);
        throw error;
      }

      console.log('🔵 getClipperEarnings - Soumissions trouvées:', submissions?.length || 0);

      if (!submissions || submissions.length === 0) {
        console.log('🔵 getClipperEarnings - Aucune soumission trouvée, retour des valeurs par défaut');
        return {
          totalEarnings: 0,
          thisMonth: 0,
          pendingPayments: 0,
          completedClips: 0,
          averagePerClip: 0,
          clipsThisWeek: 0,
        };
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      let totalEarnings = 0;
      let thisMonth = 0;
      let pendingPayments = 0;
      let completedClips = 0;
      let clipsThisWeek = 0;

      submissions.forEach(submission => {
        const submissionDate = new Date(submission.created_at);
        
        // Utiliser les gains stockés directement (plus simple et plus rapide)
        const earnings = submission.earnings || 0;
        
        console.log('🔵 Soumission:', {
          id: submission.id,
          status: submission.status,
          views: submission.views_count,
          earnings: earnings,
          date: submissionDate
        });
        
        // Total des gains approuvés et payés
        if (submission.status === 'approved' || submission.status === 'paid') {
          totalEarnings += earnings;
        }

        // Gains de ce mois
        if (submissionDate >= startOfMonth && (submission.status === 'approved' || submission.status === 'paid')) {
          thisMonth += earnings;
        }

        // Paiements en attente
        if (submission.status === 'approved') {
          pendingPayments += earnings;
        }

        // Clips terminés (approuvés ou payés)
        if (submission.status === 'approved' || submission.status === 'paid') {
          completedClips++;
        }

        // Clips de cette semaine
        if (submissionDate >= startOfWeek) {
          clipsThisWeek++;
        }
      });

      const averagePerClip = completedClips > 0 ? totalEarnings / completedClips : 0;

      const result = {
        totalEarnings,
        thisMonth,
        pendingPayments,
        completedClips,
        averagePerClip,
        clipsThisWeek,
      };

      console.log('🔵 getClipperEarnings - Résultats calculés:', result);
      return result;
    } catch (error) {
      console.error('Error dans getClipperEarnings:', error);
      throw error;
    }
  }

  async getPaymentHistory(clipperId: string): Promise<PaymentHistory[]> {
    try {
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('id, earnings, status, created_at, campaign_id')
        .eq('clipper_id', clipperId)
        .in('status', ['approved', 'paid', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error lors de la récupération de l\'historique:', error);
        throw error;
      }

      if (!submissions) return [];

      return submissions.map(submission => {
        return {
          id: submission.id,
          streamer: 'Streamer', // Simplifié pour l'instant
          amount: submission.earnings || 0,
          date: new Date(submission.created_at).toISOString().split('T')[0],
          status: submission.status as 'paid' | 'pending' | 'rejected',
          campaignTitle: 'Campagne', // Simplifié pour l'instant
        };
      });
    } catch (error) {
      console.error('Error dans getPaymentHistory:', error);
      throw error;
    }
  }

  async getMonthlyEarnings(clipperId: string, months: number = 6): Promise<MonthlyEarnings[]> {
    try {
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('earnings, created_at, status')
        .eq('clipper_id', clipperId)
        .in('status', ['approved', 'paid'])
        .gte('created_at', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('Error lors de la récupération des gains mensuels:', error);
        throw error;
      }

      if (!submissions) return [];

      // Grouper par mois
      const monthlyData: { [key: string]: number } = {};
      
      submissions.forEach(submission => {
        const date = new Date(submission.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = 0;
        }
        monthlyData[monthKey] += submission.earnings || 0;
      });

      // Convertir en tableau et trier
      return Object.entries(monthlyData)
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
      console.error('Error dans getMonthlyEarnings:', error);
      throw error;
    }
  }
}

export default new EarningsService(); 