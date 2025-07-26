import { supabase, supabaseUtils } from '../config/supabase';
import { Campaign, Submission, CampaignFilters } from '../types';

export interface CreateCampaignData {
  title: string;
  description: string;
  imageUrl?: string;
  criteria: {
    hashtags: string[];
    style: string;
    duration: number;
    minViews: number;
  };
  budget: number;
  cpm: number;
  fanPageCpm: number | null;
}

export interface UpdateCampaignData {
  title?: string;
  description?: string;
  criteria?: {
    hashtags: string[];
    style: string;
    duration: number;
    minViews: number;
  };
  budget?: number;
  cpm?: number;
  fanPageCpm?: number | null;
  status?: 'active' | 'paused' | 'completed';
}

export interface SubmitClipData {
  campaignId: string;
  tiktokUrl: string;
}

class CampaignService {
  // Créer une nouvelle campagne (streamers seulement)
  async createCampaign(streamerId: string, data: CreateCampaignData): Promise<Campaign> {
    try {
      // Vérifier le solde du streamer
      const streamerProfile = await supabaseUtils.getUserProfile(streamerId);
      if (streamerProfile.balance < data.budget) {
        throw new Error('Solde insuffisant pour créer cette campagne');
      }

      // Créer la campagne
      const campaignData: any = {
        streamer_id: streamerId,
        title: data.title,
        description: data.description,
        image_url: data.imageUrl,
        criteria: data.criteria,
        budget_total: data.budget,
        budget_remaining: data.budget,
        cpm_rate: data.cpm,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: campaignResult, error } = await supabase
        .from('campaigns')
        .insert(campaignData)
        .select(`
          *,
          users!campaigns_streamer_id_fkey (
            email,
            twitch_profile_image,
            twitch_followers,
            twitch_display_name
          )
        `)
        .single();

      if (error) throw error;

      // Débiter le budget du streamer
      await supabaseUtils.updateUserProfile(streamerId, {
        balance: streamerProfile.balance - data.budget,
        updated_at: new Date().toISOString(),
      });

      return this.formatCampaign(campaignResult);
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  // Obtenir toutes les campagnes (avec filtres)
  async getCampaigns(filters?: CampaignFilters): Promise<Campaign[]> {
    try {
      console.log('🔵 getCampaigns - Début de la récupération');
      
      // Récupérer d'abord les campagnes
      let query = supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active');

      // Appliquer les filtres
      if (filters?.minBudget) {
        query = query.gte('budget_total', filters.minBudget);
      }
      if (filters?.maxBudget) {
        query = query.lte('budget_total', filters.maxBudget);
      }

      // Appliquer le tri
      switch (filters?.sortBy) {
          case 'popular':
          query = query.order('total_views', { ascending: false });
            break;
          case 'budget':
          query = query.order('budget_total', { ascending: false });
          break;
        case 'new':
        default:
          query = query.order('created_at', { ascending: false });
            break;
        }

      const { data: campaignsData, error } = await query;

      if (error) throw error;

      console.log('🔵 getCampaigns - Campagnes trouvées:', campaignsData.length);

      // Récupérer les données des streamers pour chaque campagne
      const campaignsWithStreamers = await Promise.all(
        campaignsData.map(async (campaign) => {
          let userData = null;
          try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-streamer-data`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({ streamerId: campaign.streamer_id }),
            });

            const result = await response.json();
            if (result.data) {
              userData = result.data;
            }
          } catch (error) {
            console.error('❌ getCampaigns - Error Edge Function pour campagne:', campaign.id, error);
          }

          return {
            ...campaign,
            users: userData
          };
        })
      );

      console.log('🔵 getCampaigns - Campagnes avec streamers:', campaignsWithStreamers.length);

      return campaignsWithStreamers.map(this.formatCampaign);
    } catch (error) {
      console.error('Error lors de la récupération des campagnes:', error);
      throw error;
    }
  }

  // Obtenir les campagnes d'un streamer
  async getStreamerCampaigns(streamerId: string): Promise<Campaign[]> {
    try {
      console.log('🔍 getStreamerCampaigns - Début de la requête pour streamerId:', streamerId);
      
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          users!campaigns_streamer_id_fkey (
            email,
            twitch_profile_image,
            twitch_followers,
            twitch_display_name
          )
        `)
        .eq('streamer_id', streamerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ getStreamerCampaigns - Error Supabase:', error);
        throw error;
      }

      console.log('🔍 getStreamerCampaigns - Données brutes reçues:', data);
      console.log('🔍 getStreamerCampaigns - Namebre de campagnes:', data?.length || 0);

      const formattedCampaigns = data.map(this.formatCampaign);
      console.log('🔍 getStreamerCampaigns - Campagnes formatées:', formattedCampaigns);

      return formattedCampaigns;
    } catch (error) {
      console.error('❌ getStreamerCampaigns - Error lors de la récupération des campagnes du streamer:', error);
      throw error;
    }
  }

  // Obtenir une campagne par ID
  async getCampaignById(campaignId: string): Promise<Campaign> {
    try {
      console.log('🔵 getCampaignById - Début de la requête pour:', campaignId);
      
      // Vérifier que campaignId est valide
      if (!campaignId || campaignId === 'undefined') {
        throw new Error('CampaignId invalide');
      }
      
      // Récupérer d'abord la campagne
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) {
        console.error('❌ getCampaignById - Error campagne:', campaignError);
        throw campaignError;
      }

      if (!campaignData) {
        throw new Error('Campagne non trouvée');
      }

      console.log('🔵 getCampaignById - Campagne trouvée:', {
        id: campaignData.id,
        streamer_id: campaignData.streamer_id
      });

      // Récupérer ensuite les données du streamer via Edge Function
      console.log('🔵 getCampaignById - Recherche utilisateur avec ID:', campaignData.streamer_id);
      
      let userData = null;
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-streamer-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ streamerId: campaignData.streamer_id }),
        });

        const result = await response.json();
        console.log('🔵 getCampaignById - Résultat Edge Function:', result);

        if (result.data) {
          userData = result.data;
          console.log('✅ getCampaignById - Données streamer récupérées:', userData);
        } else {
          console.log('⚠️ getCampaignById - No data streamer trouvée');
        }
      } catch (error) {
        console.error('❌ getCampaignById - Error Edge Function:', error);
        // Ne pas faire échouer toute la fonction si l'Edge Function échoue
      }

      console.log('🔵 getCampaignById - Utilisateur trouvé:', userData);

      // Combiner les données
      const combinedData = {
        ...campaignData,
        users: userData
      };

      console.log('🔵 getCampaignById - Données combinées:', {
        id: combinedData.id,
        streamer_id: combinedData.streamer_id,
        users: combinedData.users,
        hasUsers: !!combinedData.users
      });

      return this.formatCampaign(combinedData);
    } catch (error) {
      console.error('❌ Error lors de la récupération de la campagne:', error);
      throw error;
    }
  }

  // Mettre à jour une campagne
  async updateCampaign(campaignId: string, updates: UpdateCampaignData): Promise<Campaign> {
    try {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', campaignId)
        .select(`
          *,
          users!campaigns_streamer_id_fkey (
            email,
            twitch_profile_image,
            twitch_followers,
            twitch_display_name
          )
        `)
        .single();

      if (error) throw error;

      return this.formatCampaign(data);
    } catch (error) {
      console.error('Error lors de la mise à jour de la campagne:', error);
      throw error;
    }
  }

  // Supprimer une campagne
  async deleteCampaign(campaignId: string): Promise<void> {
    try {
      // Vérifier qu'il n'y a pas de soumissions approuvées
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('status', 'approved');

      if (submissionsError) throw submissionsError;

      if (submissions && submissions.length > 0) {
        throw new Error('Impossible de supprimer une campagne avec des soumissions approuvées');
      }

      // Supprimer la campagne
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
    } catch (error) {
      console.error('Error lors de la suppression de la campagne:', error);
      throw error;
    }
  }

  // Soumettre un clip pour une campagne
  async submitClip(clipperId: string, data: SubmitClipData): Promise<Submission> {
    try {
      // Vérifier que la campagne existe et est active
      const campaign = await this.getCampaignById(data.campaignId);
      if (campaign.status !== 'active') {
        throw new Error('Cette campagne n\'est plus active');
      }

      // Vérifier que le clipper n'a pas déjà soumis pour cette campagne
      // TEMPORAIREMENT DÉSACTIVÉ pour permettre plusieurs soumissions
      /*
      const { data: existingSubmission, error: existingError } = await supabase
        .from('submissions')
        .select('id')
        .eq('campaign_id', data.campaignId)
        .eq('clipper_id', clipperId)
        .single();

      if (existingSubmission) {
        throw new Error('Vous avez déjà soumis un clip pour cette campagne');
      }
      */

      // Valider l'URL TikTok
      if (!this.validateTikTokUrl(data.tiktokUrl)) {
        throw new Error('URL TikTok invalide');
      }

      // Créer la soumission
      const submissionData: any = { // Changed to any as Database type is removed
        campaign_id: data.campaignId,
        clipper_id: clipperId,
        tiktok_url: data.tiktokUrl,
        status: 'pending',
        views: 0,
        earnings: 0,
        submitted_at: new Date().toISOString(),
      };

      const { data: submissionResult, error } = await supabase
        .from('submissions')
        .insert(submissionData)
        .select(`
          *,
          users!submissions_clipper_id_fkey (
            email
          )
        `)
        .single();

      if (error) throw error;

      return this.formatSubmission(submissionResult);
    } catch (error) {
      console.error('Error lors de la soumission du clip:', error);
      throw error;
    }
  }

  // Obtenir les soumissions d'un clipper
  async getClipperSubmissions(clipperId: string): Promise<Submission[]> {
    try {
      console.log('🔵 getClipperSubmissions - Début pour clipperId:', clipperId);
      
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          users!submissions_clipper_id_fkey (
            email
          )
        `)
        .eq('clipper_id', clipperId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      console.log('🔵 getClipperSubmissions - Données brutes reçues:', data?.length, 'soumissions');
      
      const formattedSubmissions = data.map(this.formatSubmission);
      
      console.log('🔵 getClipperSubmissions - Soumissions formatées:', formattedSubmissions.map(s => ({
        id: s.id,
        campaignId: s.campaignId,
        status: s.status
      })));

      return formattedSubmissions;
    } catch (error) {
      console.error('Error lors de la récupération des soumissions:', error);
      throw error;
    }
  }

  // Obtenir les soumissions d'une campagne
  async getCampaignSubmissions(campaignId: string): Promise<Submission[]> {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          users!submissions_clipper_id_fkey (
            email
          )
        `)
        .eq('campaign_id', campaignId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      return data.map(this.formatSubmission);
    } catch (error) {
      console.error('Error lors de la récupération des soumissions de la campagne:', error);
      throw error;
    }
  }

  // Approuver une soumission (streamers seulement)
  async approveSubmission(submissionId: string): Promise<Submission> {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', submissionId)
        .select(`
          *,
          users!submissions_clipper_id_fkey (
            email
          )
        `)
        .single();

      if (error) throw error;

      return this.formatSubmission(data);
    } catch (error) {
      console.error('Error lors de l\'approbation de la soumission:', error);
      throw error;
    }
  }

  // Rejeter une soumission (streamers seulement)
  async rejectSubmission(submissionId: string): Promise<Submission> {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .update({
          status: 'rejected',
        })
        .eq('id', submissionId)
        .select(`
          *,
          users!submissions_clipper_id_fkey (
            email
          )
        `)
        .single();

      if (error) throw error;

      return this.formatSubmission(data);
    } catch (error) {
      console.error('Error lors du rejet de la soumission:', error);
      throw error;
    }
  }

  // Mettre à jour les vues d'une soumission et calculer les gains
  async updateSubmissionViews(submissionId: string, views: number): Promise<Submission> {
    try {
      // Récupérer la soumission et la campagne
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .select(`
          *,
          campaigns (
            cpm_rate
          )
        `)
        .eq('id', submissionId)
        .single();

      if (submissionError) throw submissionError;

      // Calculer les gains basés sur les vues
      const earnings = (views / 1000) * submission.campaigns.cpm_rate;

      // Mettre à jour la soumission
      const { data: updatedSubmission, error } = await supabase
        .from('submissions')
        .update({
          views,
          earnings,
        })
        .eq('id', submissionId)
        .select(`
          *,
          users!submissions_clipper_id_fkey (
            email
          )
        `)
        .single();

      if (error) throw error;

      return this.formatSubmission(updatedSubmission);
    } catch (error) {
      console.error('Error lors de la mise à jour des vues:', error);
      throw error;
    }
  }

  // Formater une campagne pour l'interface
  private formatCampaign(data: any): Campaign {
    console.log('🔵 formatCampaign - Données brutes:', {
      id: data.id,
      streamer_id: data.streamer_id,
      users: data.users,
      twitch_profile_image: data.users?.twitch_profile_image,
      twitch_display_name: data.users?.twitch_display_name,
      email: data.users?.email
    });

    const formattedCampaign = {
      id: data.id,
      streamerId: data.streamer_id,
      streamerName: data.users?.twitch_display_name || data.users?.email?.split('@')[0] || 'Streamer',
      streamerAvatar: data.users?.twitch_profile_image || 'https://i.pravatar.cc/40?img=1',
      streamerFollowers: data.users?.twitch_followers || 0,
      title: data.title,
      description: data.description,
      imageUrl: data.image_url,
      criteria: data.criteria,
      budget: data.budget_total || data.budget,
      cpm: data.cpm_rate || data.cpm,
      status: data.status,
      createdAt: new Date(data.created_at),
      totalViews: data.total_views || 0,
      totalSpent: data.total_spent || 0,
    };

    console.log('🔵 formatCampaign - Campagne formatée:', {
      streamerName: formattedCampaign.streamerName,
      streamerAvatar: formattedCampaign.streamerAvatar
    });

    return formattedCampaign;
  }

  // Formater une soumission pour l'interface
  private formatSubmission(data: any): Submission {
    console.log('🔵 formatSubmission - Données brutes:', {
      id: data.id,
      campaign_id: data.campaign_id,
      clipper_id: data.clipper_id,
      status: data.status
    });
    
    const formatted = {
      id: data.id,
      campaignId: data.campaign_id,
      clipperId: data.clipper_id,
      clipperName: data.users?.email || 'Clipper',
      tiktokUrl: data.tiktok_url,
      status: data.status,
      views: data.views,
      earnings: data.earnings,
      submittedAt: new Date(data.submitted_at),
      approvedAt: data.approved_at ? new Date(data.approved_at) : undefined,
    };
    
    console.log('🔵 formatSubmission - Soumission formatée:', {
      id: formatted.id,
      campaignId: formatted.campaignId,
      status: formatted.status
    });
    
    return formatted;
  }

  // Valider l'URL TikTok
  private validateTikTokUrl(url: string): boolean {
    const tiktokUrlPattern = /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9._]+\/video\/\d+$/;
    return tiktokUrlPattern.test(url);
  }
}

export const campaignService = new CampaignService();
export default campaignService; 