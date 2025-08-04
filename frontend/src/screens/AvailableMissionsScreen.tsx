import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Dimensions,
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants';
import { User, Campaign, CampaignFilters } from '../types';
import campaignService from '../services/campaignService';
import ResponsiveGrid from '../components/ResponsiveGrid';
import { useResponsive, GRID_CONFIG } from '../hooks/useResponsive';
import { useSubmissionRefresh } from '../contexts/SubmissionContext';

interface AvailableMissionsScreenProps {
  user: User;
  navigation?: any;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSignOut?: () => void;
  onMissionSelect?: (mission: Campaign) => void;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  streamerName: string;
  streamerAvatar?: string;
  reward: number;
  minViews: number;
  status: 'active' | 'completed' | 'expired';
  createdAt: string;
  deadline?: string;
}

const AvailableMissionsScreen: React.FC<AvailableMissionsScreenProps> = ({ 
  user, 
  navigation,
  onMissionSelect
}) => {
  const { triggerRefresh } = useSubmissionRefresh();
  const [missions, setAvailableMissions] = useState<Campaign[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Hook responsive pour gérer l'affichage
  const responsive = useResponsive();
  
  // États pour les filtres comme dans CampaignsListScreen
  const [filters, setFilters] = useState<CampaignFilters>({
    sortBy: 'new',
  });
  const [selectedPlatform, setSelectedPlatform] = useState<'twitch' | 'youtube'>('twitch');
  
  // États pour le modal de soumission de clip
  const [showClipModal, setShowClipModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Campaign | null>(null);
  const [clipUrl, setClipUrl] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scaleAnim = useState(new Animated.Value(0.8))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadAvailableMissions();
    console.log('🔍 USER ROLE CHECK:', user.role, user.email);
  }, [filters]);

  // Plus besoin de gérer les colonnes manuellement - ResponsiveGrid s'en charge

  const loadAvailableMissions = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading available missions...');
      
      // Retrieve all active campaigns from database with filters
      const campaigns = await campaignService.getCampaigns(filters);
      console.log('🔍 Available Missions retrieved with filters:', campaigns.length);
      
      // Use only real data from database
      console.log('🔍 Total missions from database:', campaigns.length);
      
      setAvailableMissions(campaigns);
    } catch (error) {
      console.error('Error loading missions:', error);
      Alert.alert('Error', 'Unable to load available missions');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAvailableMissions();
    setRefreshing(false);
  };

  const handleAcceptMission = (campaignId: string) => {
    Alert.alert(
      'Mission acceptée',
      'You have accepted this mission. You can now create clips for this campaign.',
      [{ text: 'OK' }]
    );
  };

  const handleOpenMissionDetails = (campaign: Campaign) => {
    console.log('🚀 Opening mission details for:', campaign.title);
    setSelectedMission(campaign);
    setShowClipModal(true);
    setModalVisible(true);
    
    // Animation d'entrée : vient vers nous avec un zoom
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCloseMissionDetails = () => {
    // No-op, as modal is removed
  };

  const handleSubmitClip = async () => {
    console.log('🚀 handleSubmitClip CALLED!');
    if (!clipUrl.trim()) {
      Alert.alert('Error', 'Please enter your clip URL');
      return;
    }

    if (!selectedMission) {
      Alert.alert('Error', 'No mission selected');
      return;
    }

    if (!clipUrl.includes('tiktok.com')) {
      Alert.alert('Error', 'Please enter a valid TikTok URL');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('🔍 USER DEBUG:', {
        userId: user.id,
        email: user.email,
        role: user.role
      });
      console.log('🔍 SUBMISSION DEBUG:', {
        clipperId: user.id,
        campaignId: selectedMission.id,
        url: clipUrl.trim()
      });
      console.log('🔵 Submitting clip for campaign:', selectedMission.id);
      console.log('🔵 Clip URL:', clipUrl);
      console.log('🔵 User ID:', user.id);

      const submission = await campaignService.submitClip(user.id, {
        campaignId: selectedMission.id,
        tiktokUrl: clipUrl.trim()
      });

      console.log('✅ Clip submitted successfully:', submission);
      console.log('🔍 SUBMISSION RESULT:', submission);
    
    Alert.alert(
        'Clip Submitted Successfully!',
        `Your clip has been submitted for mission: ${selectedMission.title}\n\nViews: ${submission.views.toLocaleString()}\nEarnings: $${submission.earnings.toFixed(2)}`,
        [{ 
          text: 'OK', 
          onPress: () => {
            handleCloseModal();
            // Rafraîchir les données après soumission
            loadAvailableMissions();
            // Déclencher un refresh global pour tous les écrans
            triggerRefresh();
          }
        }]
    );
    } catch (error) {
      console.error('❌ Error submitting clip:', error);
      Alert.alert(
        'Submission Error',
        error instanceof Error ? error.message : 'An error occurred while submitting your clip'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    console.log('🚀 Closing modal');
    // Animation de sortie : disparaît en s'éloignant
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowClipModal(false);
      setModalVisible(false);
      setClipUrl('');
      setSelectedMission(null);
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  // Plus besoin de ces fonctions - ResponsiveGrid gère tout automatiquement

  const renderMissionCard = (campaign: Campaign) => (
    <TouchableOpacity 
      key={campaign.id} 
      style={[
        styles.missionCard,
        {
          padding: responsive.getValue({
            mobile: 12,
            tablet: 14,
            desktop: 16,
            desktopLarge: 18
          }),
          minHeight: responsive.getValue({
            mobile: 200,
            tablet: 220,
            desktop: 240,
            desktopLarge: 260
          })
        }
      ]}
      onPress={() => {
        handleOpenMissionDetails(campaign);
      }}
      activeOpacity={0.8}
    >
      {/* Header with avatar à gauche, nom+badge+followers au centre, prix bleu à droite aligné avec l'avatar */}
      <View style={styles.cardHeaderTwitchLike}>
        {/* Avatar on the left */}
        {campaign.streamerAvatar ? (
          <Image 
            source={{ uri: campaign.streamerAvatar }} 
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={20} color={COLORS.primarySolid} />
          </View>
        )}
        {/* Block nom+badge+followers au centre */}
        <View style={styles.centerNameFollowersBlockk}>
          <View style={styles.nameAndBadgeContainerRefactored}>
            <Text
              style={styles.streamerName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {campaign.streamerName}
            </Text>
            <Image 
              source={require('../../assets/twitch-badge.png')} 
              style={styles.twitchBadge}
            />
          </View>
          <Text style={styles.streamerFollowersRefactored}>
            {campaign.streamerFollowers ? `${(campaign.streamerFollowers / 1000000).toFixed(1)}M followers` : 'Followers'}
          </Text>
        </View>
        {/* Add a clip button à droite, aligné avec l'avatar */}
        <TouchableOpacity 
          style={styles.participateButton}
          onPress={(e) => {
            e.stopPropagation();
            handleOpenMissionDetails(campaign);
          }}
        >
        <LinearGradient
            colors={['#ffffff', '#ffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
            style={styles.participateGradient}
          >
            <View style={styles.participateButtonContent}>
              <Image 
                source={require('../../assets/tiktok-logo.png')} 
                style={styles.twitchLogoButton}
              />
              <Text style={[styles.participateText, { color: '#363636' }]}>Add a clip</Text>
            </View>
        </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Mission thumbnail */}
      <View style={styles.thumbnailContainer}>
        <View style={styles.thumbnail}>
          {campaign.imageUrl ? (
            <Image 
              source={{ uri: campaign.imageUrl }} 
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Ionicons name="videocam" size={40} color="#999" />
              <Text style={styles.thumbnailText}>youtu.be</Text>
            </View>
          )}
        </View>
      </View>

      {/* Budget et progression */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.budgetText}>
            ${(campaign.totalSpent || 0).toFixed(2)} of ${campaign.budget.toFixed(2)}
          </Text>
          <Text style={styles.progressPercentage}>
            {Math.round((campaign.totalSpent || 0) / campaign.budget * 100)}%
          </Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressBar, { width: `${Math.min((campaign.totalSpent || 0) / campaign.budget * 100, 100)}%` }]} />
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Min view / video</Text>
            <Text style={styles.statValue}>{formatViews(campaign.criteria.minViews || 10000)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Views</Text>
            <Text style={styles.statValue}>{formatViews(campaign.totalViews || 0)}</Text>
          </View>
            <LinearGradient
            colors={['#4a5cf9', '#3c82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            style={styles.priceContainerRefactored}
          >
            <Text style={[styles.priceText, { color: '#FFFFFF' }]}>${(campaign.cpm / 10).toFixed(2)} / 1K</Text>
            </LinearGradient>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="refresh" size={40} color={COLORS.primarySolid} />
        <Text style={styles.loadingText}>Loading missions...</Text>
      </View>
    );
  }

  const renderClipModal = () => (
    <Modal
      visible={showClipModal}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCloseModal}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: opacityAnim }]}>
        <Animated.View style={[
          styles.modalContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }
        ]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submit Your Clip</Text>
            <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#8B8B8D" />
            </TouchableOpacity>
          </View>
          
          {selectedMission && (
            <View style={styles.missionInfo}>
              {/* Header de la mission */}
              <View style={styles.missionHeaderModal}>
                {selectedMission.streamerAvatar ? (
                  <Image 
                    source={{ uri: selectedMission.streamerAvatar }} 
                    style={styles.modalAvatar}
                  />
                ) : (
                  <View style={styles.modalAvatarPlaceholder}>
                    <Ionicons name="person" size={15} color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.missionDetails}>
                  <Text style={styles.modalStreamerName}>{selectedMission.streamerName}</Text>
                  <Text style={styles.modalMissionTitle}>{selectedMission.title}</Text>
                </View>
                <View style={styles.modalPriceContainer}>
                  <Text style={styles.modalPriceText}>${(selectedMission.cpm / 10).toFixed(2)} / 1K</Text>
                </View>
              </View>

              {/* Description de la mission */}
              <View style={styles.missionDescriptionSection}>
                <Text style={styles.missionDescriptionText}>{selectedMission.description}</Text>
              </View>

              {/* Progress bar du budget */}
              <View style={styles.budgetProgressSection}>
                <View style={styles.budgetProgressHeader}>
                  <Text style={styles.budgetProgressTitle}>Budget Progress</Text>
                  <Text style={styles.budgetProgressAmount}>${selectedMission.totalSpent.toFixed(2)} / ${selectedMission.budget.toFixed(2)}</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${Math.min((selectedMission.totalSpent / selectedMission.budget) * 100, 100)}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressPercentageText}>
                    {Math.round((selectedMission.totalSpent / selectedMission.budget) * 100)}%
                  </Text>
                </View>
              </View>

              {/* TikTok Clips Requirements */}
              <View style={styles.requirementsSection}>
                <Text style={styles.requirementsSectionTitle}>TikTok Clips Requirements</Text>
                
                <View style={styles.tiktokRequirementsContainer}>
                  <Text style={styles.tiktokRequirementsText}>
                    {selectedMission.criteria.style || "Create funny, engaging clips from the stream highlights. Focus on the most exciting moments and add trending music. Keep it authentic to my brand and make sure to capture the energy of the stream!"}
                  </Text>
                </View>

                <View style={styles.technicalRequirementsSection}>
                  <Text style={styles.technicalRequirementsTitle}>Technical Requirements</Text>
                  
                  <View style={styles.requirementRow}>
                    <Ionicons name="eye-outline" size={14} color="#8B8B8D" />
                    <Text style={styles.requirementLabel}>Min Views per Video:</Text>
                    <Text style={styles.requirementValue}>{(selectedMission.criteria.minViews / 1000).toFixed(0)}K</Text>
                  </View>

                  <View style={styles.requirementRow}>
                    <Ionicons name="cash-outline" size={14} color="#8B8B8D" />
                    <Text style={styles.requirementLabel}>Min Payout:</Text>
                    <Text style={styles.requirementValue}>${(selectedMission.cpm / 10 * selectedMission.criteria.minViews / 1000).toFixed(2)}</Text>
                  </View>

                  <View style={styles.requirementRow}>
                    <Ionicons name="trending-up-outline" size={14} color="#8B8B8D" />
                    <Text style={styles.requirementLabel}>Max Payout:</Text>
                    <Text style={styles.requirementValue}>${selectedMission.budget.toFixed(2)}</Text>
                  </View>

                  <View style={styles.requirementRow}>
                    <Ionicons name="time-outline" size={14} color="#8B8B8D" />
                    <Text style={styles.requirementLabel}>Duration:</Text>
                    <Text style={styles.requirementValue}>{selectedMission.criteria.duration}s</Text>
                  </View>

                  {selectedMission.platformLink && (
                    <View style={styles.requirementRow}>
                      <Ionicons name="link-outline" size={14} color="#8B8B8D" />
                      <Text style={styles.requirementLabel}>Source Link:</Text>
                      <TouchableOpacity onPress={() => Alert.alert('Link', selectedMission.platformLink || '')}>
                        <Text style={styles.requirementLink}>View Source</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedMission.criteria.hashtags && selectedMission.criteria.hashtags.length > 0 && (
                    <View style={styles.hashtagsSection}>
                      <Text style={styles.hashtagsTitle}>Required Hashtags:</Text>
                      <View style={styles.hashtagsContainer}>
                        {selectedMission.criteria.hashtags.map((hashtag, index) => (
                          <View key={index} style={styles.hashtagBadge}>
                            <Text style={styles.hashtagText}>#{hashtag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
          
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>TikTok Clip URL</Text>
            <TextInput
              style={styles.urlInput}
              value={clipUrl}
              onChangeText={setClipUrl}
              placeholder="https://tiktok.com/@username/video/..."
              placeholderTextColor="#8B8B8D"
              multiline={false}
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCloseModal}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
              onPress={handleSubmitClip}
              disabled={isSubmitting}
            >
            <LinearGradient
                colors={['#4a5cf9', '#3c82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
                style={styles.submitButtonGradient}
              >
                {isSubmitting ? (
                  <>
                    <Ionicons name="hourglass" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.submitButtonText}>Submitting...</Text>
                  </>
                ) : (
                  <>
                <Ionicons name="add" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.submitButtonText}>Submit Clip</Text>
                  </>
                )}
            </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Explore</Text>
      <View style={styles.mainContentContainer}>
        <View style={styles.header}>
          <View style={styles.allButtonsContainer}>
            {/* Platform buttons */}
            <View style={styles.platformButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.platformButton,
                  selectedPlatform === 'twitch' && styles.platformButtonActive,
                ]}
                onPress={() => {
                  setSelectedPlatform('twitch');
                  console.log('Twitch selected');
                }}
              >
                <Ionicons 
                  name="logo-twitch" 
                  size={24} 
                  color={selectedPlatform === 'twitch' ? "#FFFFFF" : "#8B8B8D"}
                />
                <Text style={[
                  styles.platformButtonText,
                  { color: selectedPlatform === 'twitch' ? '#FFFFFF' : '#8B8B8D' }
                ]}>
                  Twitch
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.platformButton,
                  selectedPlatform === 'youtube' && styles.platformButtonActiveYoutube,
                ]}
                onPress={() => {
                  setSelectedPlatform('youtube');
                  console.log('Youtube selected');
                }}
              >
                <Ionicons 
                  name="logo-youtube" 
                  size={24} 
                  color={selectedPlatform === 'youtube' ? "#FFFFFF" : "#8B8B8D"}
                />
                <Text style={[
                  styles.platformButtonText,
                  { color: selectedPlatform === 'youtube' ? '#FFFFFF' : '#8B8B8D' }
                ]}>
                  Youtube
                </Text>
              </TouchableOpacity>
        </View>

            {/* Sort picker */}
            <View style={styles.sortPickerContainer}>
              <Ionicons 
                name="time-outline" 
                size={15} 
                color="#8B8B8D" 
              />
              <Picker
                selectedValue={filters.sortBy}
                onValueChange={(itemValue) => setFilters({ ...filters, sortBy: itemValue })}
                style={styles.sortPicker}
              >
                <Picker.Item label="Most Recent" value="new" />
                <Picker.Item label="Most Views" value="popular" />
                <Picker.Item label="Most Budget" value="budget" />
              </Picker>
            </View>
            
            {/* Missions count */}
            <Text style={styles.missionsCountText}>
              {(() => {
                const filteredCount = missions.filter(campaign => {
                  const campaignPlatform = (campaign as any).platform || 'twitch';
                  return campaignPlatform === selectedPlatform && campaign.status !== 'pending_deletion';
                }).length;
                return `${filteredCount} mission${filteredCount > 1 ? 's' : ''} found`;
              })()}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading missions...</Text>
          </View>
        ) : missions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={80} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No missions available</Text>
            <Text style={styles.emptyText}>
              There are currently no active campaigns. Streamers haven't created missions yet.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
          <ResponsiveGrid
            minItemWidth={responsive.getValue({
              mobile: 280,
              tablet: 320,
              desktop: 340,
              desktopLarge: 360
            })}
            maxColumns={responsive.getValue(GRID_CONFIG.columns)}
            gap={responsive.getValue(GRID_CONFIG.gap)}
            style={{ paddingHorizontal: responsive.getValue(GRID_CONFIG.padding) }}
          >
            {missions
              .filter(campaign => {
                // Filtrer par plateforme et exclure les missions en suppression
                const campaignPlatform = (campaign as any).platform || 'twitch';
                return campaignPlatform === selectedPlatform && campaign.status !== 'pending_deletion';
              })
              .map(renderMissionCard)}
          </ResponsiveGrid>
      </ScrollView>
        )}
      </View>
      
      {renderClipModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.spacing.xl,
    paddingTop: 20,
    paddingBottom: 25,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 19,
    marginBottom: 4,
    marginTop: 4,
  },
  pageTitle: {
    fontSize: 14,
    fontFamily: 'Inter_18pt-Medium',
    color: '#e0e0e0',
    textAlign: 'center',
    marginTop: -28,
    marginBottom: 8,
  },
  mainContentContainer: {
    backgroundColor: '#181818',
    borderRadius: 20,
    margin: 9,
    padding: 12,
    flex: 1,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  allButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 12,
  },
  platformButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  platformButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2E',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3A3A3E',
    gap: 3,
  },
  platformButtonActive: {
    backgroundColor: '#9146FF',
    borderColor: '#9146FF',
  },
  platformButtonActiveYoutube: {
    backgroundColor: '#FF0000',
    borderColor: '#FF0000',
  },
  platformButtonText: {
    fontSize: 11,
    fontFamily: 'Inter_18pt-Medium',
    color: '#FFFFFF',
    fontWeight: '500',
  },
  sortPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38383A',
    paddingHorizontal: 12,
    paddingVertical: 2,
    gap: 6,
    minWidth: 140,
    maxWidth: 200,
    overflow: 'hidden',
  },
  sortPicker: {
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    flex: 1,
    borderWidth: 0,
    fontSize: 13,
    fontFamily: 'Inter_18pt-Medium',
    minHeight: 32,
  },
  missionsCountText: {
    fontSize: 14,
    color: '#8B8B8D',
    fontFamily: 'Inter_18pt-Medium',
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#363636',
    textAlign: 'center',
    lineHeight: 18,
  },
  titleContainer: {
    alignSelf: 'stretch',
    marginHorizontal: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: SIZES.spacing.xl,
  },
  titleGradient: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderBottomWidth: 1.5,
    borderBottomColor: '#d0d0d0',
  },
  titleContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 11,
    marginTop: 10,
    flexShrink: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  loadingText: {
    fontSize: 12,
    color: '#8B8B8D',
    fontFamily: FONTS.medium,
    marginTop: SIZES.spacing.base,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    marginTop: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.sm,
  },
  emptyText: {
    fontSize: 11,
    color: '#8B8B8D',
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: SIZES.spacing.xl,
  },
  // Plus besoin de missionsList - ResponsiveGrid gère tout
  missionCard: {
    backgroundColor: '#2A2A2E',
    borderRadius: 20,
    padding: 11,
    borderWidth: 1,
    borderColor: '#4A4A4E',
    minHeight: 225,
    width: '100%', // Prend toute la largeur allouée par ResponsiveGrid
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    transform: [{ translateY: -1 }],
    overflow: 'hidden',
  },
  cardHeader: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  streamerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2A2A2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#3A3A3E',
    overflow: 'hidden',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 50,
    marginRight: 10,
    flexShrink: 0,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#3A3A3E',
    overflow: 'hidden',
  },
  streamerTextContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  nameAndBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  streamerName: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    maxWidth: 150,
    overflow: 'hidden',
    flexShrink: 1,
  },
  streamerFollowers: {
    fontSize: 12,
    color: '#8B8B8D',
    fontFamily: FONTS.regular,
  },
  twitchBadge: {
    width: 12,
    height: 12,
    marginLeft: 4,
  },
  priceContainer: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    minWidth: 40,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: FONTS.bold,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 0, // empêche le rétrécissement du texte
  },
  thumbnailContainer: {
    marginBottom: 8,
  },
  thumbnail: {
    width: '100%',
    height: 125,
    backgroundColor: '#1A1A1E',
    borderRadius: 6,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2E',
  },
  thumbnailText: {
    fontSize: 9,
    color: '#8B8B8D',
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  missionTitle: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    marginBottom: 6,
    lineHeight: 16,
  },
  missionDescription: {
    fontSize: 10,
    color: '#8B8B8D',
    fontFamily: FONTS.regular,
    lineHeight: 13,
    marginBottom: 10,
  },
  paymentSection: {
    marginTop: 'auto',
  },
  paymentTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    marginBottom: 7,
  },
  paymentDetails: {
    gap: 5,
  },
  paymentAmount: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: FONTS.medium,
  },
  paymentRequirement: {
    fontSize: 11,
    color: '#8B8B8D',
    fontFamily: FONTS.regular,
    lineHeight: 14,
  },
  progressSection: {
    marginTop: 5,
    marginBottom: 5,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  budgetText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressBackground: {
    flex: 1,
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 5,
  },
  progressPercentage: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    fontWeight: 'semibold',
    color: '#8B8B8D',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  participateButton: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 15,
    overflow: 'hidden',
  },
  participateGradient: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderBottomWidth: 1.5,
    borderBottomColor: '#d0d0d0',
  },
  participateText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  participateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  twitchLogoButton: {
    width: 25,
    height: 25,
    marginRight: 4,
    resizeMode: 'contain',
  },
  cardHeaderRefactored: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  streamerColumn: {
    flex: 1,
    marginLeft: 10,
  },
  nameAndBadgeContainerRefactored: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  priceContainerRefactored: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'center',
    minWidth: 65,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamerFollowersRefactored: {
    fontSize: 12,
    color: '#8B8B8D',
    fontFamily: FONTS.regular,
    alignSelf: 'flex-start',
  },
  cardHeaderKaiLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  centerNameBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightPriceFollowers: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 65,
  },
  cardHeaderTwitchLike: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  centerNameFollowersBlockk: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: 8,
    minWidth: 0,
  },
  rowNameAndPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 0,
    gap: 16, // beaucoup plus d'espace pour éviter tout contact
  },
  
  // Styles pour le modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_18pt-SemiBold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  missionInfo: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2E',
  },
  missionHeaderModal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  modalAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  missionDetails: {
    flex: 1,
  },
  modalStreamerName: {
    fontSize: 14,
    fontFamily: 'Inter_18pt-SemiBold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  modalMissionTitle: {
    fontSize: 12,
    color: '#8B8B8D',
    fontFamily: 'Inter_18pt-Regular',
  },
  modalPriceContainer: {
    backgroundColor: '#4a5cf9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalPriceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_18pt-SemiBold',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter_18pt-Medium',
    marginBottom: 8,
  },
  urlInput: {
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#2A2A2E',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_18pt-Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2A2A2E',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#e3e3e3',
    fontSize: 14,
    fontFamily: 'Inter_18pt-Medium',
  },
  submitButton: {
    flex: 1,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_18pt-SemiBold',
  },
  
  // Nouveaux styles pour les sections du modal
  missionDescriptionSection: {
    marginBottom: 16,
  },
  missionDescriptionText: {
    fontSize: 12,
    color: '#8B8B8D',
    fontFamily: 'Inter_18pt-Regular',
    lineHeight: 16,
  },
  budgetProgressSection: {
    marginBottom: 16,
  },
  budgetProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetProgressTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter_18pt-Medium',
  },
  budgetProgressAmount: {
    fontSize: 12,
    color: '#8B8B8D',
    fontFamily: 'Inter_18pt-Regular',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#2A2A2E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4a5cf9',
    borderRadius: 4,
  },
  progressPercentageText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter_18pt-Medium',
    minWidth: 30,
    textAlign: 'right',
  },
  requirementsSection: {
    marginBottom: 8,
  },
  requirementsSectionTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter_18pt-SemiBold',
    marginBottom: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  requirementLabel: {
    flex: 1,
    fontSize: 12,
    color: '#8B8B8D',
    fontFamily: 'Inter_18pt-Regular',
  },
  requirementValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter_18pt-Medium',
  },
  requirementLink: {
    fontSize: 12,
    color: '#4a5cf9',
    fontFamily: 'Inter_18pt-Medium',
    textDecorationLine: 'underline',
  },
  hashtagsSection: {
    marginTop: 8,
  },
  hashtagsTitle: {
    fontSize: 12,
    color: '#8B8B8D',
    fontFamily: 'Inter_18pt-Regular',
    marginBottom: 6,
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  hashtagBadge: {
    backgroundColor: '#2A2A2E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hashtagText: {
    fontSize: 10,
    color: '#4a5cf9',
    fontFamily: 'Inter_18pt-Medium',
  },
  
  // Styles pour les TikTok requirements
  tiktokRequirementsContainer: {
    backgroundColor: '#2A2A2E',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4a5cf9',
  },
  tiktokRequirementsText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter_18pt-Regular',
    lineHeight: 16,
  },
  technicalRequirementsSection: {
    marginTop: 8,
  },
  technicalRequirementsTitle: {
    fontSize: 13,
    color: '#8B8B8D',
    fontFamily: 'Inter_18pt-Medium',
    marginBottom: 8,
  },
});

export default AvailableMissionsScreen; 