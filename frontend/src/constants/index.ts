import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // Palette de couleurs moderne (mode sombre)
  primary: ['#0052FF', '#FFFFFF', '#0A0A0B'], // Bleu, Blanc, Noir très sombre
  primarySolid: '#0052FF', // Bleu principal
  secondary: '#FFFFFF', // Blanc
  accent: '#0A0A0B', // Noir très sombre
  purple: '#0052FF', // Bleu
  lightPurple: '#1A1A1E', // Gris sombre pour les cartes
  primaryLight: '#4A90E2', // Bleu clair pour les badges
  lightYellow: '#2A2A2E', // Gris sombre pour les placeholders
  lightGray: '#2A2A2E', // Gris sombre pour les inputs
  teal: '#0052FF', // Bleu
  success: '#00D4AA', // Vert pour succès
  error: '#FF6B6B', // Rouge pour erreur
  warning: '#FFA726', // Orange pour warning
  
  // Dark theme backgrounds
  background: '#0A0A0B', // Noir très sombre
  surface: '#1A1A1E', // Gris sombre pour les cartes
  card: '#1A1A1E', // Gris sombre
  cardLight: '#2A2A2E', // Gris plus clair pour les inputs
  white: '#FFFFFF',
  
  // Text colors for dark theme
  text: '#FFFFFF', // Blanc
  textSecondary: '#8B8B8D', // Gris clair
  textLight: '#ADB5BD', // Gris plus clair
  textDark: '#FFFFFF', // Blanc
  textWhite: '#FFFFFF', // Blanc
  
  // Borders for dark theme
  border: '#2A2A2E', // Gris sombre
  borderLight: '#3A3A3E', // Gris plus clair
  
  // Gradients avec nouvelle palette sombre
  gradientStart: '#0052FF', // Bleu start
  gradientMiddle: '#1A1A1E', // Gris sombre middle
  gradientEnd: '#0A0A0B', // Noir très sombre end
  purpleGradientStart: '#0052FF',
  purpleGradientEnd: '#1A1A1E',
  tealGradientStart: '#1A1A1E',
  tealGradientEnd: '#0A0A0B',
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
  regular: Platform.OS === 'web' ? '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif' : 'Inter_18pt-Regular',
  medium: Platform.OS === 'web' ? '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif' : 'Inter_18pt-Medium',
  bold: Platform.OS === 'web' ? '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif' : 'Inter_18pt-SemiBold',
  light: Platform.OS === 'web' ? '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif' : 'Inter_18pt-Light',
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