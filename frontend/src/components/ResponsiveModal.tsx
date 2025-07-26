import React from 'react';
import {
  View,
  Modal,
  Platform,
  Dimensions,
  StyleSheet,
} from 'react-native';

interface ResponsiveModalProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  animationType?: 'none' | 'slide' | 'fade';
}

const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  visible,
  onRequestClose,
  children,
  animationType = 'slide'
}) => {
  const { width } = Dimensions.get('window');
  const isDesktop = Platform.OS === 'web' && width >= 800;

  if (isDesktop) {
    // Sur desktop, afficher comme overlay sans couvrir la navbar
    if (!visible) return null;
    
    return (
      <View style={styles.desktopOverlay}>
        <View style={styles.desktopContainer}>
          {children}
        </View>
      </View>
    );
  }

  // Sur mobile, utiliser le Modal natif
  return (
    <Modal
      visible={visible}
      animationType={animationType}
      presentationStyle="pageSheet"
      onRequestClose={onRequestClose}
    >
      {children}
    </Modal>
  );
};

const styles = StyleSheet.create({
  desktopOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)', // Pour Safari
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  desktopContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
});

export default ResponsiveModal; 