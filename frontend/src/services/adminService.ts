import { createClient } from '@supabase/supabase-js';
import { Declaration } from './viewsDeclarationService';
import { ENV } from '../config/env';

// Client admin avec service_role key pour accéder à toutes les données
// Note: En frontend, on utilise l'anon key car service_role n'est pas disponible
const supabaseAdmin = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Client normal pour les autres opérations
const supabase = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY
);

export interface CampaignGroup {
  campaignId?: string;
  campaignName?: string;
  clipperId: string;
  clipperEmail: string;
  clips: Declaration[];
  totalViews: number;
  totalEarnings: number;
  pendingClips: number;
  paidClips: number;
}

export interface AdminStats {
  totalDeclarations: number;
  totalPending: number;
  totalPaid: number;
  totalEarnings: number;
  totalClippers: number;
  totalCampaigns: number;
}

class AdminService {
  /**
   * Récupérer les déclarations groupées par campagne et clipper
   */
  async getDeclarationsGroupedByCampaign(): Promise<CampaignGroup[]> {
    try {
      console.log('🔵 AdminService - Récupération directe des soumissions...');
      
      // Utiliser l'Edge Function get-submissions
      console.log('🔵 AdminService - Appel Edge Function get-submissions...');
      
      const { data, error } = await supabaseAdmin.functions.invoke('get-submissions');

      console.log('🔵 AdminService - Résultat Edge Function:', { data, error });

      if (error) {
        console.error('❌ Erreur Edge Function get-submissions:', error);
        throw error;
      }

      const submissions = data?.submissions || [];

      if (error) {
        console.error('❌ Erreur récupération soumissions:', error);
        throw error;
      }

      console.log('🔵 AdminService - Soumissions récupérées:', submissions?.length || 0);

      if (!submissions || submissions.length === 0) {
        console.log('🔵 AdminService - Aucune soumission trouvée');
        return [];
      }

      // Grouper par clipper
      const groupedByClipper = new Map<string, CampaignGroup>();

      submissions.forEach((submission) => {
        const clipperId = submission.clipper_id;
        const clipperEmail = submission.users?.email || 'Email non trouvé';

        if (!groupedByClipper.has(clipperId)) {
          groupedByClipper.set(clipperId, {
            clipperId,
            clipperEmail,
            clips: [],
            totalViews: 0,
            totalEarnings: 0,
            pendingClips: 0,
            paidClips: 0,
          });
        }

        const group = groupedByClipper.get(clipperId)!;
        
        // Convertir en format Declaration pour compatibilité
        const declaration = {
          id: submission.id,
          campaign_id: submission.campaign_id,
          clipper_id: submission.clipper_id,
          tiktok_url: submission.tiktok_url,
          status: submission.status,
          views: submission.views || 0,
          declared_views: submission.views || 0,
          earnings: submission.earnings || 0,
          submitted_at: submission.submitted_at,
          created_at: submission.created_at,
          updated_at: submission.updated_at,
          campaign_name: submission.campaigns?.title || 'Campagne'
        };
        
        group.clips.push(declaration);
        group.totalViews += submission.views || 0;
        group.totalEarnings += submission.earnings || 0;

        if (submission.status === 'pending') {
          group.pendingClips++;
        } else if (submission.status === 'paid' || submission.status === 'approved' || submission.status === 'auto_approved') {
          group.paidClips++;
        }
      });

      const result = Array.from(groupedByClipper.values());
      console.log('🔵 AdminService - Groupes créés:', result.length);
      
      return result;
    } catch (error) {
      console.error('Error fetching real data:', error);
      throw error;
    }
  }

  /**
   * Données simulées pour le développement
   */
  private getMockData(): CampaignGroup[] {
    return [
      {
        clipperId: 'test-clipper',
        clipperEmail: 'test-clipper@example.com',
        clips: [
          {
            id: '14072125-7cd5-459c-b3f1-bb7655dea6d6',
            campaign_id: 'd87c9ac2-c1d1-4a4c-ae36-67d116f2ee75',
            clipper_id: 'test-clipper',
            tiktok_url: 'https://www.tiktok.com/@user/video/7530475273502887199',
            status: 'pending',
            views: 388199,
            declared_views: 388199,
            earnings: 450,
            submitted_at: '2025-07-27T23:28:35.097372+00:00',
            created_at: '2025-07-27T23:28:35.097372+00:00',
            updated_at: '2025-07-28T00:19:55.323917+00:00',
            campaign_name: 'Clip Kai Cenat'
          },
          {
            id: '3e17e210-40de-46cc-a8d7-f3fb9e0f8651',
            campaign_id: '39e8b93a-bbea-4491-8eb2-362e23994a56',
            clipper_id: 'test-clipper',
            tiktok_url: 'https://www.tiktok.com/@footbulambostyle/video/7529622157291179286',
            status: 'pending',
            views: 0,
            declared_views: 0,
            earnings: 0,
            submitted_at: '2025-07-27T15:36:01.564+00:00',
            created_at: '2025-07-27T15:36:01.698792+00:00',
            updated_at: '2025-07-27T15:36:01.698792+00:00',
            campaign_name: 'Speed x Pogba'
          }
        ],
        totalViews: 388199,
        totalEarnings: 450,
        pendingClips: 2,
        paidClips: 0,
      }
    ];
  }

  /**
   * Récupérer les statistiques globales pour l'admin
   */
  async getAdminStats(): Promise<AdminStats> {
    try {
      console.log('🔵 AdminService - Récupération directe des stats admin...');

      // Récupérer les statistiques directement
      const [
        { count: totalDeclarations },
        { count: totalPending },
        { count: totalPaid },
        { data: earningsData },
        { count: totalClippers },
        { count: totalCampaigns }
      ] = await Promise.all([
        supabaseAdmin.from('submissions').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabaseAdmin.from('submissions').select('*', { count: 'exact', head: true }).in('status', ['paid', 'approved', 'auto_approved']),
        supabaseAdmin.from('submissions').select('earnings').in('status', ['paid', 'approved', 'auto_approved']),
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'clipper'),
        supabaseAdmin.from('campaigns').select('*', { count: 'exact', head: true })
      ]);

      const totalEarnings = earningsData?.reduce((sum, item) => sum + (item.earnings || 0), 0) || 0;

      const stats = {
        totalDeclarations: totalDeclarations || 0,
        totalPending: totalPending || 0,
        totalPaid: totalPaid || 0,
        totalEarnings,
        totalClippers: totalClippers || 0,
        totalCampaigns: totalCampaigns || 0,
      };

      console.log('🔵 AdminService - Stats calculées:', stats);
      
      return stats;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw error;
    }
  }

  /**
   * Valider une déclaration spécifique
   */
  async validateDeclaration(declarationId: string): Promise<void> {
    try {
      const CPM = 0.03; // CPM par défaut

      // Récupérer la soumission
      const { data: submission, error } = await supabaseAdmin
        .from('submissions')
        .select('*')
        .eq('id', declarationId)
        .single();

      if (error || !submission) throw error || new Error('Soumission introuvable');

      const { views, earnings = 0, clipper_id } = submission;
      let status = 'approved';
      let newPaidViews = views || 0;
      let newEarnings = earnings;
      let montant = 0;

      if (views >= 10000) {
        montant = views * CPM;
        newEarnings = montant;
        status = 'paid';
      }

      // Mettre à jour la soumission
      await supabaseAdmin
        .from('submissions')
        .update({
          status,
          earnings: newEarnings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', declarationId);

      // Créditer le solde du clippeur si paiement
      if (status === 'paid' && montant > 0) {
        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .select('balance')
          .eq('id', clipper_id)
          .single();

        if (userError || !user) throw userError || new Error('Utilisateur introuvable');

        const newBalance = Number(user.balance || 0) + montant;
        await supabaseAdmin
          .from('users')
          .update({ balance: newBalance })
          .eq('id', clipper_id);
      }
    } catch (error) {
      console.error('Error validating declaration:', error);
      throw error;
    }
  }

  // Approuver une soumission
  async approveDeclaration(declarationId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('submissions')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', declarationId);

    if (error) {
      console.error('❌ Error approbation soumission:', error);
      throw error;
    }
    console.log('✅ Soumission approuvée:', declarationId);
  }

  // Rejeter une soumission
  async rejectDeclaration(declarationId: string, reason?: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('submissions')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', declarationId);

    if (error) {
      console.error('❌ Error rejet soumission:', error);
      throw error;
    }
    console.log('❌ Soumission rejetée:', declarationId);
  }

  // Payer une soumission approuvée
  async payDeclaration(declarationId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('submissions')
      .update({ 
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', declarationId);

    if (error) {
      console.error('❌ Error paiement soumission:', error);
      throw error;
    }
    console.log('💰 Soumission payée:', declarationId);
  }
}

export const adminService = new AdminService(); 