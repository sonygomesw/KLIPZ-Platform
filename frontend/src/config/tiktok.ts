// Configuration TikTok Login Kit
export const TIKTOK_CONFIG = {
  // TikTok Developer Console
  CLIENT_KEY: process.env.EXPO_PUBLIC_TIKTOK_CLIENT_KEY || '',
  CLIENT_SECRET: process.env.EXPO_PUBLIC_TIKTOK_CLIENT_SECRET || '',
  
  // OAuth endpoints
  AUTH_URL: 'https://www.tiktok.com/auth/authorize/',
  TOKEN_URL: 'https://open.tiktokapis.com/v2/oauth/token/',
  USER_INFO_URL: 'https://open.tiktokapis.com/v2/user/info/',
  VIDEO_LIST_URL: 'https://open.tiktokapis.com/v2/video/list/',
  VIDEO_QUERY_URL: 'https://open.tiktokapis.com/v2/video/query/',
  
  // Scopes autorisés pour récupérer les métriques vidéo
  SCOPES: [
    'user.info.basic',      // Informations de base
    'user.info.profile',    // Profil public
    'video.list',           // Liste des vidéos
    'video.insights'        // Métriques des vidéos
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

export interface TikTokVideoInfo {
  id: string;
  create_time: number;
  cover_image_url: string;
  share_url: string;
  video_description: string;
  duration: number;
  height: number;
  width: number;
  title: string;
  embed_html: string;
  embed_link: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
}

export interface TikTokVideoMetrics {
  video_id: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  play_count: number;
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