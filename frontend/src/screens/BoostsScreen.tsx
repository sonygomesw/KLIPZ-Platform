import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';
import { Campaign } from '../types';
import { AuthUser } from '../services/authService';
import campaignService from '../services/campaignService';
import CampaignCard from '../components/CampaignCard';
import { useUserRole } from '../contexts/UserContext';

interface BoostsScreenProps {
  user?: AuthUser;
  navigation?: any;
}

const BoostsScreen: React.FC<BoostsScreenProps> = ({ user, navigation }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'trending' | 'new' | 'high-budget'>('all');
  const { userRole: contextUserRole } = useUserRole();
  const userRole = user?.role || contextUserRole;
  



  // Boosted campaigns will be loaded from Supabase
  const [boostedCampaigns, setBoostedCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      // Load campaigns from Supabase
      const campaignsData = await campaignService.getCampaigns();
      setCampaigns(campaignsData);
      setBoostedCampaigns(campaignsData);
    } catch (error) {
      console.error('Error loading boosted campaigns:', error);
      Alert.alert('Error', 'Unable to load boosted campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCampaigns();
    setRefreshing(false);
  };

  const getFilteredCampaigns = () => {
    switch (activeFilter) {
      case 'trending':
        return campaigns.filter(c => c.totalViews > 200000);
      case 'new':
        return campaigns.filter(c => {
          const daysSinceCreation = (Date.now() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceCreation < 3;
        });
      case 'high-budget':
        return campaigns.filter(c => c.budget > 100);
      default:
        return campaigns;
    }
  };

  const handleCampaignPress = (campaign: Campaign) => {
    if (navigation) {
      navigation.navigate('CampaignDetail', { campaign });
    }
  };



  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(1)}$`;
  };

  const renderFilterButton = (
    filter: typeof activeFilter,
    title: string,
    icon: string,
    count?: number
  ) => (
    <TouchableOpacity
      style={[styles.filterButton, activeFilter === filter && styles.filterButtonActive]}
      onPress={() => setActiveFilter(filter)}
    >
      <Ionicons 
        name={icon as any} 
        size={16} 
        color={activeFilter === filter ? COLORS.white : COLORS.textSecondary} 
      />
      <Text style={[
        styles.filterText, 
        activeFilter === filter && styles.filterTextActive
      ]}>
        {title}
      </Text>
      {count !== undefined && (
        <View style={[
          styles.filterBadge,
          activeFilter === filter && styles.filterBadgeActive
        ]}>
          <Text style={[
            styles.filterBadgeText,
            activeFilter === filter && styles.filterBadgeTextActive
          ]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderModernFilterButton = (
    filter: typeof activeFilter,
    title: string,
    icon: string,
    count?: number
  ) => (
    <TouchableOpacity
      style={[styles.modernFilterButton, activeFilter === filter && styles.modernFilterButtonActive]}
      onPress={() => setActiveFilter(filter)}
    >
      <Ionicons 
        name={icon as any} 
        size={16} 
        color={activeFilter === filter ? COLORS.white : COLORS.textSecondary} 
      />
      <Text style={[
        styles.modernFilterText, 
        activeFilter === filter && styles.modernFilterTextActive
      ]}>
        {title}
      </Text>
      {count !== undefined && (
        <View style={[
          styles.modernFilterBadge,
          activeFilter === filter && styles.modernFilterBadgeActive
        ]}>
          <Text style={[
            styles.modernFilterBadgeText,
            activeFilter === filter && styles.modernFilterBadgeTextActive
          ]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCampaignItem = ({ item }: { item: Campaign }) => (
    <CampaignCard
      campaign={item}
      onPress={() => handleCampaignPress(item)}
      showActions={userRole === 'streamer'}
      userRole={userRole}
    />
  );

  const renderHeader = () => (
    <LinearGradient
      colors={COLORS.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.modernHeader}
    >
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <View style={styles.titleContainer}>
            <Text style={styles.modernTitle}>
              {userRole === 'streamer' ? 'Mes Available Missions' : 'Available Missions Disponibles'}
            </Text>
            <View style={styles.modernBoostBadge}>
              <Ionicons 
                name={userRole === 'streamer' ? 'settings' : 'search'} 
                size={16} 
                color={COLORS.primarySolid} 
              />
              <Text style={styles.modernBoostBadgeText}>
                {userRole === 'streamer' ? 'MANAGE' : 'DÉCOUVRIR'}
              </Text>
            </View>
          </View>
          <Text style={styles.modernSubtitle}>
            {userRole === 'streamer' 
              ? 'Manage your campaigns and track their performance 📊'
              : 'Trouvez des missions et créez des clips viraux 🚀'
            }
        </Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons 
            name={userRole === 'streamer' ? 'add' : 'filter'} 
            size={24} 
            color={COLORS.primarySolid} 
          />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const renderStats = () => {
    const filteredCampaigns = getFilteredCampaigns();
    const totalBudget = filteredCampaigns.reduce((sum, c) => sum + c.budget, 0);
    const activeCampaigns = filteredCampaigns.filter(c => c.status === 'active').length;
    const totalSpent = filteredCampaigns.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

    return (
      <View style={styles.modernStatsContainer}>
        <TouchableOpacity style={styles.modernStatCard} activeOpacity={0.8}>
          <LinearGradient
            colors={['#FF6B6B', '#FF8E8E', '#FFA8A8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statGradient}
          >
            <View style={styles.modernStatContent}>
              <View style={styles.modernStatIcon}>
                <Ionicons name="rocket" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.modernStatValue}>{activeCampaigns}</Text>
              <Text style={styles.modernStatLabel}>Actives</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.modernStatCard} activeOpacity={0.8}>
          <LinearGradient
            colors={['#4ECDC4', '#44A08D', '#3A8B7A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statGradient}
          >
            <View style={styles.modernStatContent}>
              <View style={styles.modernStatIcon}>
                <Ionicons name="wallet" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.modernStatValue}>{formatCurrency(totalBudget)}</Text>
              <Text style={styles.modernStatLabel}>Budget total</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.modernStatCard} activeOpacity={0.8}>
          <LinearGradient
            colors={['#667eea', '#764ba2', '#8B5FBF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statGradient}
          >
            <View style={styles.modernStatContent}>
              <View style={styles.modernStatIcon}>
                <Ionicons name="card" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.modernStatValue}>{formatCurrency(totalSpent)}</Text>
              <Text style={styles.modernStatLabel}>Dépensé</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFilters = () => (
    <View style={styles.modernFiltersContainer}>
      <View style={styles.filtersHeader}>
        <Text style={styles.filtersTitle}>
          {userRole === 'streamer' ? 'Filtrer mes missions' : 'Filtrer les missions'}
        </Text>
        <TouchableOpacity style={styles.clearFiltersButton} onPress={() => setActiveFilter('all')}>
          <Text style={styles.clearFiltersText}>Tout voir</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        {renderModernFilterButton('all', 'Toutes', 'apps', campaigns.length)}
        {renderModernFilterButton('trending', 'Populaires', 'trending-up', campaigns.filter(c => c.totalViews > 200000).length)}
        {renderModernFilterButton('new', 'Nouvelles', 'time', campaigns.filter(c => {
          const daysSinceCreation = (Date.now() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceCreation < 3;
        }).length)}
        {renderModernFilterButton('high-budget', 'High Budget', 'diamond', campaigns.filter(c => c.budget > 100).length)}
      </ScrollView>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.quickActionsTitle}>Actions rapides</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
          <LinearGradient
            colors={COLORS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quickActionGradient}
          >
            <Ionicons name="add-circle" size={28} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Create Mission</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
          <View style={styles.quickActionOutline}>
            <Ionicons name="stats-chart" size={28} color={COLORS.primarySolid} />
            <Text style={styles.quickActionTextOutline}>Mes statistiques</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.modernEmptyState}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyStateContainer}
      >
        <View style={styles.emptyStateIcon}>
          <Ionicons 
            name={userRole === 'streamer' ? 'settings-outline' : 'search-outline'} 
            size={64} 
            color={COLORS.primarySolid} 
          />
        </View>
        <Text style={styles.modernEmptyTitle}>
          {userRole === 'streamer' ? 'Aucune mission créée' : 'No missions available'}
        </Text>
        <Text style={styles.modernEmptySubtitle}>
          {activeFilter === 'all' 
            ? (userRole === 'streamer' 
                ? 'Créez votre première mission pour commencer'
                : 'Revenez plus tard pour découvrir de nouvelles missions'
              )
            : 'No missions match this filter'
          }
        </Text>
        <TouchableOpacity 
          style={styles.emptyStateButton}
          onPress={() => userRole === 'streamer' && navigation?.navigate('CreateCampaign')}
        >
          <LinearGradient
            colors={[COLORS.primarySolid, COLORS.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyStateButtonGradient}
          >
            <Ionicons 
              name={userRole === 'streamer' ? 'add' : 'refresh'} 
              size={20} 
              color={COLORS.white} 
            />
            <Text style={styles.emptyStateButtonText}>
              {userRole === 'streamer' ? 'Create Mission' : 'Refresh'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const filteredCampaigns = getFilteredCampaigns();

  return (
      <FlatList
        data={filteredCampaigns}
        renderItem={renderCampaignItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View>
            {renderFilters()}
          </View>
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.card, // Même couleur que la navbar (#262626)
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 0,
  },
  header: {
    padding: SIZES.spacing.lg,
    paddingBottom: SIZES.spacing.base,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.spacing.xs,
  },
  title: {
    fontSize: SIZES['2xl'],
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  boostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: SIZES.spacing.sm,
    paddingVertical: SIZES.spacing.xs,
    borderRadius: SIZES.radius.sm,
  },
  boostBadgeText: {
    fontSize: SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginLeft: SIZES.spacing.xs,
  },
  subtitle: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.base,
    alignItems: 'center',
    marginHorizontal: SIZES.spacing.xs,
    ...SHADOWS.sm,
  },
  statValue: {
    fontSize: SIZES.base,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: SIZES.spacing.xs,
    marginBottom: SIZES.spacing.xs,
  },
  statLabel: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  filtersContainer: {
    paddingHorizontal: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.lg,
  },
  filtersRow: {
    flexDirection: 'row',
    marginBottom: SIZES.spacing.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.base,
    borderRadius: SIZES.radius.base,
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.spacing.xs,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primarySolid,
  },
  filterText: {
    fontSize: SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginLeft: SIZES.spacing.xs,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  filterBadge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: SIZES.spacing.xs,
    paddingVertical: 2,
    borderRadius: SIZES.radius.sm,
    marginLeft: SIZES.spacing.xs,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: COLORS.white,
  },
  filterBadgeText: {
    fontSize: SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.textSecondary,
  },
  filterBadgeTextActive: {
    color: COLORS.primarySolid,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.spacing['2xl'],
    paddingHorizontal: SIZES.spacing.lg,
  },
  emptyTitle: {
    fontSize: SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
  modernHeader: {
    padding: SIZES.spacing.lg,
    paddingBottom: SIZES.spacing.base,
    borderBottomLeftRadius: SIZES.radius.lg,
    borderBottomRightRadius: SIZES.radius.lg,
    marginBottom: SIZES.spacing.base,
    ...SHADOWS.lg,
  },
  headerLeft: {
    flex: 1,
    marginRight: SIZES.spacing.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.xs,
  },
  modernTitle: {
    fontSize: SIZES['2xl'],
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginRight: SIZES.spacing.xs,
  },
  modernBoostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SIZES.spacing.sm,
    paddingVertical: SIZES.spacing.xs,
    borderRadius: SIZES.radius.sm,
  },
  modernBoostBadgeText: {
    fontSize: SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.primarySolid,
    marginLeft: SIZES.spacing.xs,
  },
  modernSubtitle: {
    fontSize: SIZES.base,
    color: COLORS.white,
    fontFamily: FONTS.regular,
  },
  searchButton: {
    padding: SIZES.spacing.sm,
    borderRadius: SIZES.radius.lg,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  modernStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SIZES.spacing.base,
    marginBottom: SIZES.spacing.lg,
  },
  modernStatCard: {
    width: '30%',
    height: 100,
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  statGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: SIZES.radius.lg,
  },
  modernStatContent: {
    alignItems: 'center',
  },
  modernStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.spacing.xs,
  },
  modernStatValue: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginBottom: SIZES.spacing.xs,
  },
  modernStatLabel: {
    fontSize: SIZES.xs,
    color: COLORS.white,
    fontFamily: FONTS.regular,
  },
  modernFiltersContainer: {
    paddingHorizontal: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.base,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  filtersTitle: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  clearFiltersButton: {
    paddingVertical: SIZES.spacing.xs,
    paddingHorizontal: SIZES.spacing.sm,
    borderRadius: SIZES.radius.base,
    backgroundColor: COLORS.surface,
  },
  clearFiltersText: {
    fontSize: SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  filtersScroll: {
    // Add any specific styles for the ScrollView if needed
  },
  modernFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.base,
    borderRadius: SIZES.radius.base,
    backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.spacing.xs,
  },
  modernFilterButtonActive: {
    backgroundColor: COLORS.primarySolid,
  },
  modernFilterText: {
    fontSize: SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginLeft: SIZES.spacing.xs,
  },
  modernFilterTextActive: {
    color: COLORS.white,
  },
  modernFilterBadge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: SIZES.spacing.xs,
    paddingVertical: 2,
    borderRadius: SIZES.radius.sm,
    marginLeft: SIZES.spacing.xs,
    minWidth: 20,
    alignItems: 'center',
  },
  modernFilterBadgeActive: {
    backgroundColor: COLORS.white,
  },
  modernFilterBadgeText: {
    fontSize: SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.textSecondary,
  },
  modernFilterBadgeTextActive: {
    color: COLORS.primarySolid,
  },
  modernEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.spacing['2xl'],
    paddingHorizontal: SIZES.spacing.lg,
  },
  emptyStateContainer: {
    width: '100%',
    height: '100%',
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.spacing.lg,
  },
  emptyStateIcon: {
    marginBottom: SIZES.spacing.lg,
  },
  modernEmptyTitle: {
    fontSize: SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.spacing.sm,
    textAlign: 'center',
  },
  modernEmptySubtitle: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SIZES.spacing.lg,
  },
  emptyStateButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.lg,
    borderRadius: SIZES.radius.lg,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  emptyStateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.lg,
    borderRadius: SIZES.radius.lg,
  },
  emptyStateButtonText: {
    fontSize: SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.white,
    marginLeft: SIZES.spacing.xs,
  },
  quickActionsContainer: {
    paddingHorizontal: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.base,
  },
  quickActionsTitle: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.spacing.sm,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  quickActionCard: {
    width: '48%', // Two columns
    height: 120,
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
    marginBottom: SIZES.spacing.sm,
    ...SHADOWS.sm,
  },
  quickActionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: SIZES.radius.lg,
  },
  quickActionOutline: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: SIZES.radius.lg,
    borderWidth: 1,
    borderColor: COLORS.primarySolid,
    borderStyle: 'dashed',
  },
  quickActionText: {
    fontSize: SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.white,
    marginTop: SIZES.spacing.xs,
  },
  quickActionTextOutline: {
    fontSize: SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.primarySolid,
    marginTop: SIZES.spacing.xs,
  },
  addButton: {
    padding: SIZES.spacing.sm,
    borderRadius: SIZES.radius.lg,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
});

export default BoostsScreen; 