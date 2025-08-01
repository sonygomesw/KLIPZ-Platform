import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { COLORS, FONTS } from '../constants';

// Types pour les styles responsive
type ResponsiveStyle<T> = {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  desktopLarge?: T;
};

// Helper pour créer des styles responsive
export const createResponsiveStyle = <T extends ViewStyle | TextStyle | ImageStyle>(
  baseStyle: T,
  responsiveOverrides?: ResponsiveStyle<Partial<T>>
) => {
  return {
    base: baseStyle,
    responsive: responsiveOverrides || {},
  };
};

// Styles de base pour les cartes
export const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#2A2A2E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4A4A4E',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
});

// Styles pour les avatars
export const avatarStyles = StyleSheet.create({
  container: {
    borderRadius: 50,
    overflow: 'hidden',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#3A3A3E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A4A4E',
  },
});

// Styles pour le texte
export const textStyles = StyleSheet.create({
  title: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  subtitle: {
    color: '#8B8B8D',
    fontFamily: FONTS.regular,
  },
  caption: {
    color: '#6B6B6D',
    fontFamily: FONTS.regular,
  },
});

// Configurations responsive prédéfinies
export const responsiveConfig = {
  // Tailles d'avatar
  avatarSize: {
    mobile: 40,
    tablet: 45,
    desktop: 50,
    desktopLarge: 55,
  },
  
  // Tailles de police
  fontSize: {
    title: {
      mobile: 14,
      tablet: 15,
      desktop: 16,
      desktopLarge: 17,
    },
    subtitle: {
      mobile: 11,
      tablet: 12,
      desktop: 13,
      desktopLarge: 14,
    },
    caption: {
      mobile: 9,
      tablet: 10,
      desktop: 11,
      desktopLarge: 12,
    },
  },
  
  // Espacements
  spacing: {
    xs: {
      mobile: 4,
      tablet: 6,
      desktop: 8,
      desktopLarge: 10,
    },
    sm: {
      mobile: 8,
      tablet: 10,
      desktop: 12,
      desktopLarge: 14,
    },
    md: {
      mobile: 12,
      tablet: 14,
      desktop: 16,
      desktopLarge: 18,
    },
    lg: {
      mobile: 16,
      tablet: 20,
      desktop: 24,
      desktopLarge: 28,
    },
    xl: {
      mobile: 24,
      tablet: 32,
      desktop: 40,
      desktopLarge: 48,
    },
  },
  
  // Border radius
  borderRadius: {
    sm: {
      mobile: 8,
      tablet: 10,
      desktop: 12,
      desktopLarge: 14,
    },
    md: {
      mobile: 12,
      tablet: 14,
      desktop: 16,
      desktopLarge: 18,
    },
    lg: {
      mobile: 16,
      tablet: 18,
      desktop: 20,
      desktopLarge: 22,
    },
    full: 9999,
  },
};

// Export des constantes de layout
export const LAYOUT_CONFIG = {
  maxWidth: 1600,
  containerPadding: {
    mobile: 16,
    tablet: 24,
    desktop: 32,
    desktopLarge: 48,
  },
  gridGap: {
    mobile: 12,
    tablet: 16,
    desktop: 20,
    desktopLarge: 24,
  },
}; 