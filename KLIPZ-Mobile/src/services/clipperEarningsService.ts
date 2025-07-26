import { supabase } from '../config/supabase';
import { Declaration } from './viewsDeclarationService';

export interface ClipperCampaignGroup {
  campaignId?: string;
  campaignName?: string;
  clips: Declaration[];
  totalViews: number;
  totalEarnings: number;
  pendingClips: number;
  paidClips: number;
  rejectedClips: number;
}

export interface ClipperEarningsData {
  totalEarnings: number;
  thisMonth: number;
  pendingPayments: number;
  completedClips: number;
  averagePerClip: number;
  clipsThisWeek: number;
  campaignGroups: ClipperCampaignGroup[];
}

class ClipperEarningsService {
  /**
   * Récupérer les gains groupés par campagne pour un clipper
   */
  async getClipperEarningsGrouped(clipperId: string): Promise<ClipperEarningsData> {
    try {
      console.log('🔄 ClipperEarningsService - Début getClipperEarningsGrouped pour clipperId:', clipperId);
      
      // Récupérer toutes les déclarations du clipper
      console.log('📡 ClipperEarningsService - Requête Supabase en cours...');
      const { data: declarations, error } = await supabase
        .from('declarations')
        .select('*')
        .eq('clipper_id', clipperId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ ClipperEarningsService - Error Supabase:', error);
        throw error;
      }

      console.log('✅ ClipperEarningsService - Déclarations reçues:', declarations?.length || 0);

      // Grouper par campagne (pour l'instant, on groupe par date de création)
      console.log('📊 ClipperEarningsService - Groupement des déclarations...');
      const campaignGroups = this.groupDeclarationsByCampaign(declarations || []);
      console.log('✅ ClipperEarningsService - Groupes créés:', campaignGroups.length);

      // Calculer les statistiques globales
      const totalEarnings = declarations?.reduce((sum, d) => sum + (d.earnings || 0), 0) || 0;
      const completedClips = declarations?.filter(d => d.status === 'paid').length || 0;
      const pendingPayments = declarations?.filter(d => d.status === 'pending' || d.status === 'approved').length || 0;
      const averagePerClip = completedClips > 0 ? totalEarnings / completedClips : 0;

      // Calculer les gains du mois en cours
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const thisMonthEarnings = declarations?.filter(d => {
        const date = new Date(d.created_at);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      }).reduce((sum, d) => sum + (d.earnings || 0), 0) || 0;

      // Calculer les clips de cette semaine
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const clipsThisWeek = declarations?.filter(d => new Date(d.created_at) >= oneWeekAgo).length || 0;

      const result = {
        totalEarnings,
        thisMonth: thisMonthEarnings,
        pendingPayments,
        completedClips,
        averagePerClip,
        clipsThisWeek,
        campaignGroups,
      };

      console.log('✅ ClipperEarningsService - Résultat final:', result);
      return result;
    } catch (error) {
      console.error('❌ ClipperEarningsService - Error dans getClipperEarningsGrouped:', error);
      throw error;
    }
  }

  /**
   * Grouper les déclarations par campagne
   * Pour l'instant, on groupe par mois de création
   */
  private groupDeclarationsByCampaign(declarations: Declaration[]): ClipperCampaignGroup[] {
    const groups = new Map<string, ClipperCampaignGroup>();

    declarations.forEach((declaration) => {
      // Créer une clé unique pour chaque déclaration si pas de campagne
      const date = new Date(declaration.created_at);
      const campaignKey = declaration.campaign_id || `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      const campaignName = declaration.campaign_id 
        ? `Campaign ${declaration.campaign_id}`
        : `Declaration ${date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`;

      if (!groups.has(campaignKey)) {
        groups.set(campaignKey, {
          campaignId: campaignKey,
          campaignName,
          clips: [],
          totalViews: 0,
          totalEarnings: 0,
          pendingClips: 0,
          paidClips: 0,
          rejectedClips: 0,
        });
      }

      const group = groups.get(campaignKey)!;
      group.clips.push(declaration);
      group.totalViews += declaration.declared_views || 0;
      group.totalEarnings += declaration.earnings || 0;

      if (declaration.status === 'pending' || declaration.status === 'approved') {
        group.pendingClips++;
      } else if (declaration.status === 'paid') {
        group.paidClips++;
      } else if (declaration.status === 'rejected') {
        group.rejectedClips++;
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      // Trier par date de création (plus récent en premier)
      const aDate = new Date(a.clips[0]?.created_at || 0);
      const bDate = new Date(b.clips[0]?.created_at || 0);
      return bDate.getTime() - aDate.getTime();
    });
  }

  /**
   * Récupérer l'historique des paiements
   */
  async getPaymentHistory(clipperId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('declarations')
        .select('*')
        .eq('clipper_id', clipperId)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  /**
   * Récupérer les gains mensuels pour le graphique
   */
  async getMonthlyEarnings(clipperId: string, months: number = 5): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('declarations')
        .select('earnings, created_at')
        .eq('clipper_id', clipperId)
        .eq('status', 'paid')
        .gte('created_at', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Grouper par mois
      const monthlyData = new Map<string, number>();
      const now = new Date();

      for (let i = 0; i < months; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData.set(monthKey, 0);
      }

      data?.forEach((item) => {
        const date = new Date(item.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, monthlyData.get(monthKey)! + (item.earnings || 0));
        }
      });

      return Array.from(monthlyData.entries()).map(([month, amount]) => ({
        month,
        amount,
      }));
    } catch (error) {
      console.error('Error fetching monthly earnings:', error);
      throw error;
    }
  }
}

export const clipperEarningsService = new ClipperEarningsService(); 