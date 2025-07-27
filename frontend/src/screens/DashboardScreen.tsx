import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';
import { User, Campaign, Submission } from '../types';
import Button from '../components/Button';
import dashboardService, { StreamerStats, ClipperStats } from '../services/dashboardService';
import { useUserRole } from '../contexts/UserContext';
import authService from '../services/authService';
import { getTwitchDataFromUrl } from '../services/twitchService';
import { StripeService } from '../services/stripeService';
import AddFundsModal from '../components/AddFundsModal';
import declarationsService, { Declaration } from '../services/viewsDeclarationService';
import { supabase } from '../config/supabase';
import AdminService from '../services/adminService';
import campaignService from '../services/campaignService';

interface DashboardScreenProps {
  user: User;
  navigation?: any;
  onTabChange?: (tab: string) => void;
  activeTab?: string;
  onSignOut?: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ 
  user, 
  navigation, 
  onTabChange = () => {}, 
  activeTab = 'Dashboard',
  onSignOut = () => {}
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<StreamerStats | ClipperStats>({
    totalEarnings: 0,
    totalViews: 0,
    activeCampaigns: 0,
    pendingSubmissions: 0,
  });
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [streamerCampaigns, setStreamerCampaigns] = useState<Campaign[]>([]);
  const [twitchData, setTwitchData] = useState({
    profileImage: user.twitchProfileImage || '',
    displayName: user.twitchDisplayName || '',
    followers: user.twitchFollowers || 0,
  });
  const [walletBalance, setWalletBalance] = useState(0);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const { userRole } = useUserRole();
  const [pendingDeclarations, setPendingDeclarations] = useState<Declaration[]>([]);
  const [loadingDeclarations, setLoadingDeclarations] = useState(false);

  // Use the connected user's role instead of context
  const actualUserRole = user.role;
  
  console.log('🔵 Dashboard - context userRole:', userRole);
  console.log('🔵 Dashboard - actualUserRole de l\'utilisateur:', actualUserRole);

  const loadStats = async () => {
    try {
      // Charger le solde du wallet
      const balance = await StripeService.getWalletBalance(user.id);
      setWalletBalance(balance);

      if (actualUserRole === 'clipper') {
        const clipperStats = await dashboardService.getClipperStats(user.id);
        setStats(clipperStats);
        
        const submissions = await dashboardService.getClipperRecentSubmissions(user.id, 3);
        setRecentSubmissions(submissions);
      } else {
        const streamerStats = await dashboardService.getStreamerStats(user.id);
        setStats(streamerStats);
        
        const campaigns = await dashboardService.getStreamerRecentCampaigns(user.id, 3);
        setRecentCampaigns(campaigns);

        // Load all streamer campaigns for mission cards
        const allStreamerCampaigns = await campaignService.getStreamerCampaigns(user.id);
        setStreamerCampaigns(allStreamerCampaigns);
      }
    } catch (error) {
      console.error('❌ Error loading dashboard stats:', error);
      // Fallback sur des valeurs par défaut
      setStats({
        totalEarnings: 0,
        totalViews: 0,
        activeCampaigns: 0,
        pendingSubmissions: 0,
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    if (actualUserRole === 'admin') {
      await loadPendingDeclarations();
    }
    setRefreshing(false);
  };



  useEffect(() => {
    loadStats();
  }, [actualUserRole]);

  useEffect(() => {
    // Update Twitch state when props change
    console.log('🔵 Updating Twitch state from props:', {
      followers: user.twitchFollowers,
      profileImage: user.twitchProfileImage,
      displayName: user.twitchDisplayName,
      twitchUrl: user.twitchUrl
    });
    
    setTwitchData({
      followers: user.twitchFollowers || 0,
      profileImage: user.twitchProfileImage || '',
      displayName: user.twitchDisplayName || '',
    });
  }, [user]);

  useEffect(() => {
    if (actualUserRole === 'admin') {
      loadPendingDeclarations();
    }
  }, [actualUserRole]);

  const loadPendingDeclarations = async () => {
    setLoadingDeclarations(true);
    try {
      // Récupère toutes les déclarations à vérifier (status pending ou approved)
      const { data, error } = await supabase
        .from('declarations')
        .select('*, users:clipper_id(email)')
        .in('status', ['pending', 'approved']);
      if (error) throw error;
      setPendingDeclarations(data || []);
    } catch (e) {
      setPendingDeclarations([]);
    } finally {
      setLoadingDeclarations(false);
    }
  };

  const handleApproveDeclaration = async (declarationId: string) => {
    try {
      await AdminService.approveDeclaration(declarationId);
              Alert.alert('✅ Success', 'Declaration approved successfully');
      loadPendingDeclarations(); // Recharger les données
    } catch (error) {
      console.error('Error approbation:', error);
              Alert.alert('❌ Error', 'Unable to approve declaration');
    }
  };

  const handleRejectDeclaration = async (declarationId: string) => {
    Alert.prompt(
      'Reject Declaration',
      'Reason for rejection (optional):',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Rejeter', 
          onPress: async (reason) => {
            try {
              await AdminService.rejectDeclaration(declarationId, reason);
              Alert.alert('❌ Success', 'Déclaration rejetée');
              loadPendingDeclarations();
            } catch (error) {
              console.error('Error rejet:', error);
              Alert.alert('❌ Error', 'Unable to reject declaration');
            }
          }
        }
      ]
    );
  };

  const handlePayDeclaration = async (declarationId: string) => {
    try {
      await AdminService.payDeclaration(declarationId);
      Alert.alert('💰 Success', 'Declaration paid successfully');
      loadPendingDeclarations();
    } catch (error) {
      console.error('Error paiement:', error);
      Alert.alert('❌ Error', 'Unable to pay declaration');
    }
  };

  const renderDeclarationsToVerify = () => (
    <View style={{ marginTop: 24, marginBottom: 16 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>TikTok Declarations to Verify</Text>
      {loadingDeclarations ? (
        <Text>Loading...</Text>
      ) : pendingDeclarations.length === 0 ? (
        <Text>No declarations to verify.</Text>
      ) : (
        pendingDeclarations.map((d) => (
          <View key={d.id} style={{ marginBottom: 12, padding: 12, backgroundColor: '#f7f7f7', borderRadius: 8 }}>
            <Text style={{ fontWeight: 'bold' }}>TikTok: <Text style={{ color: COLORS.primarySolid }}>{d.tiktok_url}</Text></Text>
            <Text>Clipper: {d.users?.email || d.clipper_id}</Text>
            <Text>Declared Views: {d.declared_views}</Text>
            <Text>Paid Views: {d.paid_views}</Text>
            <Text>Earnings: {formatCurrency(d.earnings)}</Text>
            <Text>Status: {d.status}</Text>
            {d.verification_code && <Text>Bio Code: <Text style={{ fontWeight: 'bold' }}>{d.verification_code}</Text></Text>}
            
            <View style={{ marginTop: 8, flexDirection: 'row', gap: 8 }}>
              {d.status === 'pending' && (
                <>
                  <TouchableOpacity 
                    style={{ backgroundColor: COLORS.success, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 }}
                    onPress={() => handleApproveDeclaration(d.id)}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>✅ Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ backgroundColor: COLORS.error, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 }}
                    onPress={() => handleRejectDeclaration(d.id)}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>❌ Reject</Text>
                  </TouchableOpacity>
                </>
              )}
              {d.status === 'approved' && (
                <>
                  <View style={{ backgroundColor: COLORS.success, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>✅ Approved</Text>
                  </View>
                  <TouchableOpacity 
                    style={{ backgroundColor: COLORS.primarySolid, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 }}
                    onPress={() => handlePayDeclaration(d.id)}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>💰 Pay</Text>
                  </TouchableOpacity>
                </>
              )}
              {d.status === 'paid' && (
                <View style={{ backgroundColor: COLORS.success, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>💰 Paid</Text>
                </View>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );

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

  const handleQuickAddFunds = async (amount: number = 50) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not connected');
      return;
    }

    try {
      await StripeService.openCheckout(amount, user.id);
      
      Alert.alert(
        'Paiement initié',
        `You will be redirected to the Stripe payment page to add €${amount}. Once payment is completed, your balance will be automatically updated.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Recharger les données après un délai
              setTimeout(loadStats, 2000);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error ouverture checkout:', error);
      Alert.alert('Error', 'Impossible d\'ouvrir la page de paiement');
    }
  };

  const renderMissionCard = (campaign: any) => (
    <TouchableOpacity
      key={campaign.id}
      style={styles.missionCard}
      onPress={() => navigation?.navigate('CampaignDetail', { campaign })}
      activeOpacity={0.8}
    >
      {/* Header with avatar du streamer, nom et statistiques */}
      <View style={styles.cardHeaderTwitchLike}>
        {/* Avatar */}
        {campaign.streamerAvatar || user?.profileImage ? (
          <Image 
            source={{ uri: campaign.streamerAvatar || user?.profileImage }} 
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
              {campaign.title}
            </Text>
          </View>
          <Text style={styles.streamerFollowersRefactored}>
            {campaign.status === 'active' ? 'Active' : 'Completed'}
          </Text>
        </View>
        {/* Status on the right */}
        <View style={[styles.priceContainerRefactored, {
          backgroundColor: campaign.status === 'active' ? '#4CAF50' : '#757575'
        }]}>
          <Text style={styles.priceText}>
            {campaign.submissions?.length || 0} clips
          </Text>
        </View>
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
              <Text style={styles.thumbnailText}>Mission Thumbnail</Text>
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
            <Text style={styles.statLabel}>CPM</Text>
            <Text style={styles.statValue}>${(campaign.cpm / 10).toFixed(2)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Views</Text>
            <Text style={styles.statValue}>{formatViews(campaign.totalViews || 0)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.participateButton}
            onPress={(e) => {
              e.stopPropagation();
              navigation?.navigate('CampaignDetail', { campaign });
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

  const renderStreamerDashboard = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Section Solde */}
      <View style={styles.balanceTitleContainer}>
        <LinearGradient
          colors={['#1A1A1E', '#1A1A1E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.balanceTitleGradient}
        >
          <View style={styles.balanceTitleContent}>
            <View style={styles.balanceContentSection}>
              <View style={styles.balanceLeft}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>{formatCurrency(walletBalance)}</Text>
              </View>
              <View style={styles.balanceRight}>
                <TouchableOpacity style={styles.simpleActionButton}>
                  <Ionicons name="time" size={40} color={'#FFFFFF'} />
                  <Text style={styles.simpleActionText}>History</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Button Add Money */}
      <TouchableOpacity 
        style={styles.simpleCreateButton}
        onPress={() => setShowAddFundsModal(true)}
      >
        <Text style={styles.simpleCreateText}>Add Money</Text>
      </TouchableOpacity>

      {/* Grid de statistiques simplifiée */}
      <View style={styles.simpleStatsGrid}>
        <View style={[styles.simpleStatCard, styles.cardTopLeft]}>
          <Ionicons name="film" size={60} color={COLORS.primarySolid} />
          <Text style={styles.simpleStatValue}>{streamerCampaigns?.reduce((total, campaign) => total + (campaign.submissions?.length || 0), 0) || 0}</Text>
          <Text style={styles.simpleStatText}>Total Clips</Text>
        </View>
        <View style={[styles.simpleStatCard, styles.cardTopRight]}>
          <Ionicons name="eye" size={60} color="#00D4AA" />
          <Text style={styles.simpleStatValue}>{formatViews(streamerCampaigns?.reduce((total, campaign) => total + (campaign.totalViews || 0), 0) || 0)}</Text>
          <Text style={styles.simpleStatText}>Total Views</Text>
        </View>
        <View style={[styles.simpleStatCard, styles.cardBottomLeft]}>
          <Ionicons name="videocam" size={60} color="#FF6B6B" />
          <Text style={styles.simpleStatValue}>{streamerCampaigns?.filter(c => c.status === 'active').length || 0}</Text>
          <Text style={styles.simpleStatText}>Active Missions</Text>
        </View>
        <View style={[styles.simpleStatCard, styles.cardBottomRight]}>
          <Ionicons name="checkmark-circle" size={60} color="#FFA726" />
          <Text style={styles.simpleStatValue}>{streamerCampaigns?.filter(c => c.status === 'completed').length || 0}</Text>
          <Text style={styles.simpleStatText}>Completed Missions</Text>
        </View>
      </View>



      {actualUserRole === 'admin' && renderDeclarationsToVerify()}
    </ScrollView>
  );

  const renderClipperDashboard = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Section Solde */}
      <View style={styles.balanceTitleContainer}>
        <LinearGradient
          colors={['#1A1A1E', '#1A1A1E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.balanceTitleGradient}
        >
          <View style={styles.balanceTitleContent}>
            <View style={styles.balanceContentSection}>
              <View style={styles.balanceLeft}>
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>{formatCurrency(walletBalance)}</Text>
              </View>
              <View style={styles.balanceRight}>
                <TouchableOpacity style={styles.simpleActionButton}>
                  <Ionicons name="arrow-down" size={36} color={COLORS.primarySolid} />
                  <Text style={styles.simpleActionText}>Withdraw</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.simpleActionButton}>
                  <Ionicons name="time" size={36} color={COLORS.primarySolid} />
                  <Text style={styles.simpleActionText}>History</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Grid de statistiques simplifiée */}
      <View style={styles.simpleStatsGrid}>
        <View style={[styles.simpleStatCard, styles.cardTopLeft]}>
          <Ionicons name="cash" size={48} color="#0052FF" />
          <Text style={styles.simpleStatValue}>$0.00</Text>
          <Text style={styles.simpleStatText}>Total Earnings</Text>
        </View>
        <View style={[styles.simpleStatCard, styles.cardTopRight]}>
          <Ionicons name="eye" size={48} color="#00D4AA" />
          <Text style={styles.simpleStatValue}>0</Text>
          <Text style={styles.simpleStatText}>Total Views</Text>
        </View>
        <View style={[styles.simpleStatCard, styles.cardBottomLeft]}>
          <Ionicons name="videocam" size={48} color="#FF6B6B" />
          <Text style={styles.simpleStatValue}>1</Text>
          <Text style={styles.simpleStatText}>Available Missions</Text>
        </View>
        <View style={[styles.simpleStatCard, styles.cardBottomRight]}>
          <Ionicons name="time" size={48} color="#FFA726" />
          <Text style={styles.simpleStatValue}>1</Text>
          <Text style={styles.simpleStatText}>Pending</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <>
      {actualUserRole === 'streamer' ? renderStreamerDashboard() : renderClipperDashboard()}
      
      <AddFundsModal
        visible={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
        userId={user.id}
        onSuccess={loadStats}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.card, // Mode sombre comme Create Campaign
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.spacing.xl,
    paddingBottom: 50,
    flexGrow: 1,
  },
  header: {
    marginBottom: SIZES.spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SIZES.spacing.base,
  },
  userTextInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: SIZES['3xl'],
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.spacing.xs,
  },
  roleText: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.xl,
    paddingVertical: SIZES.spacing.lg,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.lg,
    marginHorizontal: SIZES.spacing.lg,
    ...SHADOWS.base,
  },


  addFundsButton: {
    minWidth: 140,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SIZES.spacing.base,
  },
  statCardGradient: {
    borderRadius: SIZES.radius.xl,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.xl - 2,
    padding: SIZES.spacing.base,
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    alignItems: 'center',
    marginTop: SIZES.spacing.sm,
  },
  statValue: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.spacing.xs,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 16,
  },
  section: {
    marginBottom: SIZES.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.base,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: SIZES.sm,
    color: COLORS.primarySolid,
    fontFamily: FONTS.medium,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: SIZES.spacing.xs,
  },
  campaignItem: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.base,
    padding: SIZES.spacing.base,
    marginBottom: SIZES.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignTitle: {
    fontSize: SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: SIZES.spacing.xs,
  },
  campaignViews: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  submissionItem: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.base,
    padding: SIZES.spacing.base,
    marginBottom: SIZES.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  submissionInfo: {
    flex: 1,
  },
  submissionStatus: {
    fontSize: SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: SIZES.spacing.xs,
  },
  submissionViews: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  emptyState: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.base,
    padding: SIZES.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  emptyStateText: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  modernStatCard: {
    borderRadius: SIZES.radius.xl,
    padding: 2,
    marginBottom: SIZES.spacing.base,
    width: '48%',
    aspectRatio: 1,
    ...SHADOWS.base,
  },
  modernStatContent: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.xl - 2,
    padding: SIZES.spacing.base,
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernStatIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  modernStatInfo: {
    alignItems: 'center',
  },
  modernStatValue: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.spacing.xs,
    textAlign: 'center',
  },
  modernStatLabel: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 16,
  },
  glassStatCard: {
    borderRadius: SIZES.radius.xl,
    padding: 3,
    marginBottom: SIZES.spacing.base,
    width: '48%',
    aspectRatio: 1,
    ...SHADOWS.lg,
  },
  glassStatContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: SIZES.radius.xl - 3,
    padding: SIZES.spacing.base,
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  glassStatIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  glassStatInfo: {
    alignItems: 'center',
  },
  glassStatValue: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: SIZES.spacing.xs,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontWeight: 'bold',
  },
  glassStatLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: FONTS.bold,
    textAlign: 'center',
    lineHeight: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    fontWeight: 'bold',
    marginTop: 4,
  },
  modernHeader: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.xl,
    padding: SIZES.spacing.lg,
    paddingBottom: SIZES.spacing.xl,
    marginTop: 25,
    marginBottom: 50,
    alignSelf: 'center',
    maxWidth: 500,
    ...SHADOWS.lg,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: SIZES.spacing.base,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.teal,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.spacing.xs,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySolid,
    borderRadius: SIZES.radius.sm,
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.base,
    marginRight: SIZES.spacing.sm,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: SIZES.sm,
    fontFamily: FONTS.bold,
    marginLeft: SIZES.spacing.xs,
  },
  followersCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followersText: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginLeft: SIZES.spacing.xs,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.primarySolid,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  notificationCount: {
    color: '#FFFFFF',
    fontSize: SIZES.xs,
    fontFamily: FONTS.bold,
  },
  modernBalanceSection: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.lg,
    marginHorizontal: SIZES.spacing.lg,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.lg,
  },
  balanceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.spacing.base,
  },
  balanceInfo: {
    flex: 1,
  },


  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.spacing.xs,
  },
  balanceChangeText: {
    fontSize: SIZES.sm,
    color: COLORS.error,
    fontFamily: FONTS.medium,
    marginLeft: SIZES.spacing.xs,
  },
  balanceGraph: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniGraph: {
    width: 50,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  graphLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.primarySolid,
    borderRadius: 1,
  },
  balanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    paddingVertical: SIZES.spacing.base,
    paddingHorizontal: SIZES.spacing.xl,
    borderRadius: SIZES.radius.lg,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  quickActionText: {
    fontSize: SIZES.sm,
    color: COLORS.text,
    fontFamily: FONTS.medium,
    marginTop: SIZES.spacing.xs,
  },
  modernSection: {
    marginBottom: SIZES.spacing.base,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.base,
    ...SHADOWS.lg,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.base,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.spacing.xs,
  },
  modernSectionTitle: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  moreButton: {
    padding: SIZES.spacing.xs,
  },
  modernActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modernActionButton: {
    flex: 1,
    marginHorizontal: SIZES.spacing.xs,
  },
  actionButtonGradient: {
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  actionButtonText: {
    fontSize: SIZES.base,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    marginTop: SIZES.spacing.xs,
  },
  actionButtonSubtext: {
    fontSize: SIZES.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: FONTS.regular,
  },
  actionButtonOutline: {
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primarySolid,
    backgroundColor: 'transparent',
  },
  actionButtonTextOutline: {
    fontSize: SIZES.base,
    color: COLORS.primarySolid,
    fontFamily: FONTS.bold,
    marginTop: SIZES.spacing.xs,
  },
  actionButtonSubtextOutline: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  modernSubmissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.base,
    padding: SIZES.spacing.base,
    marginBottom: SIZES.spacing.sm,
    ...SHADOWS.sm,
  },
  submissionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.spacing.base,
  },
  submissionInfo: {
    flex: 1,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.xs,
  },
  submissionStatus: {
    fontSize: SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  submissionBadge: {
    backgroundColor: COLORS.primarySolid,
    borderRadius: SIZES.radius.sm,
    paddingVertical: SIZES.spacing.xs,
    paddingHorizontal: SIZES.spacing.sm,
  },
  submissionEarnings: {
    fontSize: SIZES.xs,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  modernEmptyState: {
    alignItems: 'center',
    paddingVertical: SIZES.spacing.xl,
  },
  emptyStateIcon: {
    marginBottom: SIZES.spacing.base,
  },
  emptyStateTitle: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.spacing.xs,
  },
  emptyStateText: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SIZES.spacing.lg,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primarySolid,
    borderRadius: SIZES.radius.md,
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.lg,
  },
  emptyStateButtonText: {
    fontSize: SIZES.base,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernStatCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.md,
    padding: SIZES.spacing.xs,
    marginBottom: SIZES.spacing.xs,
    width: '48%',
    aspectRatio: 1.8,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modernStatContent: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernStatIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  modernStatInfo: {
    alignItems: 'center',
  },
  modernStatValue: {
    fontSize: SIZES.sm,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  modernStatLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    lineHeight: 11,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primarySolid,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.base,
  },
  createMissionButton: {
    marginHorizontal: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.xs,
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  createMissionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.spacing.sm,
    paddingHorizontal: SIZES.spacing.xl,
  },
  createMissionText: {
    fontSize: SIZES.lg,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    marginLeft: SIZES.spacing.sm,
  },

  refreshButton: {
    marginLeft: SIZES.spacing.xs,
    padding: SIZES.spacing.xs,
    borderRadius: SIZES.radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Nouveaux styles pour le design simplifié
  simpleBalanceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1E',
    padding: SIZES.spacing.xl,
    marginBottom: SIZES.spacing.lg,
    borderRadius: SIZES.radius.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: '#333',
    ...SHADOWS.md,
    minWidth: 300,
    flexWrap: 'nowrap',
  },
  balanceLeft: {
    flex: 1,
    minWidth: 250, // Largeur minimum pour éviter le wrap du texte
    flexShrink: 0, // Empêche le rétrécissement
    justifyContent: 'flex-start',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  balanceRight: {
    flexDirection: 'row',
    gap: SIZES.spacing.sm,
    flexShrink: 0,
    minWidth: 'auto',
  },
  balanceLabel: {
    fontSize: 40,
    color: '#B5B5B5',
    fontFamily: FONTS.bold,
    marginLeft: SIZES.spacing.sm,
    flexShrink: 0,
    minWidth: 'auto',
    whiteSpace: 'nowrap',
    textAlign: 'left',
    lineHeight: 40,
  },
  balanceAmount: {
    fontSize: 44,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontWeight: 'semibold',
    marginTop: SIZES.spacing.sm,
  },
  simpleActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.xl,
    paddingVertical: SIZES.spacing.lg,
    backgroundColor: '#2A2A2E',
    borderRadius: SIZES.radius.lg,
    borderWidth: 1,
    borderColor: '#444',
    marginLeft: SIZES.spacing.sm,
    gap: SIZES.spacing.base,
    minWidth: 120,
    flexShrink: 0,
    justifyContent: 'center',
  },
  simpleActionText: {
    fontSize: 30,
    color: '#FFFFFF',
    fontFamily: FONTS.medium,
    whiteSpace: 'nowrap',
    textAlign: 'center',
  },
  simpleCreateButton: {
    backgroundColor: '#4b5ef2',
    paddingVertical: SIZES.spacing.lg,
    paddingHorizontal: SIZES.spacing.lg,
    borderRadius: 26,
    marginTop: 15,
    marginBottom: 5,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginHorizontal: 20,
    ...SHADOWS.md,
  },
  simpleCreateText: {
    fontSize: 30,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
  },
  simpleStatsGrid: {
    width: '100%',
    height: '100%',
    flex: 1,
    marginTop: 24,
    position: 'relative',
    minHeight: 500,
  },
  simpleStatCard: {
    width: '48%',
    height: '48%',
    backgroundColor: '#1A1A1E',
    padding: SIZES.spacing.xl,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333',
    borderTopColor: '#444',
    borderLeftColor: '#444',
    borderRightColor: '#222',
    borderBottomColor: '#222',
    ...SHADOWS.lg,
    position: 'absolute',
  },
  simpleStatValue: {
    fontSize: 48,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginVertical: SIZES.spacing.lg,
    textShadowColor: 'rgba(255, 255, 255, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  simpleStatText: {
    fontSize: 30,
    color: '#B5B5B5',
    fontFamily: FONTS.medium,
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(255, 255, 255, 0.05)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  // Styles pour les positions des cartes
  cardTopLeft: {
    top: '1%',
    left: '1%',
  },
  cardTopRight: {
    top: '1%',
    right: '1%',
  },
  cardBottomLeft: {
    bottom: '1%',
    left: '1%',
  },
  cardBottomRight: {
    bottom: '1%',
    right: '1%',
  },
  mainTitleContainer: {
    marginBottom: SIZES.spacing.xl,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 28,
    color: COLORS.text,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    lineHeight: 36,
    maxWidth: '80%',
  },
  
  // Mission Cards Styles (same as AvailableMissionsScreen)
  missionsSection: {
    marginBottom: SIZES.spacing.xl,
  },
  missionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 16,
    minWidth: 0,
  },
  missionCard: {
    backgroundColor: '#1A1A1E',
    borderRadius: 30,
    padding: 28,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 450,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    transform: [{ translateY: -2 }],
    overflow: 'hidden',
    width: '100%',
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
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
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
  streamerName: {
    fontSize: 30,
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    maxWidth: 300,
    overflow: 'hidden',
    flexShrink: 1,
  },
  streamerFollowersRefactored: {
    fontSize: 24,
    color: '#B5B5B5',
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
  balanceTitleContainer: {
    alignSelf: 'stretch',
    marginHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 24,
  },
  balanceTitleGradient: {
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#333',
    borderBottomWidth: 3,
    borderBottomColor: '#222',
    backgroundColor: '#1A1A1E',
  },
  balanceTitleContent: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  balanceTitleText: {
    fontSize: 40,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
  },
  balanceTitleDescription: {
    fontSize: 24,
    fontFamily: FONTS.regular,
    color: '#B5B5B5',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 20,
    flexShrink: 1,
  },
  balanceContentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
});

export default DashboardScreen; 