// Configuration TikTok Login Kit
export const TIKTOK_CONFIG = {
  // TikTok Developer Console
  CLIENT_KEY: process.env.EXPO_PUBLIC_TIKTOK_CLIENT_KEY || '',
  CLIENT_SECRET: process.env.EXPO_PUBLIC_TIKTOK_CLIENT_SECRET || '',
  
  // OAuth endpoints
  AUTH_URL: 'https://www.tiktok.com/auth/authorize/',
  TOKEN_URL: 'https://open.tiktokapis.com/v2/oauth/token/',
  USER_INFO_URL: 'https://open.tiktokapis.com/v2/user/info/',
  
  // Scopes autorisés
  SCOPES: [
    'user.info.basic',      // Informations de base
    'user.info.profile',    // Profil public
    'user.info.stats'       // Statistiques publiques (si disponible)
  ].join(','),
  
  // Redirect URI (doit correspondre à TikTok Developer Console)
  REDIRECT_URI: 'klipz://tiktok-auth',
  
  // État pour sécurité OAuth
  STATE: 'klipz_tiktok_auth'
};

// Types pour l'authentification TikTok
export interface TikTokAuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  open_id: string;
  scope: string;
  token_type: string;
}

export interface TikTokUserInfo {
  open_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio_description?: string;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  video_count?: number;
}

// Errors TikTok
export const TIKTOK_ERRORS = {
  INVALID_CLIENT: 'Client key invalide',
  INVALID_SCOPE: 'Scope non autorisé',
  ACCESS_DENIED: 'Accès refusé par l\'utilisateur',
  INVALID_CODE: 'Code d\'autorisation invalide',
  NETWORK_ERROR: 'Error réseau',
  UNKNOWN_ERROR: 'Error inconnue'
}; 