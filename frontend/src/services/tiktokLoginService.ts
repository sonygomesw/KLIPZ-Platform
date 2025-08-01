import { supabase } from '../config/supabase';

export interface TikTokUserData {
  open_id: string;
  union_id?: string;
  nickname: string;
  avatar_url: string;
  follower_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
  bio_description?: string;
  profile_deep_link?: string;
  is_verified: boolean;
  follower_status: number;
  custom_username?: string;
}

export interface TikTokAuthResponse {
  success: boolean;
  userData?: TikTokUserData;
  error?: string;
}

class TikTokLoginService {
  private clientKey: string;
  private redirectUri: string;

  constructor() {
    this.clientKey = process.env.EXPO_PUBLIC_TIKTOK_CLIENT_KEY || '';
    this.redirectUri = process.env.EXPO_PUBLIC_TIKTOK_REDIRECT_URI || '';
  }

  // Initialiser la connexion TikTok
  async initiateTikTokLogin(): Promise<string> {
    try {
      console.log('🔗 Initialisation TikTok Login...');
      
      const state = this.generateRandomState();
      const scope = 'user.info.basic,video.list';
      
      const authUrl = `https://www.tiktok.com/v2/auth/authorize?` +
        `client_key=${this.clientKey}&` +
        `scope=${scope}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
        `state=${state}`;

      console.log('🔗 URL TikTok Login:', authUrl);
      return authUrl;
    } catch (error) {
      console.error('❌ Erreur initialisation TikTok Login:', error);
      throw error;
    }
  }

  // Traiter le callback TikTok
  async handleTikTokCallback(code: string, state: string): Promise<TikTokAuthResponse> {
    try {
      console.log('🔄 Traitement callback TikTok...');
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/tiktok-auth-callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          state,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur authentification TikTok');
      }

      const data = await response.json();
      console.log('✅ Authentification TikTok réussie:', data);
      
      return {
        success: true,
        userData: data.userData,
      };
    } catch (error) {
      console.error('❌ Erreur callback TikTok:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Sauvegarder les données TikTok de l'utilisateur
  async saveTikTokData(userId: string, tiktokData: TikTokUserData): Promise<void> {
    try {
      console.log('💾 Sauvegarde données TikTok...');
      
      const { error } = await supabase
        .from('users')
        .update({
          tiktok_open_id: tiktokData.open_id,
          tiktok_union_id: tiktokData.union_id,
          tiktok_username: tiktokData.custom_username || tiktokData.nickname,
          tiktok_nickname: tiktokData.nickname,
          tiktok_avatar_url: tiktokData.avatar_url,
          tiktok_follower_count: tiktokData.follower_count,
          tiktok_following_count: tiktokData.following_count,
          tiktok_likes_count: tiktokData.likes_count,
          tiktok_video_count: tiktokData.video_count,
          tiktok_bio_description: tiktokData.bio_description,
          tiktok_profile_deep_link: tiktokData.profile_deep_link,
          tiktok_is_verified: tiktokData.is_verified,
          tiktok_follower_status: tiktokData.follower_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      
      console.log('✅ Données TikTok sauvegardées');
    } catch (error) {
      console.error('❌ Erreur sauvegarde TikTok:', error);
      throw error;
    }
  }

  // Vérifier si l'utilisateur a connecté son compte TikTok
  async hasTikTokConnected(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('tiktok_open_id')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      return !!data?.tiktok_open_id;
    } catch (error) {
      console.error('❌ Erreur vérification TikTok:', error);
      return false;
    }
  }

  // Récupérer les données TikTok de l'utilisateur
  async getTikTokData(userId: string): Promise<TikTokUserData | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          tiktok_open_id,
          tiktok_union_id,
          tiktok_username,
          tiktok_nickname,
          tiktok_avatar_url,
          tiktok_follower_count,
          tiktok_following_count,
          tiktok_likes_count,
          tiktok_video_count,
          tiktok_bio_description,
          tiktok_profile_deep_link,
          tiktok_is_verified,
          tiktok_follower_status
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (!data?.tiktok_open_id) return null;

      return {
        open_id: data.tiktok_open_id,
        union_id: data.tiktok_union_id,
        nickname: data.tiktok_nickname,
        avatar_url: data.tiktok_avatar_url,
        follower_count: data.tiktok_follower_count,
        following_count: data.tiktok_following_count,
        likes_count: data.tiktok_likes_count,
        video_count: data.tiktok_video_count,
        bio_description: data.tiktok_bio_description,
        profile_deep_link: data.tiktok_profile_deep_link,
        is_verified: data.tiktok_is_verified,
        follower_status: data.tiktok_follower_status,
        custom_username: data.tiktok_username,
      };
    } catch (error) {
      console.error('❌ Erreur récupération TikTok:', error);
      return null;
    }
  }

  // Déconnecter le compte TikTok
  async disconnectTikTok(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          tiktok_open_id: null,
          tiktok_union_id: null,
          tiktok_username: null,
          tiktok_nickname: null,
          tiktok_avatar_url: null,
          tiktok_follower_count: null,
          tiktok_following_count: null,
          tiktok_likes_count: null,
          tiktok_video_count: null,
          tiktok_bio_description: null,
          tiktok_profile_deep_link: null,
          tiktok_is_verified: null,
          tiktok_follower_status: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      
      console.log('✅ Compte TikTok déconnecté');
    } catch (error) {
      console.error('❌ Erreur déconnexion TikTok:', error);
      throw error;
    }
  }

  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

export const tiktokLoginService = new TikTokLoginService(); 