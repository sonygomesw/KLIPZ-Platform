import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'desktopLarge';

interface ResponsiveConfig {
  mobile: number;      // < 768px
  tablet: number;      // 768px - 1023px
  desktop: number;     // 1024px - 1439px
  desktopLarge: number; // >= 1440px
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
};

export const useResponsive = () => {
  const [screenData, setScreenData] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return {
      width,
      height,
      breakpoint: getBreakpoint(width),
      isWeb: Platform.OS === 'web',
      isMobile: width < BREAKPOINTS.mobile,
      isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
      isDesktop: width >= BREAKPOINTS.tablet,
      isDesktopLarge: width >= BREAKPOINTS.desktop,
    };
  });

  useEffect(() => {
    const updateDimensions = ({ window }: any) => {
      const { width, height } = window;
      setScreenData({
        width,
        height,
        breakpoint: getBreakpoint(width),
        isWeb: Platform.OS === 'web',
        isMobile: width < BREAKPOINTS.mobile,
        isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
        isDesktop: width >= BREAKPOINTS.tablet,
        isDesktopLarge: width >= BREAKPOINTS.desktop,
      });
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

  const getValue = <T extends any>(config: ResponsiveConfig): T => {
    switch (screenData.breakpoint) {
      case 'mobile':
        return config.mobile as T;
      case 'tablet':
        return config.tablet as T;
      case 'desktop':
        return config.desktop as T;
      case 'desktopLarge':
        return config.desktopLarge as T;
      default:
        return config.mobile as T;
    }
  };

  return {
    ...screenData,
    getValue,
    BREAKPOINTS,
  };
};

function getBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  if (width < BREAKPOINTS.desktop) return 'desktop';
  return 'desktopLarge';
}

// Export des constantes utiles
export const GRID_CONFIG = {
  gap: {
    mobile: 12,
    tablet: 16,
    desktop: 20,
    desktopLarge: 24,
  },
  padding: {
    mobile: 16,
    tablet: 24,
    desktop: 32,
    desktopLarge: 48,
  },
  columns: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
    desktopLarge: 4,
  },
}; 