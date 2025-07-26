import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // Palette de couleurs moderne (style crypto)
  primary: ['#0052FF', '#FFFFFF', '#0A0B0D'], // Bleu, Blanc, Noir
  primarySolid: '#0052FF', // Bleu principal
  secondary: '#FFFFFF', // Blanc
  accent: '#0A0B0D', // Noir
  purple: '#0052FF', // Bleu
  lightPurple: '#F8F9FA', // Gris très clair
  primaryLight: '#4A90E2', // Bleu clair pour les badges
  lightYellow: '#FFF9E6', // Jaune clair pour les banners
  lightGray: '#F5F5F5', // Gris clair pour les placeholders
  teal: '#0052FF', // Bleu
  success: '#00D4AA', // Vert pour succès
  error: '#FF6B6B', // Rouge pour erreur
  warning: '#FFA726', // Orange pour warning
  
  // Light theme backgrounds (style crypto)
  background: '#FFFFFF', // Blanc
  surface: '#F8F9FA', // Gris très clair
  card: '#FFFFFF', // Blanc
  cardLight: '#F8F9FA', // Gris très clair
  white: '#FFFFFF',
  
  // Text colors for light theme
  text: '#0A0B0D', // Noir
  textSecondary: '#6C757D', // Gris
  textLight: '#ADB5BD', // Gris clair
  textDark: '#0A0B0D', // Noir
  textWhite: '#FFFFFF', // Blanc
  
  // Borders for light theme
  border: '#E9ECEF', // Gris très clair
  borderLight: '#F8F9FA', // Gris très clair
  
  // Gradients avec nouvelle palette
  gradientStart: '#0052FF', // Bleu start
  gradientMiddle: '#FFFFFF', // Blanc middle
  gradientEnd: '#0A0B0D', // Noir end
  purpleGradientStart: '#0052FF',
  purpleGradientEnd: '#FFFFFF',
  tealGradientStart: '#FFFFFF',
  tealGradientEnd: '#0A0B0D',
};

export const SIZES = {
  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    base: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },
  
  // Screen dimensions
  width,
  height,
  
  // Border radius
  radius: {
    sm: 4,
    base: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  light: 'System',
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const API_BASE_URL = 'https://api.klipz.com'; // À changer selon votre backend

export const TIKTOK_OAUTH_CONFIG = {
  clientId: 'your_tiktok_client_id', // À configurer
  redirectUri: 'exp://localhost:19000/--/auth/callback',
  scope: 'user.info.basic,video.list',
}; 