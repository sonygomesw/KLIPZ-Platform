import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { TIKTOK_CONFIG, TikTokAuthResponse, TikTokUserInfo, TikTokVideoInfo, TikTokVideoMetrics, TIKTOK_ERRORS } from '../config/tiktok';
import { supabase } from '../config/supabase';

class TikTokAuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number | null = null;

  // Générer l'URL d'autorisation TikTok
  private generateAuthUrl(): string {
    const params = new URLSearchParams({
      client_key: TIKTOK_CONFIG.CLIENT_KEY,
      response_type: 'code',
      scope: TIKTOK_CONFIG.SCOPES,
      redirect_uri: TIKTOK_CONFIG.REDIRECT_URI,
      state: TIKTOK_CONFIG.STATE,
      prompt: 'consent'
    });

    return `${TIKTOK_CONFIG.AUTH_URL}?${params.toString()}`;
  }

  // Échanger le code contre un access token
  private async exchangeCodeForToken(code: string): Promise<TikTokAuthResponse> {
    try {
      console.log('🔵 TikTok Auth - Échange du code contre token...');
      
      const response = await fetch(TIKTOK_CONFIG.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache'
        },
        body: new URLSearchParams({
          client_key: TIKTOK_CONFIG.CLIENT_KEY,
          client_secret: TIKTOK_CONFIG.CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: TIKTOK_CONFIG.REDIRECT_URI
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ TikTok Auth - Error échange token:', errorData);
        throw new Error(errorData.error_description || TIKTOK_ERRORS.INVALID_CODE);
      }

      const data: TikTokAuthResponse = await response.json();
      console.log('✅ TikTok Auth - Token obtenu avec succès');
      
      return data;
    } catch (error) {
      console.error('❌ TikTok Auth - Error échange token:', error);
      throw new Error(TIKTOK_ERRORS.NETWORK_ERROR);
    }
  }

  // Obtenir les informations utilisateur TikTok
  private async getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
    try {
      console.log('🔵 TikTok Auth - Récupération des infos utilisateur...');
      
      const response = await fetch(TIKTOK_CONFIG.USER_INFO_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ TikTok Auth - Error infos utilisateur:', errorData);
        throw new Error(errorData.error_description || TIKTOK_ERRORS.ACCESS_DENIED);
      }

      const data = await response.json();
      console.log('✅ TikTok Auth - Infos utilisateur récupérées');
      
      return data.user;
    } catch (error) {
      console.error('❌ TikTok Auth - Error infos utilisateur:', error);
      throw new Error(TIKTOK_ERRORS.NETWORK_ERROR);
    }
  }

  // Authentification TikTok complète
  async authenticateWithTikTok(): Promise<TikTokUserInfo> {
    try {
      console.log('🔵 TikTok Auth - Début de l\'authentification...');
      
      // 1. Ouvrir le navigateur pour l'autorisation
      const authUrl = this.generateAuthUrl();
      console.log('🔵 TikTok Auth - URL d\'autorisation:', authUrl);
      
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        TIKTOK_CONFIG.REDIRECT_URI
      );

      if (result.type === 'cancel') {
        throw new Error(TIKTOK_ERRORS.ACCESS_DENIED);
      }

      if (result.type === 'success' && result.url) {
        // 2. Extraire le code d'autorisation de l'URL
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        if (error) {
          console.error('❌ TikTok Auth - Error OAuth:', error);
          throw new Error(TIKTOK_ERRORS.ACCESS_DENIED);
        }

        if (!code) {
          throw new Error(TIKTOK_ERRORS.INVALID_CODE);
        }

        if (state !== TIKTOK_CONFIG.STATE) {
          throw new Error('État OAuth invalide');
        }

        // 3. Échanger le code contre un token
        const tokenData = await this.exchangeCodeForToken(code);
        
        // 4. Stocker les tokens
        this.accessToken = tokenData.access_token;
        this.refreshToken = tokenData.refresh_token || null;
        this.expiresAt = Date.now() + (tokenData.expires_in * 1000);

        // 5. Obtenir les informations utilisateur
        const userInfo = await this.getUserInfo(tokenData.access_token);
        
        console.log('✅ TikTok Auth - Authentification réussie:', {
          username: userInfo.username,
          displayName: userInfo.display_name,
          openId: userInfo.open_id
        });

        return userInfo;
      }

      throw new Error(TIKTOK_ERRORS.UNKNOWN_ERROR);
    } catch (error) {
      console.error('❌ TikTok Auth - Error authentification:', error);
      throw error;
    }
  }

  // Vérifier si l'utilisateur est connecté à TikTok
  isAuthenticated(): boolean {
    return !!this.accessToken && (this.expiresAt ? Date.now() < this.expiresAt : true);
  }

  // Obtenir le token d'accès actuel
  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Déconnecter de TikTok
  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
    console.log('🔵 TikTok Auth - Sign Out effectuée');
  }

  // Sauvegarder les infos TikTok dans Supabase
  async saveTikTokInfo(userId: string, tiktokInfo: TikTokUserInfo): Promise<void> {
    try {
      console.log('🔵 TikTok Auth - Sauvegarde des infos TikTok...');
      
      const { error } = await supabase
        .from('users')
        .update({
          tiktok_username: tiktokInfo.username,
          tiktok_display_name: tiktokInfo.display_name,
          tiktok_profile_image: tiktokInfo.avatar_url,
          tiktok_open_id: tiktokInfo.open_id,
          tiktok_followers: tiktokInfo.follower_count || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ TikTok Auth - Error sauvegarde:', error);
        throw error;
      }

      console.log('✅ TikTok Auth - Infos TikTok sauvegardées');
    } catch (error) {
      console.error('❌ TikTok Auth - Error sauvegarde TikTok:', error);
      throw error;
    }
  }

  // Valider une URL TikTok
  validateTikTokUrl(url: string): boolean {
    const tiktokRegex = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\/.+/;
    return tiktokRegex.test(url);
  }

  // Extraire l'ID vidéo d'une URL TikTok
  extractVideoId(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Format: /@username/video/1234567890123456789
      const videoIndex = pathParts.indexOf('video');
      if (videoIndex !== -1 && pathParts[videoIndex + 1]) {
        return pathParts[videoIndex + 1];
      }
      
      return null;
    } catch (error) {
      console.error('❌ TikTok Auth - Error extraction ID vidéo:', error);
      return null;
    }
  }

  // Récupérer les métriques d'une vidéo spécifique via l'API TikTok
  async getVideoMetrics(videoUrl: string): Promise<TikTokVideoMetrics | null> {
    try {
      if (!this.accessToken) {
        throw new Error('Token d\'accès TikTok requis');
      }

      const videoId = this.extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error('ID vidéo introuvable dans l\'URL');
      }

      console.log('🔵 TikTok Auth - Récupération métriques vidéo:', videoId);

      const response = await fetch(TIKTOK_CONFIG.VIDEO_QUERY_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filters: {
            video_ids: [videoId]
          },
          fields: ['id', 'like_count', 'comment_count', 'share_count', 'view_count']
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ TikTok Auth - Error métriques vidéo:', errorData);
        throw new Error(errorData.error?.message || 'Erreur récupération métriques');
      }

      const data = await response.json();
      const videoData = data.data?.videos?.[0];

      if (!videoData) {
        throw new Error('Vidéo non trouvée ou pas accessible');
      }

      console.log('✅ TikTok Auth - Métriques récupérées:', videoData);

      return {
        video_id: videoData.id,
        view_count: videoData.view_count || 0,
        like_count: videoData.like_count || 0,
        comment_count: videoData.comment_count || 0,
        share_count: videoData.share_count || 0,
        play_count: videoData.view_count || 0 // play_count = view_count pour TikTok
      };

    } catch (error) {
      console.error('❌ TikTok Auth - Error métriques vidéo:', error);
      return null;
    }
  }

  // Récupérer toutes les vidéos d'un utilisateur avec leurs métriques
  async getUserVideos(cursor?: string): Promise<{ videos: TikTokVideoInfo[], has_more: boolean, cursor?: string }> {
    try {
      if (!this.accessToken) {
        throw new Error('Token d\'accès TikTok requis');
      }

      console.log('🔵 TikTok Auth - Récupération vidéos utilisateur...');

      const body: any = {
        fields: ['id', 'create_time', 'cover_image_url', 'share_url', 'video_description', 'duration', 'height', 'width', 'title', 'like_count', 'comment_count', 'share_count', 'view_count'],
        max_count: 20
      };

      if (cursor) {
        body.cursor = cursor;
      }

      const response = await fetch(TIKTOK_CONFIG.VIDEO_LIST_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ TikTok Auth - Error liste vidéos:', errorData);
        throw new Error(errorData.error?.message || 'Erreur récupération vidéos');
      }

      const data = await response.json();
      console.log('✅ TikTok Auth - Vidéos récupérées:', data.data?.videos?.length || 0);

      return {
        videos: data.data?.videos || [],
        has_more: data.data?.has_more || false,
        cursor: data.data?.cursor
      };

    } catch (error) {
      console.error('❌ TikTok Auth - Error vidéos utilisateur:', error);
      return { videos: [], has_more: false };
    }
  }
}

export default new TikTokAuthService(); 