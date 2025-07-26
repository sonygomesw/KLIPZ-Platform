import { supabase } from '../config/supabase';

export interface Declaration {
  id: string;
  clipper_id: string;
  submission_id?: string; // Lien vers la soumission
  tiktok_url: string;
  declared_views: number;
  verification_code?: string;
  status: string;
  paid_views: number;
  earnings: number;
  created_at: string;
}

class DeclarationsService {
  // Déclarer ou mettre à jour une déclaration de vues pour un TikTok
  async declareViews({
    clipperId,
    tiktokUrl,
    declaredViews,
    isFinal = false,
    verificationCode,
    cpm = 0.03,
    submissionId
  }: {
    clipperId: string;
    tiktokUrl: string;
    declaredViews: number;
    isFinal?: boolean;
    verificationCode?: string;
    cpm?: number;
    submissionId?: string;
  }): Promise<Declaration> {
    // Chercher s'il existe déjà une déclaration pour ce TikTok et ce clippeur
    const { data: existing, error: fetchError } = await supabase
      .from('declarations')
      .select('*')
      .eq('clipper_id', clipperId)
      .eq('tiktok_url', tiktokUrl)
      .single();
    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    let paidViews = 0;
    let totalEarnings = 0;
    let newViews = declaredViews;
    let status = 'pending'; // Toujours 'pending' pour nécessiter une approbation manuelle
    let id = undefined;
    if (existing) {
      paidViews = existing.paid_views || 0;
      newViews = Math.max(0, declaredViews - paidViews);
      totalEarnings = (existing.earnings || 0) + newViews * cpm;
      id = existing.id;
      // Garder le statut existant si c'est déjà 'paid', sinon mettre 'pending'
      status = existing.status === 'paid' ? 'paid' : 'pending';
    } else {
      totalEarnings = newViews * cpm;
    }

    // Si déjà payé toutes les vues, ne rien faire
    if (existing && declaredViews <= paidViews) {
      return existing;
    }

    let upsertData: any = {
      clipper_id: clipperId,
      tiktok_url: tiktokUrl,
      declared_views: declaredViews,
      verification_code: verificationCode,
      status,
      paid_views: declaredViews,
      earnings: totalEarnings,
      created_at: existing ? existing.created_at : new Date().toISOString(),
    };

    // Add submission_id seulement si la colonne existe (pour éviter l'erreur PGRST204)
    if (submissionId) {
      upsertData.submission_id = submissionId;
    }

    let result;
    if (existing) {
      // Update
      const { data, error } = await supabase
        .from('declarations')
        .update(upsertData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) {
        // Si erreur PGRST204 (colonne non trouvée), retry sans submission_id
        if (error.code === 'PGRST204' && submissionId) {
          console.warn('⚠️ Colonne submission_id non trouvée, retry sans cette colonne');
          delete upsertData.submission_id;
          const { data: retryData, error: retryError } = await supabase
            .from('declarations')
            .update(upsertData)
            .eq('id', id)
            .select('*')
            .single();
          if (retryError) throw retryError;
          result = retryData;
        } else {
          throw error;
        }
      } else {
        result = data;
      }
    } else {
      // Insert
      const { data, error } = await supabase
        .from('declarations')
        .insert(upsertData)
        .select('*')
        .single();
      
      if (error) {
        // Si erreur PGRST204 (colonne non trouvée), retry sans submission_id
        if (error.code === 'PGRST204' && submissionId) {
          console.warn('⚠️ Colonne submission_id non trouvée, retry sans cette colonne');
          delete upsertData.submission_id;
          const { data: retryData, error: retryError } = await supabase
            .from('declarations')
            .insert(upsertData)
            .select('*')
            .single();
          if (retryError) throw retryError;
          result = retryData;
        } else {
          throw error;
        }
      } else {
        result = data;
      }
    }
    return result;
  }

  // Récupérer l'historique des déclarations pour un clippeur
  async getDeclarationsForClipper(clipperId: string): Promise<Declaration[]> {
    const { data, error } = await supabase
      .from('declarations')
      .select('*')
      .eq('clipper_id', clipperId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }

  // Récupérer toutes les déclarations pour un TikTok
  async getDeclarationsForTiktok(tiktokUrl: string): Promise<Declaration[]> {
    const { data, error } = await supabase
      .from('declarations')
      .select('*')
      .eq('tiktok_url', tiktokUrl)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }
}

export default new DeclarationsService(); 