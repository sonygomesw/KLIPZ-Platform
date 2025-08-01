import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';

interface ResponsiveGridProps {
  children: React.ReactNode[];
  minItemWidth?: number;
  gap?: number;
  maxColumns?: number;
  style?: any;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  minItemWidth = 280,
  gap = 16,
  maxColumns = 4,
  style
}) => {
  const [dimensions, setDimensions] = useState(() => {
    const { width } = Dimensions.get('window');
    return { width, columns: 1 };
  });
  
  const containerRef = useRef<View>(null);

  useEffect(() => {
    const calculateGrid = (screenWidth: number) => {
      // Breakpoints responsive modernes
      let columns = 1;
      
      if (screenWidth >= 1440) {
        columns = 4; // Desktop large
      } else if (screenWidth >= 1024) {
        columns = 3; // Desktop
      } else if (screenWidth >= 768) {
        columns = 2; // Tablet
      } else {
        columns = 1; // Mobile
      }
      
      // Limiter au nombre max de colonnes
      columns = Math.min(columns, maxColumns);
      
      // S'assurer qu'on peut afficher au moins minItemWidth par colonne
      const maxPossibleColumns = Math.floor((screenWidth - gap) / (minItemWidth + gap));
      columns = Math.min(columns, Math.max(1, maxPossibleColumns));
      
      setDimensions({ width: screenWidth, columns });
    };

    // Calcul initial
    const initialWidth = Dimensions.get('window').width;
    calculateGrid(initialWidth);

    // Écouter les changements
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      calculateGrid(window.width);
    });

    return () => subscription?.remove();
  }, [minItemWidth, gap, maxColumns]);

  // Utiliser CSS Grid sur web, Flexbox sur mobile
  const isWeb = Platform.OS === 'web';
  
  if (isWeb && dimensions.columns > 1) {
    // CSS Grid pour le web
    return (
      <View 
        ref={containerRef}
        style={[
          styles.container,
          style,
          {
            // @ts-ignore - CSS Grid properties
            display: 'grid',
            gridTemplateColumns: `repeat(${dimensions.columns}, 1fr)`,
            gap: gap,
            width: '100%',
            maxWidth: 1600, // Largeur max pour les très grands écrans
            marginHorizontal: 'auto',
            paddingHorizontal: gap,
          }
        ]}
      >
        {children.map((child, index) => (
          <View key={index} style={styles.gridItem}>
            {child}
          </View>
        ))}
      </View>
    );
  }

  // Flexbox fallback pour mobile et 1 colonne
  const itemWidth: any = dimensions.columns === 1 
    ? '100%' 
    : `${(100 / dimensions.columns) - (gap * (dimensions.columns - 1) / dimensions.columns)}%`;

  return (
    <View 
      ref={containerRef}
      style={[
        styles.container,
        styles.flexContainer,
        style,
        { paddingHorizontal: gap }
      ]}
    >
      <View style={[styles.flexGrid, { marginHorizontal: -gap/2 }]}>
        {children.map((child, index) => (
          <View
            key={index}
            style={[
              styles.flexItem,
              {
                width: itemWidth,
                paddingHorizontal: gap/2,
                marginBottom: gap,
              }
            ]}
          >
            {child}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  gridItem: {
    width: '100%',
  },
  flexContainer: {
    width: '100%',
    alignItems: 'center',
  },
  flexGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: 1600,
  },
  flexItem: {
    minWidth: 0,
  },
});

export default ResponsiveGrid; 