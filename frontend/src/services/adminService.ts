import { supabase } from '../config/supabase';
import { Declaration } from './viewsDeclarationService';

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
      console.log('🔵 AdminService - Début récupération déclarations');
      
      // Récupérer TOUTES les déclarations avec les infos utilisateur
      const { data: declarations, error } = await supabase
        .from('declarations')
        .select(`
          *,
          users:clipper_id(email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('🔵 AdminService - Déclarations récupérées:', declarations?.length);

      // Grouper par clipper
      const groupedByClipper = new Map<string, CampaignGroup>();

      declarations?.forEach((declaration) => {
        const clipperId = declaration.clipper_id;
        const clipperEmail = declaration.users?.email || clipperId;

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
        group.clips.push(declaration);
        group.totalViews += declaration.declared_views || 0;
        group.totalEarnings += declaration.earnings || 0;

        if (declaration.status === 'pending') {
          group.pendingClips++;
        } else if (declaration.status === 'paid' || declaration.status === 'approved') {
          group.paidClips++;
        }
      });

      const result = Array.from(groupedByClipper.values());
      console.log('🔵 AdminService - Groupes créés:', result.length);
      
      return result;
    } catch (error) {
      console.error('Error fetching grouped declarations:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques globales pour l'admin
   */
  async getAdminStats(): Promise<AdminStats> {
    try {
      console.log('🔵 AdminService - Début calcul statistiques');
      
      // Statistiques des déclarations
      const { count: totalDeclarations } = await supabase
        .from('declarations')
        .select('*', { count: 'exact', head: true });

      const { count: totalPending } = await supabase
        .from('declarations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'approved']);

      const { count: totalPaid } = await supabase
        .from('declarations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'paid');

      // Calculer les gains totaux
      const { data: earningsData } = await supabase
        .from('declarations')
        .select('earnings');

      const totalEarnings = earningsData?.reduce((sum, item) => sum + (item.earnings || 0), 0) || 0;

      // Statistiques des utilisateurs
      const { count: totalClippers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'clipper');

      const { count: totalCampaigns } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true });

      const stats = {
        totalDeclarations: totalDeclarations || 0,
        totalPending: totalPending || 0,
        totalPaid: totalPaid || 0,
        totalEarnings,
        totalClippers: totalClippers || 0,
        totalCampaigns: totalCampaigns || 0,
      };

      console.log('🔵 AdminService - Statistiques calculées:', stats);
      
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

      // Récupérer la déclaration
      const { data: declaration, error } = await supabase
        .from('declarations')
        .select('*')
        .eq('id', declarationId)
        .single();

      if (error || !declaration) throw error || new Error('Déclaration introuvable');

      const { declared_views, paid_views = 0, earnings = 0, clipper_id } = declaration;
      let status = 'approved';
      let newPaidViews = paid_views;
      let newEarnings = earnings;
      let montant = 0;

      if (declared_views >= 10000 && declared_views > paid_views) {
        const newVues = declared_views - paid_views;
        montant = newVues * CPM;
        newPaidViews = declared_views;
        newEarnings = earnings + montant;
        status = 'paid';
      }

      // Mettre à jour la déclaration
      await supabase
        .from('declarations')
        .update({
          status,
          paid_views: newPaidViews,
          earnings: newEarnings,
        })
        .eq('id', declarationId);

      // Créditer le solde du clippeur si paiement
      if (status === 'paid' && montant > 0) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('balance')
          .eq('id', clipper_id)
          .single();

        if (userError || !user) throw userError || new Error('Utilisateur introuvable');

        const newBalance = Number(user.balance || 0) + montant;
        await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('id', clipper_id);
      }
    } catch (error) {
      console.error('Error validating declaration:', error);
      throw error;
    }
  }

  // Approuver une déclaration
  async approveDeclaration(declarationId: string): Promise<void> {
    const { error } = await supabase
      .from('declarations')
      .update({ 
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', declarationId);

    if (error) {
      console.error('❌ Error approbation déclaration:', error);
      throw error;
    }
    console.log('✅ Déclaration approuvée:', declarationId);
  }

  // Rejeter une déclaration
  async rejectDeclaration(declarationId: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('declarations')
      .update({ 
        status: 'rejected',
        rejection_reason: reason,
        rejected_at: new Date().toISOString()
      })
      .eq('id', declarationId);

    if (error) {
      console.error('❌ Error rejet déclaration:', error);
      throw error;
    }
    console.log('❌ Déclaration rejetée:', declarationId);
  }

  // Payer une déclaration approuvée
  async payDeclaration(declarationId: string): Promise<void> {
    const { error } = await supabase
      .from('declarations')
      .update({ 
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', declarationId);

    if (error) {
      console.error('❌ Error paiement déclaration:', error);
      throw error;
    }
    console.log('💰 Déclaration payée:', declarationId);
  }
}

export const adminService = new AdminService(); 