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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';
import { Campaign, CampaignFilters, User } from '../types';
import campaignService from '../services/campaignService';
import Button from '../components/Button';
import CampaignCard from '../components/CampaignCard';
import ResponsiveLayout from '../components/ResponsiveLayout';

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

  useEffect(() => {
    loadCampaigns();
  }, [filters]);

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

  const handleCampaignPress = (campaign: Campaign) => {
    console.log('Navigate to campaign:', campaign.id);
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

  const renderModernCampaignCard = ({ item, index }: { item: Campaign; index: number }) => (
    <TouchableOpacity
      style={[styles.missionCard, { marginTop: index === 0 ? 0 : 24 }]}
      onPress={() => handleCampaignPress(item)}
      activeOpacity={0.8}
    >
      {/* Header with avatar du streamer, nom et statut */}
      <View style={styles.cardHeaderTwitchLike}>
        {/* Avatar */}
        {item.streamerAvatar || user?.profileImage ? (
          <Image 
            source={{ uri: item.streamerAvatar || user?.profileImage }} 
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={20} color={COLORS.primarySolid} />
          </View>
        )}
        {/* Block nom+info au centre */}
        <View style={styles.centerNameFollowersBlockk}>
          <View style={styles.nameAndBadgeContainerRefactored}>
            <Text
              style={[styles.streamerName, { maxWidth: 200 }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.title}
            </Text>
          </View>
          <Text style={styles.streamerFollowersRefactored}>
            {item.status === 'active' ? 'Active' : 'Completed'}
          </Text>
        </View>
        {/* Status on the right */}
        <View style={[styles.priceContainerRefactored, {
          backgroundColor: item.status === 'active' ? '#4CAF50' : '#757575'
        }]}>
          <Text style={styles.priceText}>
            {item.submissions?.length || 0} clips
          </Text>
        </View>
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
              <Ionicons name="videocam" size={40} color="#999" />
              <Text style={styles.thumbnailText}>Mission Thumbnail</Text>
            </View>
          )}
        </View>
      </View>

      {/* Budget et progression */}
      <View style={styles.progressSection}>
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
            <Text style={styles.statLabel}>CPM</Text>
            <Text style={styles.statValue}>${(item.cpm / 10).toFixed(2)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Views</Text>
            <Text style={styles.statValue}>{formatViews(item.totalViews || 0)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.participateButton}
            onPress={(e) => {
              e.stopPropagation();
              handleCampaignPress(item);
            }}
          >
            <LinearGradient
              colors={['#faf9f0', '#e8e6d9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.participateGradient}
            >
              <Text style={styles.participateText}>Manage</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTitleContainer}>
        <LinearGradient
          colors={['#ffffff', '#ffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerTitleGradient}
        >
          <View style={styles.headerTitleContent}>
            <Text style={styles.headerTitle}>
              {user.role === 'streamer' ? 'My Campaigns' : 'Available Missions'}
            </Text>
            <Text style={styles.headerDescription}>
              {campaigns.length} mission{campaigns.length > 1 ? 's' : ''} found
            </Text>
          </View>
        </LinearGradient>
      </View>
      
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilters(true)}
      >
        <Ionicons name="options-outline" size={24} color="#6b7280" />
      </TouchableOpacity>

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

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
      <Ionicons 
        name={user.role === 'streamer' ? 'megaphone-outline' : 'search-outline'} 
        size={64} 
        color={COLORS.textLight} 
      />
      </View>
      <Text style={styles.emptyTitle}>
        {user.role === 'streamer' ? 'No campaigns created' : 'No missions available'}
      </Text>
      <Text style={styles.emptyText}>
        {user.role === 'streamer' 
          ? 'Create your first campaign to start attracting clippers'
          : 'No missions match your current criteria. Try modifying your filters.'
        }
      </Text>
      {user.role === 'streamer' && (
        <Button
          title="Create Campaign"
          onPress={handleCreateCampaign}
          style={styles.createButton}
        />
      )}
    </View>
  );

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
      {renderHeader()}
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <Ionicons name="refresh" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.loadingText}>Loading missions...</Text>
        </View>
      ) : campaigns.length > 0 ? (
      <FlatList
        data={campaigns}
          renderItem={renderModernCampaignCard}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
              tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
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
  );

  return campaignsContent;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginBottom: 32,
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
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderBottomWidth: 3,
    borderBottomColor: '#d0d0d0',
  },
  headerTitleContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 40,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#363636',
    textAlign: 'center',
    lineHeight: 36,
  },
  headerDescription: {
    fontSize: 24,
    fontFamily: FONTS.regular,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 20,
    flexShrink: 1,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  quickStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
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
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  quickStatValue: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  quickStatLabel: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  listContainer: {
    padding: 20,
  },
  modernCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    ...SHADOWS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  streamerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  streamerDetails: {
    flex: 1,
  },
  streamerName: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  platformText: {
    fontSize: 18,
    color: '#9146FF',
    fontFamily: FONTS.medium,
    marginLeft: 4,
  },
  budgetBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  budgetText: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  cardContent: {
    marginBottom: 16,
  },
  campaignTitle: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 32,
  },
  campaignDescription: {
    fontSize: 20,
    color: COLORS.textSecondary,
    lineHeight: 26,
    fontFamily: FONTS.regular,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontFamily: FONTS.medium,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 20,
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
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
    color: COLORS.textSecondary,
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
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  modalCancel: {
    fontSize: 22,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  modalTitle: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    color: COLORS.text,
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
    color: COLORS.text,
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
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  filterOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterOptionText: {
    fontSize: 22,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginLeft: 12,
  },
  filterOptionTextActive: {
    color: COLORS.white,
  },

  // Mission Cards Styles (same as DashboardScreen)
  missionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 28,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 450,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    transform: [{ translateY: -2 }],
    overflow: 'hidden',
  },
  cardHeaderTwitchLike: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 100,
    marginRight: 20,
    flexShrink: 0,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
    overflow: 'hidden',
  },
  centerNameFollowersBlockk: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: 16,
    minWidth: 0,
  },
  nameAndBadgeContainerRefactored: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  streamerFollowersRefactored: {
    fontSize: 24,
    color: '#6b7280',
    fontFamily: FONTS.regular,
    alignSelf: 'flex-start',
  },
  priceContainerRefactored: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'center',
    minWidth: 130,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E65100',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#FF8C42',
    borderBottomWidth: 3,
    borderBottomColor: '#E65100',
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontFamily: FONTS.bold,
    fontWeight: 'semibold',
    textAlign: 'center',
    flexShrink: 0,
  },
  thumbnailContainer: {
    marginBottom: 16,
  },
  thumbnail: {
    width: '100%',
    height: 250,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  thumbnailText: {
    fontSize: 18,
    color: '#6b7280',
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  progressSection: {
    marginTop: 10,
    marginBottom: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetText: {
    fontSize: 26,
    fontFamily: FONTS.medium,
    fontWeight: 'bold',
    color: '#374151',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBackground: {
    flex: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 10,
  },
  progressPercentage: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 26,
    fontFamily: FONTS.medium,
    fontWeight: 'semibold',
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    fontWeight: 'bold',
    color: '#374151',
  },
  participateButton: {
    shadowColor: '#faf9f0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  participateGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e6d9',
    borderBottomWidth: 3,
    borderBottomColor: '#e8e6d9',
  },
  participateText: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },
});

export default CampaignsListScreen; 