import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  LinearGradient,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants';
import { User, Campaign } from '../types';

const { width, height } = Dimensions.get('window');

interface MissionDetailScreenProps {
  user: User;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSignOut?: () => void;
  selectedMission?: Campaign | null;
}

const MissionDetailScreen: React.FC<MissionDetailScreenProps> = ({ 
  user, 
  activeTab = 'MissionDetail',
  onTabChange = () => {},
  onSignOut = () => {},
  selectedMission
}) => {
  const [isAccepted, setIsAccepted] = useState(false);
  const [clipUrl, setClipUrl] = useState('');

  const handleSubmitClip = () => {
    if (!clipUrl.trim()) {
      Alert.alert('Error', 'Please enter your clip URL');
      return;
    }
    
    Alert.alert(
      '🎬 Submit a clip',
      `Do you want to submit this clip?\n\nURL: ${clipUrl}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: () => {
          console.log('Clip submitted:', clipUrl);
          setClipUrl('');
          Alert.alert('✅ Success', 'Your clip has been submitted successfully!');
        }}
      ]
    );
  };

  const handleAcceptMission = () => {
    setIsAccepted(true);
    Alert.alert(
      '✅ Mission accepted!',
      'Congratulations! You can now create clips for this campaign.',
      [{ text: 'Perfect!', style: 'default' }]
    );
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  const formatViews = (views: number | undefined) => {
    if (views === undefined || views === null) return '0';
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  if (!selectedMission) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#E5E7EB" />
        </View>
        <Text style={styles.emptyTitle}>Mission not found</Text>
        <Text style={styles.emptySubtitle}>
          This mission no longer exists or has been deleted
        </Text>
        <TouchableOpacity 
          style={styles.backToAvailableMissionsButton}
                      onPress={() => onTabChange('AvailableMissions')}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backToAvailableMissionsText}>Back to missions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mission Details</Text>
        </View>

      {/* Hero Section with Streamer */}
      <View style={styles.heroSection}>
        <View style={styles.streamerCard}>
          <View style={styles.streamerHeader}>
            <View style={styles.streamerAvatar}>
              {selectedMission.streamerAvatar ? (
                <Image 
                  source={{ uri: selectedMission.streamerAvatar }} 
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={32} color="#fff" />
                </View>
              )}
              <View style={styles.onlineIndicator} />
            </View>
            <View style={styles.streamerInfo}>
              <View style={styles.streamerNameRow}>
                <Text style={styles.streamerName}>{selectedMission.streamerName}</Text>
                <Image 
                  source={require('../../assets/twitch-badge.png')} 
                  style={styles.twitchBadge}
                />
              </View>
              <Text style={styles.streamerFollowers}>125K followers</Text>
            </View>
            <View style={styles.budgetBadge}>
              <Text style={styles.budgetText}>{formatCurrency(selectedMission.budget)}</Text>
              <Text style={styles.budgetLabel}>Budget</Text>
            </View>
          </View>
        </View>

        {/* Mission Title Card */}
        <View style={styles.missionTitleCard}>
          <Text style={styles.missionTitle}>{selectedMission.title}</Text>
          <Text style={styles.missionDescription}>
            {selectedMission.description}
          </Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="eye" size={24} color="#3B82F6" />
          </View>
          <Text style={styles.statValue}>{formatViews(selectedMission.requiredViews)}</Text>
          <Text style={styles.statLabel}>Minimum Views</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="time" size={24} color="#10B981" />
          </View>
          <Text style={styles.statValue}>{selectedMission.clipDuration || 60}s</Text>
          <Text style={styles.statLabel}>Max duration</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="cash" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>{formatCurrency(selectedMission.cpm)}</Text>
          <Text style={styles.statLabel}>Per clip</Text>
        </View>
      </View>

      {/* Clip submission section */}
      <View style={styles.submissionSection}>
        <Text style={styles.sectionTitle}>🎬 Submit your clip</Text>
        
        <View style={styles.submissionCard}>
          <View style={styles.submissionHeader}>
            <Ionicons name="cloud-upload" size={28} color={COLORS.primary} />
            <View style={styles.submissionHeaderText}>
              <Text style={styles.submissionTitle}>Share your creation</Text>
              <Text style={styles.submissionSubtitle}>
                Earn {formatCurrency(selectedMission?.cpm || 0)} per validated clip
              </Text>
            </View>
          </View>

          <View style={styles.urlInputContainer}>
            <Text style={styles.inputLabel}>Your clip URL *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="link" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.urlInput}
                placeholder="https://youtube.com/shorts/..."
                placeholderTextColor={COLORS.textSecondary}
                value={clipUrl}
                onChangeText={setClipUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
            <Text style={styles.inputHint}>
              Paste the URL of your YouTube Shorts, TikTok or other platform clip
            </Text>
          </View>

          <TouchableOpacity 
            style={[
              styles.submitButton,
              !clipUrl.trim() && styles.submitButtonDisabled,
              clipUrl.trim() && styles.submitButtonActive
            ]}
            onPress={handleSubmitClip}
            disabled={!clipUrl.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>Submit a clip</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Detailed instructions */}
      <View style={styles.instructionsSection}>
        <Text style={styles.sectionTitle}>📋 Detailed instructions</Text>
        
        <View style={styles.instructionCard}>
          <View style={styles.instructionHeader}>
            <Ionicons name="play-circle" size={24} color="#8B5CF6" />
            <Text style={styles.instructionTitle}>Clip creation</Text>
          </View>
          <View style={styles.instructionContent}>
                          <Text style={styles.instructionText}>
                • Maximum duration: {selectedMission.clipDuration || 60} seconds
              </Text>
              <Text style={styles.instructionText}>
                • Required style: {selectedMission.criteria?.style || 'Dynamic and engaging'}
              </Text>
              <Text style={styles.instructionText}>
                • Minimum quality: 1080p recommended
              </Text>
          </View>
        </View>

        <View style={styles.instructionCard}>
          <View style={styles.instructionHeader}>
            <Ionicons name="trending-up" size={24} color="#10B981" />
            <Text style={styles.instructionTitle}>Performance objectives</Text>
          </View>
          <View style={styles.instructionContent}>
                          <Text style={styles.instructionText}>
                • Minimum {formatViews(selectedMission.requiredViews)} views to get paid
              </Text>
              <Text style={styles.instructionText}>
                • High engagement rate recommended
              </Text>
              <Text style={styles.instructionText}>
                • Publication within 48h after acceptance
              </Text>
          </View>
        </View>

        <View style={styles.instructionCard}>
          <View style={styles.instructionHeader}>
            <Ionicons name="pricetag" size={24} color="#F59E0B" />
            <Text style={styles.instructionTitle}>Hashtags and mentions</Text>
          </View>
          <View style={styles.instructionContent}>
                          <Text style={styles.instructionText}>
                • Use: {selectedMission.criteria?.hashtags?.join(', ') || '#klipz #gaming #twitch'}
              </Text>
              <Text style={styles.instructionText}>
                • Mention the streamer: @{selectedMission.streamerName}
              </Text>
              <Text style={styles.instructionText}>
                • Follow platform guidelines
              </Text>
          </View>
        </View>
      </View>

      {/* Platform Info */}
      <View style={styles.platformSection}>
        <Text style={styles.sectionTitle}>🎯 Target platform</Text>
        <View style={styles.platformCard}>
          <View style={styles.platformIcon}>
            <Ionicons name="logo-youtube" size={32} color="#FF0000" />
          </View>
          <View style={styles.platformInfo}>
            <Text style={styles.platformName}>YouTube Shorts</Text>
            <Text style={styles.platformDescription}>
              Vertical format, engaging content, short duration
            </Text>
          </View>
          <View style={styles.platformStats}>
            <Text style={styles.platformStatValue}>9:16</Text>
            <Text style={styles.platformStatLabel}>Ratio</Text>
          </View>
        </View>
      </View>

      {/* Bottom padding */}
      <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.spacing.xl,
    paddingBottom: 50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 42,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 22,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
  },
  backToAvailableMissionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF8C42',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E65100',
    shadowColor: '#E65100',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  backToAvailableMissionsText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    marginLeft: 12,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginBottom: SIZES.spacing.xl,
  },
  headerTitle: {
    fontSize: 50,
    fontFamily: FONTS.bold,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  heroSection: {
    paddingBottom: 24,
  },
  streamerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  streamerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streamerAvatar: {
    position: 'relative',
    marginRight: 16,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#fff',
  },
  streamerInfo: {
    flex: 1,
  },
  streamerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  streamerName: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#000000',
    marginRight: 8,
  },
  twitchBadge: {
    width: 20,
    height: 20,
  },
  streamerFollowers: {
    fontSize: 18,
    color: '#6B7280',
    fontFamily: FONTS.regular,
  },
  budgetBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
  },
  budgetText: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#fff',
  },
  budgetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.8,
  },
  missionTitleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  missionTitle: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    lineHeight: 40,
  },
  missionDescription: {
    fontSize: 20,
    color: '#6B7280',
    lineHeight: 28,
    fontFamily: FONTS.regular,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  submitButtonSection: {
    marginBottom: 24,
  },
  mainSubmitButton: {
    backgroundColor: '#FF8C42',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E65100',
    shadowColor: '#E65100',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    marginLeft: 12,
    alignItems: 'center',
  },
  submitButtonTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  submitButtonSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.9,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  statusSection: {
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#fff',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    lineHeight: 20,
  },
  acceptMissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 16,
  },
  acceptMissionText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginLeft: 8,
  },
  createClipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  createClipText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginLeft: 8,
  },
  instructionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 16,
  },
  instructionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginLeft: 12,
  },
  instructionContent: {
    paddingLeft: 36,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  platformSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  platformCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  platformIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  platformInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  platformDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  platformStats: {
    alignItems: 'center',
  },
  platformStatValue: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  platformStatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  finalActionSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  primaryActionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.lg,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    marginLeft: 12,
    alignItems: 'center',
  },
  actionButtonTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#fff',
    marginBottom: 2,
  },
  actionButtonSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  bottomPadding: {
    height: 40,
  },
  // Styles pour la section de soumission
  submissionSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  submissionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    ...SHADOWS.md,
  },
  submissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  submissionHeaderText: {
    marginLeft: 16,
    flex: 1,
  },
  submissionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  submissionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  urlInputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  urlInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 12,
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 16,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  submitButtonActive: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#fff',
    marginLeft: 8,
  },
});

export default MissionDetailScreen; 