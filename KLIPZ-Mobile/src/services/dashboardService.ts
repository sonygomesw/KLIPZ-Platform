import { supabase } from '../config/supabase';

export interface DashboardStats {
  totalEarnings: number;
  totalViews: number;
  activeCampaigns: number;
  pendingSubmissions: number;
}

export interface StreamerStats extends DashboardStats {
  totalSpent: number;
  totalCampaigns: number;
  approvedSubmissions: number;
}

export interface ClipperStats extends DashboardStats {
  completedSubmissions: number;
  averageEarnings: number;
}

class DashboardService {
  // Récupérer les stats du streamer
  async getStreamerStats(userId: string): Promise<StreamerStats> {
    try {
      // 1. Récupérer les infos du profil utilisateur
      const { data: userProfile } = await supabase
        .from('users')
        .select('twitch_followers, balance')
        .eq('id', userId)
        .single();

      // 2. Récupérer les campagnes du streamer
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, status, budget, total_spent, total_views')
        .eq('streamer_id', userId);

      // 3. Récupérer les soumissions pour les campagnes du streamer
      const campaignIds = campaigns?.map(c => c.id) || [];
      const { data: submissions } = campaignIds.length > 0 
        ? await supabase
            .from('submissions')
            .select('status, views, earnings')
            .in('campaign_id', campaignIds)
        : { data: [] };

      // 4. Calculer les stats
      const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
      const totalSpent = campaigns?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0;
      const totalViews = campaigns?.reduce((sum, c) => sum + (c.total_views || 0), 0) || 0;
      const pendingSubmissions = submissions?.filter(s => s.status === 'pending').length || 0;
      const approvedSubmissions = submissions?.filter(s => s.status === 'approved').length || 0;

      return {
        totalEarnings: totalSpent, // Pour un streamer, c'est ce qu'il a dépensé
        totalViews: totalViews,
        activeCampaigns: activeCampaigns,
        pendingSubmissions: pendingSubmissions,
        totalSpent: totalSpent,
        totalCampaigns: campaigns?.length || 0,
        approvedSubmissions: approvedSubmissions,
      };
    } catch (error) {
      console.error('❌ Error récupération stats streamer:', error);
      throw error;
    }
  }

  // Récupérer les stats du clipper
  async getClipperStats(userId: string): Promise<ClipperStats> {
    try {
      // 1. Récupérer les soumissions du clipper
      const { data: submissions } = await supabase
        .from('submissions')
        .select('status, views, earnings')
        .eq('clipper_id', userId);

      // 2. Récupérer les campagnes actives disponibles
      const { data: activeCampaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('status', 'active');

      // 3. Calculer les stats
      const totalEarnings = submissions?.reduce((sum, s) => sum + (s.earnings || 0), 0) || 0;
      const totalViews = submissions?.reduce((sum, s) => sum + (s.views || 0), 0) || 0;
      const pendingSubmissions = submissions?.filter(s => s.status === 'pending').length || 0;
      const completedSubmissions = submissions?.filter(s => s.status === 'approved').length || 0;
      const averageEarnings = completedSubmissions > 0 ? totalEarnings / completedSubmissions : 0;

      return {
        totalEarnings: totalEarnings,
        totalViews: totalViews,
        activeCampaigns: activeCampaigns?.length || 0,
        pendingSubmissions: pendingSubmissions,
        completedSubmissions: completedSubmissions,
        averageEarnings: averageEarnings,
      };
    } catch (error) {
      console.error('❌ Error récupération stats clipper:', error);
      throw error;
    }
  }

  // Récupérer les campagnes récentes du streamer
  async getStreamerRecentCampaigns(userId: string, limit: number = 5) {
    try {
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select(`
          id,
          title,
          status,
          total_views,
          total_spent,
          created_at
        `)
        .eq('streamer_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      return campaigns || [];
    } catch (error) {
      console.error('❌ Error récupération campagnes récentes:', error);
      throw error;
    }
  }

  // Récupérer les soumissions récentes du clipper
  async getClipperRecentSubmissions(userId: string, limit: number = 5) {
    try {
      const { data: submissions } = await supabase
        .from('submissions')
        .select(`
          id,
          status,
          views,
          earnings,
          submitted_at,
          campaigns (
            title
          )
        `)
        .eq('clipper_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(limit);

      return submissions || [];
    } catch (error) {
      console.error('❌ Error récupération soumissions récentes:', error);
      throw error;
    }
  }
}

export default new DashboardService(); 