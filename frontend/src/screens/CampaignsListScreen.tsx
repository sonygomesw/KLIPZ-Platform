import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';
import { Campaign, CampaignFilters, User } from '../types';
import campaignService from '../services/campaignService';
import Button from '../components/Button';
import CampaignCard from '../components/CampaignCard';
import ResponsiveLayout from '../components/ResponsiveLayout';
import ResponsiveGrid from '../components/ResponsiveGrid';
import { useResponsive, GRID_CONFIG } from '../hooks/useResponsive';
import CampaignDetailScreen from './CampaignDetailScreen';

const { width } = Dimensions.get('window');

interface CampaignsListScreenProps {
  user: User;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSignOut?: () => void;
}

const CampaignsListScreen: React.FC<CampaignsListScreenProps> = ({ 
  user, 
  activeTab = 'Campaigns',
  onTabChange = () => {},
  onSignOut = () => {}
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CampaignFilters>({
    sortBy: 'new',
  });
  
  // État pour la plateforme sélectionnée
  const [selectedPlatform, setSelectedPlatform] = useState<'twitch' | 'youtube'>('twitch');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  
  // Hook responsive pour le système de grille
  const responsive = useResponsive();
  
  // Responsive logic removed - ResponsiveGrid handles this now

  useEffect(() => {
    loadCampaigns();
  }, [filters]);

  useEffect(() => {
    const handleResize = () => {
      const width = Dimensions.get('window').width;
      let newColumns = 3;
      if (width < 1600) {
        newColumns = 1;
      } else if (width < 2200) {
        newColumns = 2;
      } else {
        newColumns = 3;
      }
      // This useEffect is no longer needed as ResponsiveGrid handles column logic
    };
    handleResize();
    const subscription = Dimensions.addEventListener('change', handleResize);
    return () => subscription?.remove();
  }, []); // Removed numColumns from dependency array

  const loadCampaigns = async () => {
    try {
      console.log('🔍 CampaignsListScreen - Starting to load campaigns');
      console.log('🔍 CampaignsListScreen - User:', { id: user.id, role: user.role });
      
      setIsLoading(true);
      let campaignsData: Campaign[];
      
      if (user.role === 'streamer') {
        console.log('🔍 CampaignsListScreen - Loading streamer campaigns');
        campaignsData = await campaignService.getStreamerCampaigns(user.id);
        console.log('🔍 CampaignsListScreen - Streamer campaigns retrieved:', campaignsData.length);
      } else {
        console.log('🔍 CampaignsListScreen - Loading all campaigns');
        campaignsData = await campaignService.getCampaigns(filters);
        console.log('🔍 CampaignsListScreen - All campaigns retrieved:', campaignsData.length);
      }
      
      console.log('🔍 CampaignsListScreen - Campaigns to set:', campaignsData);
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('❌ CampaignsListScreen - Error loading campaigns:', error);
      Alert.alert('Error', 'Unable to load campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCampaigns();
    setRefreshing(false);
  };

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const handleCampaignPress = (campaign: Campaign) => {
    console.log('Navigate to campaign:', campaign.id);
    setSelectedCampaign(campaign);
  };

  const handleBackToCampaigns = async () => {
    setSelectedCampaign(null);
    // Déclencher un refresh visuel
    setRefreshing(true);
    // Recharger les campagnes pour voir les changements
    await loadCampaigns();
    setRefreshing(false);
  };

  const handleCreateCampaign = () => {
    onTabChange('CreateCampaign');
  };

  const applyFilters = (newFilters: CampaignFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
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



  // Fonctions pour calculer la largeur des cartes (comme dans AvailableMissionsScreen)
  // These functions are no longer needed as ResponsiveGrid handles this
  const getCardWidth = () => {
    // This function is no longer needed
    return '100%'; // 1 colonne : pleine largeur
  };

  const getNameMaxWidth = () => {
    // This function is no longer needed
    return 600;
  };

  const getCardPaddingHorizontal = () => {
    // This function is no longer needed
    return 32;
  };

  const getCardMaxWidth = () => {
    // This function is no longer needed
    return 'none';
  };

  const renderModernCampaignCard = ({ item, index }: { item: Campaign; index: number }) => (
    <TouchableOpacity
      style={[
        styles.missionCard,
        {
          width: '100%', // ResponsiveGrid gère la largeur
          paddingHorizontal: 16,
          marginTop: 12
        }
      ]}
      onPress={() => handleCampaignPress(item)}
      activeOpacity={0.8}
    >
      {/* Header with avatar à gauche, nom+badge+followers au centre, prix bleu à droite aligné avec l'avatar */}
      <View style={styles.cardHeaderTwitchLike}>
        {/* Avatar on the left */}
        {item.streamerAvatar ? (
          <Image 
            source={{ uri: item.streamerAvatar }} 
            style={styles.avatar as any}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={10} color={COLORS.primarySolid} /> // Réduit de 20 à 10
          </View>
        )}
        {/* Block nom+badge+followers au centre */}
        <View style={styles.centerNameFollowersBlockk}>
          <View style={styles.nameAndBadgeContainerRefactored}>
            <Text
              style={[styles.streamerName, { maxWidth: getNameMaxWidth() }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.streamerName}
            </Text>
            <Image 
              source={require('../../assets/twitch-badge.png')} 
              style={styles.twitchBadge}
            />
          </View>
          <Text style={styles.streamerFollowersRefactored}>
            {item.status === 'active' ? 'Active Campaign' : 'Completed'}
          </Text>
        </View>
        {/* Manage button à droite */}
        <TouchableOpacity 
          style={styles.participateButton}
          onPress={(e) => {
            e.stopPropagation();
            handleCampaignPress(item);
          }}
        >
          <View style={styles.participateGradient}>
            <View style={styles.participateButtonContent}>
              {(() => {
                const campaignPlatform = (item as any).platform || 'twitch';
                if (campaignPlatform === 'youtube') {
                  return (
                    <Ionicons 
                      name="logo-youtube" 
                      size={16} 
                      color="#ffffff" 
                    />
                  );
                } else {
                  return (
                    <Image 
                      source={require('../../assets/twitch-logo.jpg')} 
                      style={styles.twitchLogoButton}
                    />
                  );
                }
              })()}
              <Text style={[styles.participateText, { color: '#ffffff' }]}>Manage</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Mission thumbnail */}
      <View style={styles.thumbnailContainer}>
        <View style={styles.thumbnail}>
          {item.imageUrl ? (
            <Image 
              source={{ uri: item.imageUrl }} 
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Ionicons name="videocam" size={20} color="#999" /> // Réduit de 40 à 20
              <Text style={styles.thumbnailText}>Campaign Preview</Text>
            </View>
          )}
        </View>
      </View>

      {/* Budget et progression */}
      <View style={styles.progressSection}>
        {/* Nom de la mission */}
        <Text style={styles.missionTitle}>{item.title}</Text>
        <View style={styles.progressHeader}>
          <Text style={styles.budgetText}>
            ${(item.totalSpent || 0).toFixed(2)} of ${item.budget.toFixed(2)}
          </Text>
          <Text style={styles.progressPercentage}>
            {Math.round((item.totalSpent || 0) / item.budget * 100)}%
          </Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressBar, { width: `${Math.min((item.totalSpent || 0) / item.budget * 100, 100)}%` }]} />
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Min views / video</Text>
            <Text style={styles.statValue}>{formatViews(item.criteria.minViews || 10000)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Views</Text>
            <Text style={styles.statValue}>{formatViews(item.totalViews || 0)}</Text>
          </View>
          <LinearGradient
            colors={['#4a5cf9', '#3c82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.priceContainerRefactored}
          >
            <Text style={[styles.priceText, { color: '#FFFFFF' }]}>${(item.cpm / 10).toFixed(2)} / 1K</Text>
          </LinearGradient>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      
      {/* Platform buttons, sort picker and missions count on same line */}
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
              console.log('Youtubeur selected');
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

        {/* Filter group container for both sort and status */}
        <View style={styles.filtersGroupContainer}>
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

          {/* Status filter */}
          <View style={styles.statusFilterContainer}>
            <Ionicons 
              name="checkmark-circle-outline" 
              size={15} 
              color="#8B8B8D" 
            />
            <Picker
              selectedValue={selectedStatus}
              onValueChange={(itemValue) => setSelectedStatus(itemValue)}
              style={styles.statusPicker}
            >
                          <Picker.Item label="Active missions" value="active" />
            <Picker.Item label="Completed missions" value="completed" />
            <Picker.Item label="Pending deletion" value="pending_deletion" />
            </Picker>
          </View>
        </View>
        
        {/* Missions count - positioned at far right */}
        <Text style={styles.missionsCountText}>
          {(() => {
            const filteredCount = campaigns.filter(campaign => {
              const campaignPlatform = (campaign as any).platform || 'twitch';
              return campaignPlatform === selectedPlatform && campaign.status === selectedStatus;
            }).length;
            return `${filteredCount} mission${filteredCount > 1 ? 's' : ''} found`;
          })()}
        </Text>
      </View>
      


      {user.role === 'clipper' && (
        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <View style={styles.quickStatIcon}>
              <Ionicons name="trophy" size={20} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.quickStatValue}>$0.00</Text>
              <Text style={styles.quickStatLabel}>Total Earnings</Text>
            </View>
          </View>
          <View style={styles.quickStatItem}>
            <View style={styles.quickStatIcon}>
              <Ionicons name="videocam" size={20} color="#8B5CF6" />
            </View>
            <View>
              <Text style={styles.quickStatValue}>0</Text>
              <Text style={styles.quickStatLabel}>Clips créés</Text>
            </View>
          </View>
          <View style={styles.quickStatItem}>
            <View style={styles.quickStatIcon}>
              <Ionicons name="flash" size={20} color="#10B981" />
            </View>
            <View>
              <Text style={styles.quickStatValue}>0</Text>
              <Text style={styles.quickStatLabel}>Pending</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => {
    // Messages spécifiques selon le statut sélectionné
    const getEmptyStateContent = () => {
      if (selectedStatus === 'pending_deletion') {
        return {
          icon: 'trash-outline',
          title: 'No missions pending deletion',
          text: 'No missions are currently scheduled for deletion. Missions appear here when they have pending submissions and need to wait before being permanently deleted.'
        };
      } else if (selectedStatus === 'completed') {
        return {
          icon: 'checkmark-circle-outline',
          title: 'No completed missions',
          text: user.role === 'streamer' 
            ? 'No missions have been completed yet. Missions appear here once they reach their funding goal or deadline.'
            : 'No completed missions available. Check back later for finished campaigns.'
        };
      } else {
        return {
          icon: user.role === 'streamer' ? 'megaphone-outline' : 'search-outline',
          title: user.role === 'streamer' ? 'No active campaigns' : 'No active missions',
          text: user.role === 'streamer' 
            ? 'Create your first campaign to start attracting clippers'
            : 'No active missions available. Try checking other platforms or statuses.'
        };
      }
    };

    const { icon, title, text } = getEmptyStateContent();

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <Ionicons 
            name={icon as any} 
            size={64} 
            color={COLORS.textLight} 
          />
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyText}>{text}</Text>
        {user.role === 'streamer' && selectedStatus === 'active' && (
          <Button
            title="Create Campaign"
            onPress={handleCreateCampaign}
            style={styles.createButton}
          />
        )}
      </View>
    );
  };

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filtres</Text>
          <TouchableOpacity onPress={() => applyFilters(filters)}>
            <Text style={styles.modalApply}>Appliquer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Trier par</Text>
          <View style={styles.filterOptions}>
            {[
                { key: 'new', label: 'Most Recent', icon: 'time-outline' },
                { key: 'popular', label: 'Most Popular', icon: 'trending-up-outline' },
                { key: 'budget', label: 'Budget élevé', icon: 'cash-outline' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterOption,
                  filters.sortBy === option.key && styles.filterOptionActive,
                ]}
                onPress={() => setFilters({ ...filters, sortBy: option.key as any })}
              >
                  <Ionicons 
                    name={option.icon as any} 
                    size={20} 
                    color={filters.sortBy === option.key ? COLORS.white : COLORS.textSecondary} 
                  />
                <Text
                  style={[
                    styles.filterOptionText,
                    filters.sortBy === option.key && styles.filterOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {user.role === 'clipper' && (
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Budget</Text>
            <View style={styles.filterOptions}>
              {[
                  { key: 'all', label: 'All Budgets', min: undefined, max: undefined, icon: 'infinite-outline' },
                  { key: 'low', label: 'Less than $200', min: undefined, max: 200, icon: 'cash-outline' },
                  { key: 'medium', label: '$200 - $500', min: 200, max: 500, icon: 'card-outline' },
                  { key: 'high', label: 'More than $500', min: 500, max: undefined, icon: 'diamond-outline' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    filters.minBudget === option.min && filters.maxBudget === option.max && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilters({ 
                    ...filters, 
                    minBudget: option.min, 
                    maxBudget: option.max 
                  })}
                >
                    <Ionicons 
                      name={option.icon as any} 
                      size={20} 
                      color={filters.minBudget === option.min && filters.maxBudget === option.max ? COLORS.white : COLORS.textSecondary} 
                    />
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.minBudget === option.min && filters.maxBudget === option.max && styles.filterOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const campaignsContent = (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>My Missions</Text>
      <View style={styles.mainContentContainer}>
        {renderHeader()}
        
        {isLoading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <Ionicons name="refresh" size={32} color="#fff" />
          </View>
          <Text style={styles.loadingText}>Loading missions...</Text>
        </View>
      ) : campaigns.length > 0 ? (
        <>
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
              {campaigns
                .filter(campaign => {
                  // Filtrer par plateforme et statut
                  const campaignPlatform = (campaign as any).platform || 'twitch';
                  return campaignPlatform === selectedPlatform && campaign.status === selectedStatus;
                })
                .map((campaign, index) => renderModernCampaignCard({ item: campaign, index }))}
            </ResponsiveGrid>
          </ScrollView>
        </>
      ) : (
        renderEmptyState()
      )}

      {user.role === 'streamer' && (
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={handleCreateCampaign}
          >
            <Ionicons name="add" size={28} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      )}

      {renderFiltersModal()}
      </View>
    </View>
  );

  // Si une campagne est sélectionnée, afficher la page de détail
  if (selectedCampaign) {
    return (
      <CampaignDetailScreen
        user={user}
        campaign={selectedCampaign}
        onBack={handleBackToCampaigns}
        onTabChange={onTabChange}
      />
    );
  }

  // Sinon, afficher la liste des campagnes
  return campaignsContent;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
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
    borderRadius: 12,
    margin: 9,
    padding: 12,
    flex: 1,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 19,
    marginBottom: 4,
    marginTop: 4,
  },
  allButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 12,
  },
  filtersGroupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  headerTitleContainer: {
    alignSelf: 'stretch',
    marginHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 32,
  },
  headerTitleGradient: {
    paddingHorizontal: 25,
    paddingVertical: 20,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#2A2A2E',
    borderBottomWidth: 3,
    borderBottomColor: '#1A1A1E',
    backgroundColor: '#1A1A1E',
  },
  headerTitleContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22, // Réduit de 40 à 20
    fontFamily: 'Inter_18pt-SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 18, // Réduit de 36 à 18
  },
  headerDescription: {
    fontSize: 14, // Réduit de 24 à 12
    fontFamily: 'Inter_18pt-Regular',
    color: '#8B8B8D',
    textAlign: 'center',
    lineHeight: 11, // Réduit de 22 à 11
    marginTop: 14, // Réduit de 20 à 10
    flexShrink: 1,
  },
  filterButton: {
    width: 22, // Réduit de 44 à 22
    height: 22, // Réduit de 44 à 22
    borderRadius: 11, // Réduit de 22 à 11
    backgroundColor: '#2A2A2E',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 10, // Réduit de 20 à 10
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6, // Réduit de 12 à 6
    marginBottom: 10, // Réduit de 20 à 10
    paddingHorizontal: 8, // Réduit de 16 à 8
  },
  platformButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8, // Réduit de 16 à 8
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
    backgroundColor: '#9146FF', // Couleur Twitch par défaut
    borderColor: '#9146FF',
  },
  platformButtonActiveYoutube: {
    backgroundColor: '#FF0000', // Couleur YouTube
    borderColor: '#FF0000',
  },
  platformButtonText: {
    fontSize: 11,
    fontFamily: 'Inter_18pt-Medium',
    color: '#FFFFFF',
    fontWeight: '500',
  },
  filterOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5, // Réduit de 10 à 5
    paddingHorizontal: 8, // Réduit de 16 à 8
    borderRadius: 8, // Réduit de 16 à 8
    backgroundColor: '#2A2A2E',
    borderWidth: 1,
    borderColor: '#3A3A3E',
    gap: 3, // Réduit de 6 à 3
    marginLeft: 4,
  },
  filterOptionButtonActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterOptionButtonText: {
    fontSize: 13, // Réduit de 26 à 13
    fontFamily: 'Inter_18pt-Medium',
    color: '#8B8B8D',
    marginLeft: 4,
  },
  filterOptionButtonTextActive: {
    color: '#FFFFFF',
  },
  platformAndSortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, // Réduit de 24 à 12
    paddingHorizontal: 16, // Réduit de 32 à 16
  },
  sortButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sortButtonsScrollContent: {
    paddingRight: 16, // Réduit de 32 à 16
    gap: 8, // Réduit de 16 à 8
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8, // Réduit de 12 à 8
    paddingVertical: 6, // Réduit de 8 à 6
    backgroundColor: '#0A0A0A',
    borderRadius: 6, // Réduit de 8 à 6
    borderWidth: 1,
    borderColor: '#2A2A2E',
    gap: 3, // Réduit de 4 à 3
  },
  sortButtonActive: {
    backgroundColor: '#4F46E5',
  },
  sortButtonText: {
    color: '#8B8B8D',
    fontSize: 13, // Réduit de 14 à 12
    fontFamily: 'Inter_18pt-Medium',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
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
    minWidth: 120,
    maxWidth: 160,
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

  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  quickStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181818',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  quickStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  quickStatValue: {
    fontSize: 12, // Réduit de 24 à 12
    fontFamily: 'Inter_18pt-SemiBold',
    color: '#FFFFFF',
  },
  quickStatLabel: {
    fontSize: 9, // Réduit de 18 à 9
    color: '#8B8B8D',
    fontFamily: 'Inter_18pt-Regular',
  },
  listContainer: {
    padding: 10, // Réduit de 20 à 10
  },
  modernCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8, // Réduit de 16 à 8
    padding: 10, // Réduit de 20 à 10
    ...SHADOWS.lg,
    borderWidth: 1,
    borderColor: '#2A2A2E',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Réduit de 16 à 8
  },
  streamerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 24, // Réduit de 48 à 24
    height: 24, // Réduit de 48 à 24
    borderRadius: 12, // Réduit de 24 à 12
    backgroundColor: '#0052FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6, // Réduit de 12 à 6
  },
  streamerDetails: {
    flex: 1,
  },
  streamerName: {
    fontSize: 12, // Réduit de 24 à 12
    fontFamily: 'Inter_18pt-SemiBold',
    color: '#FFFFFF',
    marginBottom: 2, // Réduit de 4 à 2
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2E',
    paddingHorizontal: 4, // Réduit de 8 à 4
    paddingVertical: 2, // Réduit de 4 à 2
    borderRadius: 6, // Réduit de 12 à 6
    alignSelf: 'flex-start',
  },
  platformText: {
    fontSize: 9, // Réduit de 18 à 9
    color: '#9146FF',
    fontFamily: 'Inter_18pt-Medium',
    marginLeft: 2, // Réduit de 4 à 2
  },
  budgetBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6, // Réduit de 12 à 6
    paddingVertical: 3, // Réduit de 6 à 3
    borderRadius: 10, // Réduit de 20 à 10
  },
  budgetText: {
    fontSize: 11, // Réduit de 22 à 11
    fontFamily: 'Inter_18pt-SemiBold',
    color: '#FFFFFF',
  },
  cardContent: {
    marginBottom: 8, // Réduit de 16 à 8
  },
  campaignTitle: {
    fontSize: 13, // Réduit de 26 à 13
    fontFamily: 'Inter_18pt-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4, // Réduit de 8 à 4
    lineHeight: 16, // Réduit de 32 à 16
  },
  campaignDescription: {
    fontSize: 10, // Réduit de 20 à 10
    color: '#8B8B8D',
    lineHeight: 13, // Réduit de 26 à 13
    fontFamily: 'Inter_18pt-Regular',
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2E',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 9, // Réduit de 18 à 9
    color: '#8B8B8D',
    marginLeft: 2, // Réduit de 4 à 2
    fontFamily: 'Inter_18pt-Medium',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 4, // Réduit de 8 à 4
    height: 4, // Réduit de 8 à 4
    borderRadius: 2, // Réduit de 4 à 2
    marginRight: 3, // Réduit de 6 à 3
  },
  statusText: {
    fontSize: 10, // Réduit de 20 à 10
    color: '#8B8B8D',
    fontFamily: 'Inter_18pt-Medium',
  },
  actionButton: {
    backgroundColor: '#0052FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8, // Réduit de 16 à 8
    paddingVertical: 5, // Réduit de 10 à 5
    borderRadius: 10, // Réduit de 20 à 10
  },
  actionButtonText: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginRight: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8B8B8D',
    fontFamily: FONTS.regular,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2A2A2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8B8B8D',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  createButton: {
    minWidth: 200,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  floatingButton: {
    backgroundColor: COLORS.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.xl,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2E',
    backgroundColor: '#1A1A1E',
  },
  modalCancel: {
    fontSize: 22,
    color: '#8B8B8D',
    fontFamily: FONTS.regular,
  },
  modalTitle: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  modalApply: {
    fontSize: 22,
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  modalContent: {
    flex: 1,
  },
  filterSection: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  filterOptions: {
    gap: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1A1A1E',
    borderWidth: 2,
    borderColor: '#2A2A2E',
  },
  filterOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterOptionText: {
    fontSize: 22,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  filterOptionTextActive: {
    color: COLORS.white,
  },

  // Mission Cards Styles (same as DashboardScreen)
  missionCard: {
    backgroundColor: '#2A2A2E',
    borderRadius: 20,
    padding: 11,
    borderWidth: 1,
    borderColor: '#4A4A4E',
    minHeight: 169,
    marginBottom: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    transform: [{ translateY: -1 }],
    overflow: 'hidden',
  },
  cardHeaderTwitchLike: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // Réduit de 16 à 8
  },
  avatar: {
    width: 50, // Réduit de 100 à 50
    height: 50, // Réduit de 100 à 50
    borderRadius: 50, // Réduit de 100 à 50
    marginRight: 10, // Réduit de 20 à 10
    flexShrink: 0,
    elevation: 2, // Réduit de 4 à 2
    borderWidth: 1, // Réduit de 2 à 1
    borderColor: '#ffffff',
    overflow: 'hidden',
  },
  centerNameFollowersBlockk: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: 0, // Réduit de 16 à 8
    minWidth: 0,
  },
  nameAndBadgeContainerRefactored: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1, // Réduit de 2 à 1
  },
  streamerFollowersRefactored: {
    fontSize: 12, // Réduit de 24 à 12
    color: '#afafaf',
    fontFamily: 'Inter_18pt-Regular',
    alignSelf: 'flex-start',
  },
  priceContainerRefactored: {
    paddingHorizontal: 8, // Réduit de 16 à 8
    paddingVertical: 5, // Réduit de 10 à 5
    borderRadius: 5, // Réduit de 10 à 5
    alignSelf: 'center',
    minWidth: 50, // Réduit de 100 à 50
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4a5cf9',
    shadowOffset: { width: 0, height: 1 }, // Réduit de 2 à 1
    shadowOpacity: 0.2,
    shadowRadius: 2, // Réduit de 4 à 2
    elevation: 2, // Réduit de 4 à 2
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 13, // Réduit de 26 à 13
    fontFamily: 'Inter_18pt-SemiBold',
    fontWeight: 'semibold',
    textAlign: 'center',
    flexShrink: 0,
  },
  thumbnailContainer: {
    marginBottom: 8, // Réduit de 16 à 8
  },
  thumbnail: {
    width: '100%',
    height: 125, // Réduit de 250 à 125
    backgroundColor: '#2A2A2E',
    borderRadius: 6, // Réduit de 12 à 6
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4, // Réduit de 8 à 4
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2E',
  },
  thumbnailText: {
    fontSize: 9, // Réduit de 18 à 9
    color: '#8B8B8D',
    fontFamily: 'Inter_18pt-Regular',
    marginTop: 2, // Réduit de 4 à 2
  },
  progressSection: {
    marginTop: 5, // Réduit de 10 à 5
    marginBottom: 5, // Réduit de 10 à 5
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6, // Réduit de 12 à 6
  },
  budgetText: {
    fontSize: 13, // Réduit de 26 à 13
    fontFamily: 'Inter_18pt-Medium',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // Réduit de 12 à 6
  },
  progressBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#3A3A3E',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 3,
    minWidth: 2, // Assure une largeur minimale visible
  },
  progressPercentage: {
    fontSize: 13, // Réduit de 26 à 13
    fontFamily: 'Inter_18pt-SemiBold',
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8, // Réduit de 16 à 8
    paddingTop: 8, // Réduit de 16 à 8
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13, // Réduit de 26 à 13
    fontFamily: 'Inter_18pt-Medium',
    fontWeight: 'semibold',
    color: '#8B8B8D',
    marginBottom: 2, // Réduit de 4 à 2
  },
  statValue: {
    fontSize: 13, // Réduit de 26 à 13
    fontFamily: 'Inter_18pt-SemiBold',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  participateButton: {
    overflow: 'hidden',
    marginLeft: 8,
  },
  participateGradient: {
    paddingHorizontal: 8, // Réduit de 16 à 8
    paddingVertical: 6, // Réduit de 12 à 6
    borderRadius: 10, // Réduit de 12 à 6
    borderWidth: 1,
    borderColor: '#4A4A4E',
    backgroundColor: '#3A3A3E',
  },
  participateText: {
    fontSize: 12, // Réduit de 24 à 12
    fontFamily: 'Inter_18pt-SemiBold',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  twitchBadge: {
    width: 10, // Réduit de 20 à 10
    height: 10, // Réduit de 20 à 10
    marginLeft: 3, // Réduit de 6 à 3
  },
  participateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  twitchLogoButton: {
    width: 25, // Réduit de 50 à 25
    height: 25, // Réduit de 50 à 25
    marginRight: 4, // Réduit de 8 à 4
    borderRadius: 2, // Réduit de 4 à 2
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  missionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 8,
    minWidth: 0,
  },
  missionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Inter_18pt-SemiBold',
  },
  
  // Styles pour les filtres de statut (identique à sortPickerContainer)
  statusFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38383A',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 6,
    minWidth: 120,
    maxWidth: 160,
    overflow: 'hidden',
  },
  statusPicker: {
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    flex: 1,
    borderWidth: 0,
    fontSize: 13,
    fontFamily: 'Inter_18pt-Medium',
  },
});

export default CampaignsListScreen; 