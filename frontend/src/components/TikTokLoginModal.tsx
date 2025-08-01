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
  Image,
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
      } else {
        setTiktokData(null);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification TikTok:', error);
    }
  };

  const handleTikTokLogin = async () => {
    try {
      setIsLoading(true);
      const authUrl = await tiktokLoginService.initiateTikTokLogin();
      
      // Ouvrir l'URL TikTok dans le navigateur
      const supported = await Linking.canOpenURL(authUrl);
      if (supported) {
        await Linking.openURL(authUrl);
      } else {
        Alert.alert('Erreur', 'Impossible d\'ouvrir le navigateur');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion TikTok:', error);
      Alert.alert('Erreur', 'Impossible de démarrer la connexion TikTok');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Déconnecter TikTok',
      'Êtes-vous sûr de vouloir déconnecter votre compte TikTok ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await tiktokLoginService.disconnectTikTok(user.id);
              setTiktokData(null);
              Alert.alert('Succès', 'Compte TikTok déconnecté');
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              Alert.alert('Erreur', 'Impossible de déconnecter le compte');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCallback = async (code: string, state: string) => {
    try {
      setIsLoading(true);
      const response = await tiktokLoginService.handleTikTokCallback(code, state);
      
      if (response.success) {
        await tiktokLoginService.saveTikTokData(user.id, response.userData);
        setTiktokData(response.userData);
        onSuccess(response.userData);
        Alert.alert('Succès', 'Compte TikTok connecté avec succès !');
      } else {
        Alert.alert('Erreur', response.error || 'Échec de la connexion TikTok');
      }
    } catch (error) {
      console.error('Erreur lors du callback TikTok:', error);
      Alert.alert('Erreur', 'Impossible de finaliser la connexion TikTok');
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
              <View style={styles.headerContent}>
                <Ionicons name="logo-tiktok" size={28} color="#ff0050" />
                <Text style={styles.headerTitle}>TikTok Account</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff0050" />
                <Text style={styles.loadingText}>Connexion en cours...</Text>
              </View>
            ) : tiktokData ? (
              // Compte TikTok connecté
              <View style={styles.connectedContainer}>
                <View style={styles.profileSection}>
                  <View style={styles.profileImageContainer}>
                    <Ionicons name="person" size={40} color="#ff0050" />
                  </View>
                  <Text style={styles.profileName}>{tiktokData.nickname}</Text>
                  <Text style={styles.profileHandle}>@{tiktokData.custom_username}</Text>
                </View>

                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{tiktokData.follower_count.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Followers</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{tiktokData.video_count.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Videos</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{tiktokData.likes_count.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Likes</Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.disconnectButton}
                    onPress={handleDisconnect}
                  >
                    <Ionicons name="log-out-outline" size={20} color="#ff4757" />
                    <Text style={styles.disconnectText}>Disconnect</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Compte TikTok non connecté
              <View style={styles.notConnectedContainer}>
                <View style={styles.iconContainer}>
                  <Ionicons name="logo-tiktok" size={60} color="#ff0050" />
                </View>
                
                <Text style={styles.title}>Connect Your TikTok Account</Text>
                <Text style={styles.description}>
                  Connect your TikTok account to submit clips and track your performance. 
                  We'll only access your public profile information.
                </Text>

                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={handleTikTokLogin}
                  disabled={isLoading}
                >
                  <Ionicons name="logo-tiktok" size={24} color="#ffffff" />
                  <Text style={styles.connectButtonText}>Connect TikTok Account</Text>
                </TouchableOpacity>

                <Text style={styles.privacyText}>
                  By connecting, you agree to our Terms of Service and Privacy Policy
                </Text>
              </View>
            )}
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
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  connectedContainer: {
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  profileHandle: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
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
    marginTop: 4,
  },
  actionButtons: {
    width: '100%',
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#ff4757',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  disconnectText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#ff4757',
  },
  notConnectedContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff0050',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  connectButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#ffffff',
  },
  privacyText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default TikTokLoginModal; 