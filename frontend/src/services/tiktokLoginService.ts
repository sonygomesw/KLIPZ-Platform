import { supabase } from '../config/supabase';

export interface TikTokUserData {
  open_id: string;
  union_id?: string;
  custom_username: string;
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

  /**
   * Initie le processus de connexion TikTok
   * @returns URL d'authentification TikTok
   */
  async initiateTikTokLogin(): Promise<string> {
    const state = this.generateRandomState();
    const scope = 'user.info.basic,video.list,user.info.stats';
    
    const authUrl = `https://www.tiktok.com/v2/auth/authorize?` +
      `client_key=${this.clientKey}&` +
      `scope=${scope}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
      `state=${state}`;

    return authUrl;
  }

  /**
   * Gère le callback TikTok après authentification
   * @param code Code d'autorisation TikTok
   * @param state State parameter pour la sécurité
   * @returns Données utilisateur TikTok
   */
  async handleTikTokCallback(code: string, state: string): Promise<TikTokAuthResponse> {
    try {
      // Appeler notre backend pour échanger le code contre un token
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/tiktok-auth-callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ code, state }),
      });

      const data = await response.json();

      if (data.success && data.userData) {
        return {
          success: true,
          userData: data.userData,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to authenticate with TikTok',
        };
      }
    } catch (error) {
      console.error('TikTok callback error:', error);
      return {
        success: false,
        error: 'Network error during TikTok authentication',
      };
    }
  }

  /**
   * Sauvegarde les données TikTok dans Supabase
   * @param userId ID de l'utilisateur KLIPZ
   * @param tiktokData Données TikTok de l'utilisateur
   */
  async saveTikTokData(userId: string, tiktokData: TikTokUserData): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          tiktok_open_id: tiktokData.open_id,
          tiktok_union_id: tiktokData.union_id,
          tiktok_username: tiktokData.custom_username,
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

      if (error) {
        console.error('Error saving TikTok data:', error);
        throw new Error('Failed to save TikTok data');
      }
    } catch (error) {
      console.error('Error in saveTikTokData:', error);
      throw error;
    }
  }

  /**
   * Vérifie si l'utilisateur a un compte TikTok connecté
   * @param userId ID de l'utilisateur KLIPZ
   * @returns true si connecté, false sinon
   */
  async hasTikTokConnected(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('tiktok_open_id')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking TikTok connection:', error);
        return false;
      }

      return !!data?.tiktok_open_id;
    } catch (error) {
      console.error('Error in hasTikTokConnected:', error);
      return false;
    }
  }

  /**
   * Récupère les données TikTok de l'utilisateur
   * @param userId ID de l'utilisateur KLIPZ
   * @returns Données TikTok ou null
   */
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

      if (error || !data?.tiktok_open_id) {
        return null;
      }

      return {
        open_id: data.tiktok_open_id,
        union_id: data.tiktok_union_id,
        custom_username: data.tiktok_username,
        nickname: data.tiktok_nickname,
        avatar_url: data.tiktok_avatar_url,
        follower_count: data.tiktok_follower_count || 0,
        following_count: data.tiktok_following_count || 0,
        likes_count: data.tiktok_likes_count || 0,
        video_count: data.tiktok_video_count || 0,
        bio_description: data.tiktok_bio_description,
        profile_deep_link: data.tiktok_profile_deep_link,
        is_verified: data.tiktok_is_verified || false,
        follower_status: data.tiktok_follower_status || 0,
      };
    } catch (error) {
      console.error('Error in getTikTokData:', error);
      return null;
    }
  }

  /**
   * Déconnecte le compte TikTok de l'utilisateur
   * @param userId ID de l'utilisateur KLIPZ
   */
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

      if (error) {
        console.error('Error disconnecting TikTok:', error);
        throw new Error('Failed to disconnect TikTok account');
      }
    } catch (error) {
      console.error('Error in disconnectTikTok:', error);
      throw error;
    }
  }

  /**
   * Génère un state aléatoire pour la sécurité OAuth
   * @returns State aléatoire
   */
  private generateRandomState(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export const tiktokLoginService = new TikTokLoginService(); 