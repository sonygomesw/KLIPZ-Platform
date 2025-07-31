import { supabase } from '../config/supabase';
import tiktokAuthService from './tiktokAuthService';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

export interface TikTokMetricsResult {
  success: boolean;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  earnings?: number;
  paymentTriggered?: boolean;
  error?: string;
}

export class TikTokMetricsService {
  
  // Sauvegarder le token TikTok de l'utilisateur
  static async saveUserTikTokToken(userId: string, accessToken: string, refreshToken?: string, expiresIn?: number): Promise<void> {
    try {
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

      const { error } = await supabase
        .from('user_tokens')
        .upsert({
          user_id: userId,
          tiktok_access_token: accessToken,
          tiktok_refresh_token: refreshToken,
          tiktok_expires_at: expiresAt?.toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error sauvegarde token TikTok:', error);
        throw error;
      }

      console.log('✅ Token TikTok sauvegardé');
    } catch (error) {
      console.error('❌ Error sauvegarde token:', error);
      throw error;
    }
  }

  // Récupérer les métriques d'une vidéo TikTok via l'API officielle
  static async getVideoMetrics(videoUrl: string): Promise<TikTokMetricsResult> {
    try {
      const accessToken = tiktokAuthService.getAccessToken();
      
      if (!accessToken) {
        return {
          success: false,
          error: 'Token TikTok requis - veuillez vous connecter à TikTok'
        };
      }

      console.log('🔍 Récupération métriques vidéo:', videoUrl);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-tiktok-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'get-video-metrics',
          videoUrl,
          accessToken
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur récupération métriques');
      }

      const data = await response.json();
      console.log('✅ Métriques récupérées:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Error récupération métriques:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Mettre à jour une soumission avec les vraies métriques TikTok
  static async updateSubmissionMetrics(submissionId: string, userId: string): Promise<TikTokMetricsResult> {
    try {
      console.log('📊 Mise à jour soumission avec métriques TikTok:', submissionId);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-tiktok-metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'update-submission',
          submissionId,
          userId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur mise à jour soumission');
      }

      const data = await response.json();
      console.log('✅ Soumission mise à jour:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Error mise à jour soumission:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Mettre à jour toutes les soumissions d'un utilisateur avec les vraies métriques
  static async updateAllUserSubmissions(userId: string): Promise<{
    success: boolean;
    updated: number;
    errors: string[];
  }> {
    try {
      console.log('🚀 Mise à jour de toutes les soumissions utilisateur:', userId);

      // Récupérer toutes les soumissions approuvées non payées de l'utilisateur
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .is('paid_at', null);

      if (error) {
        throw error;
      }

      if (!submissions || submissions.length === 0) {
        return {
          success: true,
          updated: 0,
          errors: []
        };
      }

      const results = await Promise.allSettled(
        submissions.map(submission => 
          this.updateSubmissionMetrics(submission.id, userId)
        )
      );

      const updated = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;

      const errors = results
        .filter(result => result.status === 'rejected' || 
          (result.status === 'fulfilled' && !result.value.success))
        .map(result => 
          result.status === 'rejected' 
            ? result.reason?.message || 'Erreur inconnue'
            : result.value.error || 'Erreur inconnue'
        );

      console.log(`✅ Mise à jour terminée: ${updated}/${submissions.length} soumissions mises à jour`);

      return {
        success: true,
        updated,
        errors
      };

    } catch (error) {
      console.error('❌ Error mise à jour soumissions:', error);
      return {
        success: false,
        updated: 0,
        errors: [error.message]
      };
    }
  }

  // Vérifier si l'utilisateur a besoin de se reconnecter à TikTok
  static async checkTikTokTokenValidity(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_tokens')
        .select('tiktok_access_token, tiktok_expires_at')
        .eq('user_id', userId)
        .single();

      if (error || !data?.tiktok_access_token) {
        return false;
      }

      // Vérifier si le token a expiré
      if (data.tiktok_expires_at) {
        const expiresAt = new Date(data.tiktok_expires_at);
        const now = new Date();
        
        if (now >= expiresAt) {
          console.log('⚠️ Token TikTok expiré');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error vérification token:', error);
      return false;
    }
  }

  // Connecter l'utilisateur à TikTok et sauvegarder le token
  static async connectUserToTikTok(userId: string): Promise<{
    success: boolean;
    userInfo?: any;
    error?: string;
  }> {
    try {
      console.log('🔵 Connexion TikTok utilisateur:', userId);

      // Authentifier avec TikTok
      const userInfo = await tiktokAuthService.authenticateWithTikTok();
      
      // Récupérer le token
      const accessToken = tiktokAuthService.getAccessToken();
      
      if (!accessToken) {
        throw new Error('Token d\'accès non récupéré');
      }

      // Sauvegarder le token dans la DB
      await this.saveUserTikTokToken(userId, accessToken);

      // Sauvegarder les infos TikTok dans le profil utilisateur
      await tiktokAuthService.saveTikTokInfo(userId, userInfo);

      console.log('✅ Utilisateur connecté à TikTok avec succès');

      return {
        success: true,
        userInfo
      };

    } catch (error) {
      console.error('❌ Error connexion TikTok:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default TikTokMetricsService;