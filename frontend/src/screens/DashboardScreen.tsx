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
import declarationsService, { Declaration } from '../services/viewsDeclarationService';
import { supabase } from '../config/supabase';
import { adminService } from '../services/adminService';
import campaignService from '../services/campaignService';
import TikTokLoginModal from '../components/TikTokLoginModal';
import { tiktokLoginService, TikTokUserData } from '../services/tiktokLoginService';

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
  const { userRole } = useUserRole();
  const [pendingDeclarations, setPendingDeclarations] = useState<Declaration[]>([]);
  const [loadingDeclarations, setLoadingDeclarations] = useState(false);
  const [adminStats, setAdminStats] = useState({
    totalDeclarations: 0,
    totalPending: 0,
    totalPaid: 0,
    totalEarnings: 0,
    totalClippers: 0,
    totalCampaigns: 0,
  });
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [tiktokData, setTiktokData] = useState<TikTokUserData | null>(null);

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

        // Charger les données TikTok si connecté
        const hasTikTokConnected = await tiktokLoginService.hasTikTokConnected(user.id);
        if (hasTikTokConnected) {
          const tiktokUserData = await tiktokLoginService.getTikTokData(user.id);
          setTiktokData(tiktokUserData);
        }
      } else if (actualUserRole === 'streamer') {
        const streamerStats = await dashboardService.getStreamerStats(user.id);
        setStats(streamerStats);
        
        const campaigns = await dashboardService.getStreamerRecentCampaigns(user.id, 3);
        setRecentCampaigns(campaigns);

        // Load all streamer campaigns for mission cards
        const allStreamerCampaigns = await campaignService.getStreamerCampaigns(user.id);
        setStreamerCampaigns(allStreamerCampaigns);
      } else if (actualUserRole === 'admin') {
        // Load admin stats
        const adminStatsData = await adminService.getAdminStats();
        setAdminStats(adminStatsData);
        
        // Load pending declarations
        await loadPendingDeclarations();
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
      {/* Conteneur principal avec hauteur flexible */}
      <View style={styles.mainStatsContainer}>
        {/* Section Solde */}
        <View style={styles.balanceTitleContainer}>
          <LinearGradient
            colors={['#0A0A0A', '#0A0A0A']}
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
                  <TouchableOpacity 
                    onPress={() => onTabChange('Payment')}
                  >
                    <LinearGradient
                      colors={['#4a5cf9', '#3c82f6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.addMoneyButton}
                    >
                      <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.addMoneyText}>Add Money</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.simpleActionButton}
                    onPress={() => onTabChange('Payment')}
                  >
                    <Ionicons name="time" size={20} color="#89888d" />
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
            <Text style={styles.simpleStatValue}>{streamerCampaigns?.reduce((total, campaign) => total + (campaign.submissions?.length || 0), 0) || 0}</Text>
            <Text style={styles.simpleStatText}>Total Clips</Text>
          </View>
          <View style={[styles.simpleStatCard, styles.cardTopRight]}>
            <Text style={styles.simpleStatValue}>{formatViews(streamerCampaigns?.reduce((total, campaign) => total + (campaign.totalViews || 0), 0) || 0)}</Text>
            <Text style={styles.simpleStatText}>Total Views</Text>
          </View>
          <View style={[styles.simpleStatCard, styles.cardBottomLeft]}>
            <Text style={styles.simpleStatValue}>{streamerCampaigns?.filter(c => c.status === 'active').length || 0}</Text>
            <Text style={styles.simpleStatText}>Active Missions</Text>
          </View>
          <View style={[styles.simpleStatCard, styles.cardBottomRight]}>
            <Text style={styles.simpleStatValue}>{streamerCampaigns?.filter(c => c.status === 'completed').length || 0}</Text>
            <Text style={styles.simpleStatText}>Completed Missions</Text>
          </View>
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
      showsVerticalScrollIndicator={false}
    >
      {/* Conteneur principal avec hauteur flexible */}
      <View style={styles.mainStatsContainer}>
        {/* Section Solde */}
        <View style={styles.balanceTitleContainer}>
          <LinearGradient
            colors={['#0A0A0A', '#0A0A0A']}
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
                  <TouchableOpacity 
                    onPress={() => onTabChange('Payment')}
                  >
                    <LinearGradient
                      colors={['#4a5cf9', '#3c82f6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.addMoneyButton}
                    >
                      <Ionicons name="arrow-down" size={20} color="#FFFFFF" />
                    <Text style={styles.addMoneyText}>Withdraw</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.simpleActionButton}
                    onPress={() => onTabChange('Payment')}
                  >
                    <Ionicons name="time" size={20} color="#89888d" />
                    <Text style={styles.simpleActionText}>History</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

      {/* Section TikTok Connection */}
      <View style={styles.tiktokSection}>
        <LinearGradient
          colors={['#ffffff', '#f8f9fa']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.tiktokCard}
        >
          <View style={styles.tiktokHeader}>
            <Ionicons name="logo-tiktok" size={24} color="#ff0050" />
            <Text style={styles.tiktokTitle}>TikTok Account</Text>
          </View>
          
          {tiktokData ? (
            <View style={styles.tiktokConnected}>
              <View style={styles.tiktokProfile}>
                <Text style={styles.tiktokUsername}>{tiktokData.nickname}</Text>
                <Text style={styles.tiktokHandle}>@{tiktokData.custom_username}</Text>
              </View>
              <View style={styles.tiktokStats}>
                <View style={styles.tiktokStat}>
                  <Text style={styles.tiktokStatNumber}>{tiktokData.follower_count.toLocaleString()}</Text>
                  <Text style={styles.tiktokStatLabel}>Followers</Text>
                </View>
                <View style={styles.tiktokStat}>
                  <Text style={styles.tiktokStatNumber}>{tiktokData.video_count.toLocaleString()}</Text>
                  <Text style={styles.tiktokStatLabel}>Videos</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.tiktokManageButton}
                onPress={() => setShowTikTokModal(true)}
              >
                <Text style={styles.tiktokManageText}>Manage Account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.tiktokNotConnected}>
              <Text style={styles.tiktokDescription}>
                Connect your TikTok account to submit clips and track your performance
              </Text>
              <TouchableOpacity 
                style={styles.tiktokConnectButton}
                onPress={() => setShowTikTokModal(true)}
              >
                <Ionicons name="logo-tiktok" size={20} color="#ffffff" />
                <Text style={styles.tiktokConnectText}>Connect TikTok</Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Grid de statistiques simplifiée */}
      <View style={styles.simpleStatsGrid}>
        <View style={[styles.simpleStatCard, styles.cardTopLeft]}>
          <Text style={styles.simpleStatValue}>{formatCurrency(stats.totalEarnings || 0)}</Text>
          <Text style={styles.simpleStatText}>Total Earnings</Text>
        </View>
        <View style={[styles.simpleStatCard, styles.cardTopRight]}>
          <Text style={styles.simpleStatValue}>{formatViews(stats.totalViews || 0)}</Text>
          <Text style={styles.simpleStatText}>Total Views</Text>
        </View>
        <View style={[styles.simpleStatCard, styles.cardBottomLeft]}>
          <Text style={styles.simpleStatValue}>{stats.activeCampaigns || 0}</Text>
          <Text style={styles.simpleStatText}>Available Missions</Text>
        </View>
        <View style={[styles.simpleStatCard, styles.cardBottomRight]}>
          <Text style={styles.simpleStatValue}>{stats.pendingSubmissions || 0}</Text>
          <Text style={styles.simpleStatText}>Pending</Text>
        </View>
      </View>
      </View>
    </ScrollView>
  );

  const renderAdminDashboard = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Conteneur principal avec hauteur flexible */}
      <View style={styles.mainStatsContainer}>
        {/* Section Solde */}
        <View style={styles.balanceTitleContainer}>
          <LinearGradient
            colors={['#0A0A0A', '#0A0A0A']}
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
                  <TouchableOpacity 
                    onPress={() => onTabChange('Payment')}
                  >
                    <LinearGradient
                      colors={['#4a5cf9', '#3c82f6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.addMoneyButton}
                    >
                      <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.addMoneyText}>Add Money</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.simpleActionButton}
                    onPress={() => onTabChange('Payment')}
                  >
                    <Ionicons name="time" size={20} color="#89888d" />
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
            <Ionicons name="videocam" size={35} color="#dcdcdc" />
            <Text style={styles.simpleStatValue}>{adminStats.totalDeclarations}</Text>
            <Text style={styles.simpleStatText}>Total Clips</Text>
          </View>
          <View style={[styles.simpleStatCard, styles.cardTopRight]}>
            <Ionicons name="cash" size={35} color="#dcdcdc" />
            <Text style={styles.simpleStatValue}>{formatCurrency(adminStats.totalEarnings)}</Text>
            <Text style={styles.simpleStatText}>Earnings</Text>
          </View>
          <View style={[styles.simpleStatCard, styles.cardBottomLeft]}>
            <Ionicons name="people-circle" size={35} color="#dcdcdc" />
            <Text style={styles.simpleStatValue}>{adminStats.totalCampaigns}</Text>
            <Text style={styles.simpleStatText}>Total Streamers</Text>
          </View>
          <View style={[styles.simpleStatCard, styles.cardBottomRight]}>
            <Ionicons name="people" size={35} color="#dcdcdc" />
            <Text style={styles.simpleStatValue}>{adminStats.totalClippers}</Text>
            <Text style={styles.simpleStatText}>Total Clippers</Text>
          </View>
        </View>
      </View>

      {/* Section des déclarations à vérifier */}
      {renderDeclarationsToVerify()}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Dashboard</Text>
      <View style={styles.mainContentContainer}>
        {actualUserRole === 'streamer' 
          ? renderStreamerDashboard() 
          : actualUserRole === 'admin' 
            ? renderAdminDashboard() 
            : renderClipperDashboard()
        }
      </View>
      
      {/* TikTok Login Modal */}
      <TikTokLoginModal
        visible={showTikTokModal}
        onClose={() => setShowTikTokModal(false)}
        onSuccess={(userData) => {
          setTiktokData(userData);
          setShowTikTokModal(false);
        }}
        user={user}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0A0A0A', // Fond principal comme Threads
  },
  pageTitle: {
    fontSize: 14,
    fontFamily: 'Inter_18pt-Medium',
    color: '#e0e0e0',
    textAlign: 'center',
    marginTop: -30,
    marginBottom: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 9,
    paddingTop: 0, // Supprimé pour éliminer l'espace en haut
    paddingBottom: 0, // Supprimé pour éliminer l'espace en bas
    flexGrow: 1,
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
    marginBottom: 9,
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
    width: 23,
    height: 23,
    borderRadius: 11,
    marginRight: 8, // Réduit de 16 à 8
  },
  userTextInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16, // Réduit de 32 à 16
    fontFamily: 'Inter_18pt-SemiBold',
    color: '#e0e0e0',
    marginBottom: 4, // Réduit de 8 à 4
  },
  roleText: {
    fontSize: 8, // Réduit de 16 à 8
    color: '#8B8B8D',
    fontFamily: 'Inter_18pt-Regular',
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: 12, // Réduit de 24 à 12
    paddingVertical: 10, // Réduit de 20 à 10
    backgroundColor: '#0A0A0A',
    borderRadius: 8, // Réduit de 16 à 8
    marginHorizontal: 10, // Réduit de 20 à 10
    ...SHADOWS.base,
  },


  addFundsButton: {
    minWidth: 70, // Réduit de 140 à 70
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8, // Réduit de 16 à 8
  },
  statCardGradient: {
    borderRadius: 20,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  statCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 9, // Réduit de 18 à 9
    padding: 8, // Réduit de 16 à 8
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    alignItems: 'center',
    marginTop: 6, // Réduit de 12 à 6
  },
  statValue: {
    fontSize: 10, // Réduit de 20 à 10
    fontFamily: 'Inter_18pt-SemiBold',
    color: '#e0e0e0',
    marginBottom: 4, // Réduit de 8 à 4
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 6, // Réduit de 12 à 6
    color: '#8B8B8D',
    fontFamily: 'Inter_18pt-Regular',
    textAlign: 'center',
    lineHeight: 8, // Réduit de 16 à 8
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter_18pt-Bold',
    fontWeight: '600',
    color: '#e0e0e0',
  },
  seeAllText: {
    fontSize: 14,
    color: '#0052FF',
    fontFamily: 'Inter_18pt-Medium',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  campaignItem: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignTitle: {
    fontSize: 16,
    fontFamily: 'Inter_18pt-Medium',
    color: '#e0e0e0',
    marginBottom: 4,
  },
  campaignViews: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter_18pt-Regular',
  },
  submissionItem: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  submissionInfo: {
    flex: 1,
  },
  submissionStatus: {
    fontSize: 16,
    fontFamily: 'Inter_18pt-Medium',
    color: '#e0e0e0',
    marginBottom: 4,
  },
  submissionViews: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter_18pt-Regular',
  },
  emptyState: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter_18pt-Regular',
    textAlign: 'center',
  },
  modernStatCard: {
    borderRadius: 20,
    padding: 2,
    marginBottom: 16,
    width: '48%',
    aspectRatio: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modernStatContent: {
    backgroundColor: '#0A0A0A',
    borderRadius: 18,
    padding: 16,
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernStatIcon: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modernStatInfo: {
    alignItems: 'center',
  },
  modernStatValue: {
    fontSize: 18,
    fontFamily: 'Inter_18pt-Bold',
    color: '#e0e0e0',
    marginBottom: 4,
    textAlign: 'center',
  },
  modernStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter_18pt-Regular',
    textAlign: 'center',
    lineHeight: 16,
  },
  glassStatCard: {
    borderRadius: 20,
    padding: 3,
    marginBottom: 16,
    width: '48%',
    aspectRatio: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  glassStatContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 17,
    padding: 16,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  glassStatInfo: {
    alignItems: 'center',
  },
  glassStatValue: {
    fontSize: 18,
    fontFamily: 'Inter_18pt-Bold',
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontWeight: 'bold',
  },
  glassStatLabel: {
    fontSize: 7,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter_18pt-Bold',
    textAlign: 'center',
    lineHeight: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1.5,
    fontWeight: 'bold',
    marginTop: 2,
  },
  modernHeader: {
    backgroundColor: '#0052FF',
    borderRadius: 20,
    padding: 24,
    paddingBottom: 32,
    marginTop: 5,
    marginBottom: 25,
    alignSelf: 'center',
    maxWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D4AA',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0052FF',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  roleText: {
    color: '#e0e0e0',
    fontSize: 14,
    fontFamily: 'Inter_18pt-Bold',
    marginLeft: 4,
  },
  followersCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followersText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter_18pt-Regular',
    marginLeft: 4,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2.5,
    right: -2.5,
    backgroundColor: '#0052FF',
    borderRadius: 5,
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
  },
  notificationCount: {
    color: '#e0e0e0',
    fontSize: 12,
    fontFamily: 'Inter_18pt-Bold',
  },
  modernBalanceSection: {
    backgroundColor: '#2A2A2E',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#444',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceIconContainer: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  balanceInfo: {
    flex: 1,
  },


  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  balanceChangeText: {
    fontSize: 14,
    color: '#EF4444',
    fontFamily: 'Inter_18pt-Medium',
    marginLeft: 4,
  },
  balanceGraph: {
    width: 30,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniGraph: {
    width: 25,
    height: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  graphLine: {
    width: 20,
    height: 1,
    backgroundColor: '#0052FF',
    borderRadius: 0.5,
  },
  balanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#1A1A1E',
    borderWidth: 1,
    borderColor: '#444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 14,
    color: '#e0e0e0',
    fontFamily: 'Inter_18pt-Medium',
    marginTop: 4,
  },
  modernSection: {
    marginBottom: 16, // SIZES.spacing.base
    backgroundColor: '#1A1A1E', // COLORS.card
    borderRadius: 12, // SIZES.radius.lg
    padding: 16, // SIZES.spacing.base
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  modernSectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_18pt-Bold',
    color: '#e0e0e0',
  },
  moreButton: {
    padding: 4,
  },
  modernActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modernActionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonGradient: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#e0e0e0',
    fontFamily: 'Inter_18pt-Bold',
    marginTop: 4,
  },
  actionButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter_18pt-Regular',
  },
  actionButtonOutline: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0052FF',
    backgroundColor: 'transparent',
  },
  actionButtonTextOutline: {
    fontSize: 16,
    color: '#0052FF',
    fontFamily: 'Inter_18pt-Bold',
    marginTop: 4,
  },
  actionButtonSubtextOutline: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter_18pt-Regular',
  },
  modernSubmissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1E',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  submissionIconContainer: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  submissionInfo: {
    flex: 1,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  submissionStatus: {
    fontSize: 16,
    fontFamily: 'Inter_18pt-Medium',
    color: '#e0e0e0',
  },
  submissionBadge: {
    backgroundColor: '#0052FF',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  submissionEarnings: {
    fontSize: 12,
    color: '#e0e0e0',
    fontFamily: 'Inter_18pt-Bold',
  },
  modernEmptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Inter_18pt-SemiBold',
    color: '#e0e0e0',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8B8B8D',
    fontFamily: 'Inter_18pt-Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#0052FF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  emptyStateButtonText: {
    fontSize: 16,
    color: '#e0e0e0',
    fontFamily: 'Inter_18pt-SemiBold',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernStatCard: {
    backgroundColor: '#1A1A1E',
    borderRadius: 8,
    padding: 4,
    marginBottom: 4,
    width: '48%',
    aspectRatio: 1.8,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: '#2A2A2E',
  },
  modernStatContent: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernStatIcon: {
    width: 12, // Réduit de 24 à 12
    height: 12, // Réduit de 24 à 12
    borderRadius: 6, // Réduit de 12 à 6
    backgroundColor: '#1A1A1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2, // Réduit de 4 à 2
  },
  modernStatInfo: {
    alignItems: 'center',
  },
  modernStatValue: {
    fontSize: 14,
    fontFamily: 'Inter_18pt-SemiBold',
    color: '#e0e0e0',
    marginBottom: 1, // Réduit de 2 à 1
    textAlign: 'center',
  },
  modernStatLabel: {
    fontSize: 5, // Réduit de 10 à 5
    color: '#8B8B8D',
    fontFamily: 'Inter_18pt-Medium',
    textAlign: 'center',
    lineHeight: 5.5, // Réduit de 11 à 5.5
  },

  avatar: {
    width: 25, // Réduit de 50 à 25
    height: 25, // Réduit de 50 à 25
    borderRadius: 12.5, // Réduit de 25 à 12.5
    backgroundColor: '#0052FF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.base,
  },
  createMissionButton: {
    marginHorizontal: 24,
    marginBottom: 4,
    borderRadius: 12,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  createMissionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 32,
  },
  createMissionText: {
    fontSize: 18,
    color: '#e0e0e0',
    fontFamily: 'Inter_18pt-SemiBold',
    marginLeft: 8,
  },

  refreshButton: {
    marginLeft: 4,
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Nouveaux styles pour le design simplifié
  simpleBalanceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1E',
    padding: 24,
    marginBottom: 18,
    borderRadius: 9,
    width: '100%',
    borderWidth: 1,
    borderColor: '#333',
    ...SHADOWS.md,
    minWidth: 225,
    flexWrap: 'nowrap',
  },
  balanceLeft: {
    flex: 1,
    minWidth: 188,
    flexShrink: 0,
    justifyContent: 'flex-start',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  balanceRight: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
    minWidth: 'auto',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#B5B5B5',
    fontFamily: 'Inter_18pt-Medium',
    flexShrink: 0,
    minWidth: 'auto',
    whiteSpace: 'nowrap',
    textAlign: 'left',
    lineHeight: 15,
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 17,
    color: '#e0e0e0',
    fontFamily: 'Inter_18pt-SemiBold',
    fontWeight: 'semibold',
    marginTop: 6,
  },
  simpleActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2A2A2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
    marginLeft: 4,
    gap: 16,
    minWidth: 120,
    flexShrink: 0,
    justifyContent: 'center',
  },
  addMoneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    marginLeft: 4,
    gap: 16,
    minWidth: 120,
    flexShrink: 0,
    justifyContent: 'center',
    shadowColor: '#4a5cf9',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  simpleActionText: {
    fontSize: 14, // Réduit de 30 à 15
    color: '#e0e0e0',
    fontFamily: 'Inter_18pt-Medium',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  },
  addMoneyText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: 'Inter_18pt-SemiBold',
    fontWeight: 'semibold',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  },
  simpleCreateButton: {
    backgroundColor: '#e0e0e0', // COLORS.card
    borderRadius: 12, // Réduit de 40 à 20
    paddingVertical: 15, // Réduit de 30 à 15
    paddingHorizontal: 18, // Réduit de 40 à 20
    marginHorizontal: 10, // Réduit de 20 à 10
    marginBottom: 15, // Réduit de 30 à 15
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  simpleCreateText: {
    fontSize: 13, // Réduit de 30 à 15
    color: '#0a0a0a',
    fontFamily: 'Inter_18pt-SemiBold',
  },
  mainStatsContainer: {
    flex: 1,
    width: '100%',
    height: '100%', // Hauteur fixe à 100% pour éliminer les espaces
    minHeight: 600, // Hauteur minimale pour assurer un bon affichage
    flexDirection: 'column', // Distribution verticale
    justifyContent: 'flex-start', // Alignement au début
  },
  simpleStatsGrid: {
    flex: 0.85, // 80% de l'espace pour les statistiques
    position: 'relative',
    width: '100%',
    marginTop: 0, // Suppression de la marge pour éliminer le trou
  },
  simpleStatCard: {
    width: '48%',
    height: '48%',
    backgroundColor: '#0A0A0A',
    padding: 24,
    borderRadius: 15,
    borderColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...SHADOWS.lg,
    position: 'absolute',
  },
  simpleStatValue: {
    fontSize: 18,
    color: '#e0e0e0',
    fontFamily: 'Inter_18pt-SemiBold',
    textAlign: 'center',
    marginVertical: 18,
    textShadowColor: 'rgba(255, 255, 255, 0.1)',
    textShadowOffset: { width: 0.4, height: 0.4 },
    textShadowRadius: 0.8,
  },
  simpleStatText: {
    fontSize: 13,
    color: '#B5B5B5',
    fontFamily: 'Inter_18pt-Medium',
    textAlign: 'center',
    lineHeight: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.05)',
    textShadowOffset: { width: 0.2, height: 0.2 },
    textShadowRadius: 0.4,
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
    marginBottom: 32,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 14, // Réduit de 28 à 14
    color: '#e0e0e0',
    fontFamily: 'Inter_18pt-SemiBold',
    textAlign: 'center',
    lineHeight: 18, // Réduit de 36 à 18
    maxWidth: '80%',
  },
  
  // Mission Cards Styles (same as AvailableMissionsScreen)
  missionsSection: {
    marginBottom: 32,
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
    backgroundColor: '#0A0A0A',
    borderRadius: 8, // Réduit de 16 à 8
    padding: 8, // Réduit de 16 à 8
    margin: 4, // Réduit de 8 à 4
    minHeight: 100, // Réduit de 200 à 100
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2A2A2E',
    overflow: 'hidden',
  },
  cardHeaderTwitchLike: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 50, // Réduit de 100 à 50
    height: 50, // Réduit de 100 à 50
    borderRadius: 50, // Réduit de 100 à 50
    marginRight: 10, // Réduit de 20 à 10
    flexShrink: 0,
    elevation: 2, // Réduit de 4 à 2
    borderWidth: 1, // Réduit de 2 à 1
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: 50, // Réduit de 100 à 50
    height: 50, // Réduit de 100 à 50
    borderRadius: 25, // Réduit de 50 à 25
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10, // Réduit de 20 à 10
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 }, // Réduit de 3 à 1.5
    shadowOpacity: 0.1,
    shadowRadius: 3, // Réduit de 6 à 3
    elevation: 2, // Réduit de 4 à 2
    borderWidth: 1, // Réduit de 2 à 1
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  centerNameFollowersBlockk: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: 8, // Réduit de 16 à 8
    minWidth: 0,
  },
  nameAndBadgeContainerRefactored: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  streamerName: {
    fontSize: 15, // Réduit de 30 à 15
    color: '#e0e0e0',
    fontFamily: 'Inter_18pt-SemiBold',
    maxWidth: 150, // Réduit de 300 à 150
    overflow: 'hidden',
    flexShrink: 1,
  },
  streamerFollowersRefactored: {
    fontSize: 12, // Réduit de 24 à 12
    color: '#B5B5B5',
    fontFamily: 'Inter_18pt-Regular',
    alignSelf: 'flex-start',
  },
  priceContainerRefactored: {
    paddingHorizontal: 8, // Réduit de 16 à 8
    paddingVertical: 5, // Réduit de 10 à 5
    borderRadius: 6, // Réduit de 12 à 6
    alignSelf: 'center',
    minWidth: 65, // Réduit de 130 à 65
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E65100',
    shadowOffset: { width: 0, height: 2 }, // Réduit de 4 à 2
    shadowOpacity: 0.3,
    shadowRadius: 4, // Réduit de 8 à 4
    elevation: 3, // Réduit de 6 à 3
    borderWidth: 1,
    borderColor: '#FF8C42',
    borderBottomWidth: 1.5, // Réduit de 3 à 1.5
    borderBottomColor: '#E65100',
  },
  priceText: {
    color: '#e0e0e0',
    fontSize: 13, // Réduit de 26 à 13
    fontFamily: 'Inter_18pt-SemiBold',
    fontWeight: 'semibold',
    textAlign: 'center',
    flexShrink: 0,
  },
  thumbnailContainer: {
    marginBottom: 16,
  },
  thumbnail: {
    width: '100%',
    height: 125, // Réduit de 250 à 125
    backgroundColor: '#f9fafb',
    borderRadius: 6, // Réduit de 12 à 6
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
    fontSize: 9, // Réduit de 18 à 9
    color: '#6b7280',
    fontFamily: 'Inter_18pt-Regular',
    marginTop: 2, // Réduit de 4 à 2
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
    fontSize: 13, // Réduit de 26 à 13
    fontFamily: 'Inter_18pt-Medium',
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
    height: 10, // Réduit de 20 à 10
    backgroundColor: '#E5E7EB',
    borderRadius: 5, // Réduit de 10 à 5
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 10,
  },
  progressPercentage: {
    fontSize: 13, // Réduit de 26 à 13
    fontFamily: 'Inter_18pt-SemiBold',
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
    fontSize: 13, // Réduit de 26 à 13
    fontFamily: 'Inter_18pt-Medium',
    fontWeight: 'semibold',
    color: '#6B7280',
    marginBottom: 2, // Réduit de 4 à 2
  },
  statValue: {
    fontSize: 13, // Réduit de 26 à 13
    fontFamily: 'Inter_18pt-SemiBold',
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
    fontSize: 12, // Réduit de 24 à 12
    fontFamily: 'Inter_18pt-SemiBold',
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },
  balanceTitleContainer: {
    alignSelf: 'center',
    width: '98%', // Même largeur que les blocs stats (100% - 2% pour les marges)
    flex: 0.15, // 20% de l'espace pour la balance
    marginHorizontal: 0, // Pas de marge supplémentaire
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 }, // Réduit de 4 à 2
    shadowOpacity: 0.1,
    shadowRadius: 4, // Réduit de 8 à 4
    elevation: 3, // Réduit de 6 à 3
    borderRadius: 15, // Réduit de 30 à 15
    overflow: 'hidden',
    marginBottom: 0, // Supprimé pour utiliser les % d'espace
  },
  balanceTitleGradient: {
    paddingHorizontal: 20, // Réduit de 40 à 20
    paddingVertical: 0, // Supprimé pour éliminer l'espace vertical interne
    borderRadius: 15, // Réduit de 30 à 15
    borderWidth: 1,
    borderColor: '#333',
    borderBottomWidth: 1.5, // Réduit de 3 à 1.5
    borderBottomColor: '#222',
    backgroundColor: '#0A0A0A',
    flex: 1, // Prend toute la hauteur disponible du conteneur parent
    justifyContent: 'center', // Centre le contenu verticalement
  },
  balanceTitleContent: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  balanceTitleText: {
    fontSize: 20, // Réduit de 40 à 20
    fontFamily: 'Inter_18pt-SemiBold',
    fontWeight: '600',
    color: '#e0e0e0',
    textAlign: 'center',
    lineHeight: 18, // Réduit de 36 à 18
  },
  balanceTitleDescription: {
    fontSize: 12, // Réduit de 24 à 12
    fontFamily: 'Inter_18pt-Regular',
    color: '#B5B5B5',
    textAlign: 'center',
    lineHeight: 11, // Réduit de 22 à 11
    marginTop: 10, // Réduit de 20 à 10
    flexShrink: 1,
  },
  balanceContentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  // TikTok Section Styles
  tiktokSection: {
    marginBottom: 16,
    marginHorizontal: 20,
  },
  tiktokCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    ...SHADOWS.medium,
  },
  tiktokHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tiktokTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginLeft: 8,
  },
  tiktokConnected: {
    alignItems: 'center',
  },
  tiktokProfile: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tiktokUsername: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  tiktokHandle: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  tiktokStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  tiktokStat: {
    alignItems: 'center',
  },
  tiktokStatNumber: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  tiktokStatLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  tiktokManageButton: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tiktokManageText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  tiktokNotConnected: {
    alignItems: 'center',
  },
  tiktokDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  tiktokConnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff0050',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    ...SHADOWS.medium,
  },
  tiktokConnectText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: FONTS.medium,
    marginLeft: 8,
  },
});

export default DashboardScreen; 