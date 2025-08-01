import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';
import { tiktokLoginService, TikTokUserData } from '../services/tiktokLoginService';
import { User } from '../types';

interface TikTokLoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (userData: TikTokUserData) => void;
  user: User;
}

const TikTokLoginModal: React.FC<TikTokLoginModalProps> = ({
  visible,
  onClose,
  onSuccess,
  user,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [tiktokData, setTiktokData] = useState<TikTokUserData | null>(null);

  useEffect(() => {
    if (visible) {
      checkTikTokConnection();
    }
  }, [visible]);

  const checkTikTokConnection = async () => {
    try {
      const hasConnected = await tiktokLoginService.hasTikTokConnected(user.id);
      if (hasConnected) {
        const data = await tiktokLoginService.getTikTokData(user.id);
        setTiktokData(data);
      }
    } catch (error) {
      console.error('❌ Erreur vérification TikTok:', error);
    }
  };

  const handleTikTokLogin = async () => {
    try {
      setIsLoading(true);
      console.log('🔗 Début connexion TikTok...');

      // Générer l'URL de connexion TikTok
      const authUrl = await tiktokLoginService.initiateTikTokLogin();
      
      // Ouvrir l'URL dans le navigateur
      const supported = await Linking.canOpenURL(authUrl);
      if (supported) {
        await Linking.openURL(authUrl);
      } else {
        Alert.alert('Erreur', 'Impossible d\'ouvrir TikTok Login');
      }
    } catch (error) {
      console.error('❌ Erreur connexion TikTok:', error);
      Alert.alert('Erreur', 'Impossible de se connecter à TikTok');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      await tiktokLoginService.disconnectTikTok(user.id);
      setTiktokData(null);
      Alert.alert('Succès', 'Compte TikTok déconnecté');
    } catch (error) {
      console.error('❌ Erreur déconnexion TikTok:', error);
      Alert.alert('Erreur', 'Impossible de déconnecter le compte TikTok');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallback = async (code: string, state: string) => {
    try {
      setIsLoading(true);
      const response = await tiktokLoginService.handleTikTokCallback(code, state);
      
      if (response.success && response.userData) {
        await tiktokLoginService.saveTikTokData(user.id, response.userData);
        setTiktokData(response.userData);
        onSuccess(response.userData);
        Alert.alert('Succès', 'Compte TikTok connecté avec succès !');
        onClose();
      } else {
        Alert.alert('Erreur', response.error || 'Erreur de connexion TikTok');
      }
    } catch (error) {
      console.error('❌ Erreur callback TikTok:', error);
      Alert.alert('Erreur', 'Erreur lors de la connexion TikTok');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#ffffff', '#f8f9fa']}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Connexion TikTok</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {tiktokData ? (
                // Compte TikTok connecté
                <View style={styles.connectedContainer}>
                  <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                      <Ionicons name="person-circle" size={60} color="#ff0050" />
                    </View>
                    <Text style={styles.username}>{tiktokData.nickname}</Text>
                    <Text style={styles.handle}>@{tiktokData.custom_username}</Text>
                  </View>

                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{tiktokData.follower_count.toLocaleString()}</Text>
                      <Text style={styles.statLabel}>Abonnés</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{tiktokData.video_count.toLocaleString()}</Text>
                      <Text style={styles.statLabel}>Vidéos</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{tiktokData.likes_count.toLocaleString()}</Text>
                      <Text style={styles.statLabel}>J'aime</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.disconnectButton}
                    onPress={handleDisconnect}
                    disabled={isLoading}
                  >
                    <Ionicons name="log-out-outline" size={20} color="#ffffff" />
                    <Text style={styles.disconnectButtonText}>Déconnecter</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Pas de compte TikTok connecté
                <View style={styles.notConnectedContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="logo-tiktok" size={80} color="#ff0050" />
                  </View>
                  
                  <Text style={styles.description}>
                    Connectez votre compte TikTok pour accéder à toutes les fonctionnalités de KLIPZ
                  </Text>

                  <View style={styles.benefitsContainer}>
                    <View style={styles.benefitItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.benefitText}>Accès à vos statistiques TikTok</Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.benefitText}>Soumission automatique de clips</Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.benefitText}>Suivi de vos performances</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.connectButton}
                    onPress={handleTikTokLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="logo-tiktok" size={20} color="#ffffff" />
                        <Text style={styles.connectButtonText}>Se connecter avec TikTok</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  modalContent: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  connectedContainer: {
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 10,
  },
  username: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 5,
  },
  handle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4757',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  disconnectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginLeft: 8,
  },
  notConnectedContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    marginLeft: 10,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff0050',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    ...SHADOWS.medium,
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginLeft: 8,
  },
});

export default TikTokLoginModal; 