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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';
import { User, Campaign, Submission } from '../types';
import campaignService from '../services/campaignService';

interface AdminPanelScreenProps {
  user: User;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSignOut?: () => void;
}

const AdminPanelScreen: React.FC<AdminPanelScreenProps> = ({ 
  user, 
  activeTab = 'AdminPanel',
  onTabChange = () => {},
  onSignOut = () => {}
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState<'campaigns' | 'submissions'>('campaigns');
  const [campaignFilter, setCampaignFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [clipFilter, setClipFilter] = useState<'all' | 'pending' | 'approved'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger toutes les campagnes
      const campaignsData = await campaignService.getCampaigns({ sortBy: 'new' });
      setCampaigns(campaignsData);
      
      // Charger toutes les soumissions
      const allSubmissions: Submission[] = [];
      for (const campaign of campaignsData) {
        try {
          const campaignSubmissions = await campaignService.getCampaignSubmissions(campaign.id);
          allSubmissions.push(...campaignSubmissions);
        } catch (err) {
          console.warn(`Erreur lors du chargement des soumissions pour la campagne ${campaign.id}:`, err);
        }
      }
      setSubmissions(allSubmissions);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données admin:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleApproveSubmission = async (submissionId: string) => {
    try {
      await campaignService.approveSubmission(submissionId);
      Alert.alert('✅ Approuvé', 'Le clip a été approuvé avec succès');
      await loadData(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      Alert.alert('Erreur', 'Impossible d\'approuver le clip');
    }
  };

  const handleRejectSubmission = async (submissionId: string) => {
    try {
      await campaignService.rejectSubmission(submissionId);
      Alert.alert('❌ Rejeté', 'Le clip a été rejeté');
      await loadData(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      Alert.alert('Erreur', 'Impossible de rejeter le clip');
    }
  };

  const handleOpenTikTok = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le lien TikTok');
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'pending': return '#F59E0B';
      case 'paid': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      case 'pending': return 'En attente';
      case 'paid': return 'Payé';
      default: return 'Inconnu';
    }
  };

    const renderCampaignCard = (campaign: Campaign) => {
    const campaignSubmissions = submissions.filter(s => s.campaignId === campaign.id);
    const pendingSubmissions = campaignSubmissions.filter(s => s.status === 'pending');
    
    return (
      <View key={campaign.id} style={styles.campaignCard}>
        {/* Header avec avatar et infos */}
        <View style={styles.campaignHeader}>
          {/* Avatar du streamer */}
          {campaign.streamerAvatar ? (
            <Image 
              source={{ uri: campaign.streamerAvatar }} 
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={16} color="#8B8B8D" />
            </View>
          )}
          
          <View style={styles.campaignInfo}>
            <Text style={styles.campaignTitle} numberOfLines={1}>{campaign.title}</Text>
            <Text style={styles.campaignStreamer}>{campaign.streamerName}</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: campaign.status === 'active' ? '#10B981' : '#6B7280' }]}>
            <Text style={styles.statusText}>{campaign.status === 'active' ? 'En cours' : 'Completed'}</Text>
          </View>
        </View>

        {/* Image de la campagne au milieu */}
        <View style={styles.thumbnailContainer}>
          {campaign.imageUrl ? (
            <Image 
              source={{ uri: campaign.imageUrl }} 
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Ionicons name="videocam" size={24} color="#666" />
            </View>
          )}
        </View>

        {/* Budget et progression */}
        <View style={styles.campaignFinancials}>
          <View style={styles.budgetInfo}>
            <Text style={styles.budgetText}>
              {formatCurrency(campaign.totalSpent || 0)} / {formatCurrency(campaign.budget)}
            </Text>
            <Text style={styles.progressPercentage}>
              {Math.round(((campaign.totalSpent || 0) / campaign.budget) * 100)}%
            </Text>
          </View>
          <Text style={styles.campaignCpm}>{formatCurrency(campaign.cpm)}/1K vues</Text>
        </View>
        
        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[
              styles.progressBar, 
              { width: `${Math.min(((campaign.totalSpent || 0) / campaign.budget) * 100, 100)}%` }
            ]} />
          </View>
        </View>
        
        {/* Stats des soumissions */}
        <View style={styles.submissionStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{campaignSubmissions.length}</Text>
            <Text style={styles.statLabel}>Total clips</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{pendingSubmissions.length}</Text>
            <Text style={styles.statLabel}>In Review</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>
              {campaignSubmissions.filter(s => s.status === 'approved').length}
            </Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSubmissionCard = (submission: Submission) => {
    const campaign = campaigns.find(c => c.id === submission.campaignId);
    
    return (
      <View key={submission.id} style={styles.submissionCard}>
        <View style={styles.submissionHeader}>
          <View style={styles.submissionInfo}>
            <Text style={styles.submissionCampaign}>{campaign?.title || 'Campagne inconnue'}</Text>
            <Text style={styles.submissionClipperEmail}>Clipper ID: {submission.clipperId || 'Inconnu'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(submission.status) }]}>
            <Text style={styles.statusText}>{getStatusText(submission.status)}</Text>
          </View>
        </View>
        
        <View style={styles.submissionStats}>
          <View style={styles.submissionStatItem}>
            <Ionicons name="eye" size={16} color="#8B8B8D" />
            <Text style={styles.submissionStatText}>{formatViews(submission.views || 0)}</Text>
          </View>
          <View style={styles.submissionStatItem}>
            <Ionicons name="wallet" size={16} color="#8B8B8D" />
            <Text style={styles.submissionStatText}>{formatCurrency(submission.earnings || 0)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.submissionStatItem}
            onPress={() => handleOpenTikTok(submission.tiktokUrl)}
          >
            <Ionicons name="logo-tiktok" size={16} color="#FF0050" />
            <Text style={[styles.submissionStatText, { color: '#FF0050' }]}>Voir</Text>
          </TouchableOpacity>
        </View>
        
        {submission.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRejectSubmission(submission.id)}
            >
              <Ionicons name="close" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Rejeter</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApproveSubmission(submission.id)}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Approuver</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const totalSubmissions = submissions.length;
  const approvedSubmissions = submissions.filter(s => s.status === 'approved').length;

    return (
    <View style={styles.container}>
      {/* Titre simple en haut comme Dashboard */}
      <Text style={styles.pageTitle}>Admin Panel</Text>
      
      {/* Stats Overview - Première ligne */}
      <View style={styles.simpleStatsGrid}>
        <View style={[styles.simpleStatCard, styles.cardTopLeft]}>
          <Text style={styles.simpleStatValue}>{campaigns.length}</Text>
          <Text style={styles.simpleStatText}>Total Missions</Text>
        </View>
        <View style={[styles.simpleStatCard, styles.cardTopRight]}>
          <Text style={styles.simpleStatValue}>{totalSubmissions}</Text>
          <Text style={styles.simpleStatText}>Total Clips</Text>
        </View>
        <View style={[styles.simpleStatCard, styles.cardBottomLeft]}>
          <Text style={[styles.simpleStatValue, { color: '#F59E0B' }]}>{pendingSubmissions.length}</Text>
          <Text style={styles.simpleStatText}>In Review</Text>
        </View>
        <View style={[styles.simpleStatCard, styles.cardBottomRight]}>
          <Text style={[styles.simpleStatValue, { color: '#10B981' }]}>{approvedSubmissions}</Text>
          <Text style={styles.simpleStatText}>Approved</Text>
        </View>
      </View>

      {/* Stats Overview - Deuxième ligne */}
      <View style={styles.simpleStatsGrid}>
        <View style={[styles.simpleStatCard, styles.cardTopLeft]}>
          <Text style={[styles.simpleStatValue, { color: '#3B82F6' }]}>
            {formatCurrency(campaigns.reduce((total, campaign) => total + (campaign.budget || 0), 0))}
          </Text>
          <Text style={styles.simpleStatText}>Total Deposit Streamer</Text>
        </View>
        <View style={[styles.simpleStatCard, styles.cardTopRight]}>
          <Text style={[styles.simpleStatValue, { color: '#8B5CF6' }]}>$0.00</Text>
          <Text style={styles.simpleStatText}>Total Deposit Youtubeur</Text>
        </View>
        <View style={[styles.simpleStatCard, styles.cardBottomLeft]}>
          <Text style={[styles.simpleStatValue, { color: '#10B981' }]}>
            {formatCurrency(submissions.reduce((total, submission) => total + (submission.earnings || 0), 0))}
          </Text>
          <Text style={styles.simpleStatText}>Total Earnings Clipper</Text>
        </View>
        <View style={[styles.simpleStatCard, styles.cardBottomRight]}>
          <Text style={[styles.simpleStatValue, { color: '#FFFFFF' }]}>
            {formatViews(submissions.reduce((total, submission) => total + (submission.views || 0), 0))}
          </Text>
          <Text style={styles.simpleStatText}>Total Views Clips</Text>
        </View>
      </View>
      
      {/* View Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeView === 'campaigns' && styles.activeTab]}
          onPress={() => setActiveView('campaigns')}
        >
          <Text style={[styles.tabText, activeView === 'campaigns' && styles.activeTabText]}>
            Missions ({campaigns.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeView === 'submissions' && styles.activeTab]}
          onPress={() => setActiveView('submissions')}
        >
          <Text style={[styles.tabText, activeView === 'submissions' && styles.activeTabText]}>
            Clips ({totalSubmissions})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      {activeView === 'campaigns' ? (
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, campaignFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setCampaignFilter('all')}
          >
            <Text style={[styles.filterButtonText, campaignFilter === 'all' && styles.filterButtonTextActive]}>
              Toutes ({campaigns.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, campaignFilter === 'active' && styles.filterButtonActive]}
            onPress={() => setCampaignFilter('active')}
          >
            <Text style={[styles.filterButtonText, campaignFilter === 'active' && styles.filterButtonTextActive]}>
              En cours ({campaigns.filter(c => c.status === 'active').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, campaignFilter === 'completed' && styles.filterButtonActive]}
            onPress={() => setCampaignFilter('completed')}
          >
            <Text style={[styles.filterButtonText, campaignFilter === 'completed' && styles.filterButtonTextActive]}>
              Completed ({campaigns.filter(c => c.status === 'completed').length})
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, clipFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setClipFilter('all')}
          >
            <Text style={[styles.filterButtonText, clipFilter === 'all' && styles.filterButtonTextActive]}>
              Tous ({totalSubmissions})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, clipFilter === 'pending' && styles.filterButtonActive]}
            onPress={() => setClipFilter('pending')}
          >
            <Text style={[styles.filterButtonText, clipFilter === 'pending' && styles.filterButtonTextActive]}>
              In Review ({pendingSubmissions.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, clipFilter === 'approved' && styles.filterButtonActive]}
            onPress={() => setClipFilter('approved')}
          >
            <Text style={[styles.filterButtonText, clipFilter === 'approved' && styles.filterButtonTextActive]}>
              Approved ({approvedSubmissions})
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
              {/* Content */}
        <ScrollView 
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : (
            <>
              {activeView === 'campaigns' ? (
                (() => {
                  const filteredCampaigns = campaignFilter === 'all' 
                    ? campaigns 
                    : campaigns.filter(c => c.status === campaignFilter);
                  
                  return filteredCampaigns.length > 0 ? (
                    <View style={styles.contentGrid}>
                      {filteredCampaigns.map(renderCampaignCard)}
                    </View>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>Aucune campagne trouvée</Text>
                    </View>
                  );
                })()
              ) : (
                (() => {
                  const filteredSubmissions = clipFilter === 'all' 
                    ? submissions 
                    : submissions.filter(s => s.status === clipFilter);
                  
                  return filteredSubmissions.length > 0 ? (
                    <View style={styles.contentGrid}>
                      {filteredSubmissions.map(renderSubmissionCard)}
                    </View>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>Aucun clip trouvé</Text>
                    </View>
                  );
                })()
              )}
            </>
          )}
        </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  pageTitle: {
    fontSize: 14,
    fontWeight: 'semibold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: -30,
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  statCardNumber: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#8B8B8D',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#181818',
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#4a5cf9',
  },
  tabText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#8B8B8D',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  campaignCard: {
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    width: '31%',
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  campaignStreamer: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#8B8B8D',
  },
  campaignStats: {
    alignItems: 'flex-end',
  },
  campaignBudget: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#4a5cf9',
    marginBottom: 4,
  },
  campaignCpm: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#8B8B8D',
  },
  submissionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#8B8B8D',
  },
  submissionCard: {
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    width: '31%',
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  submissionInfo: {
    flex: 1,
  },
  submissionCampaign: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  submissionClipperEmail: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#8B8B8D',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  },
  submissionStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  submissionStatText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#8B8B8D',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 4,
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#8B8B8D',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#8B8B8D',
  },
  // Styles du header
  balanceTitleContainer: {
    marginBottom: 20,
  },
  balanceTitleGradient: {
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  balanceTitleContent: {
    flexDirection: 'column',
  },
  balanceContentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLeft: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#8B8B8D',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  // Styles de la grille de stats
  simpleStatsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  simpleStatCard: {
    flex: 1,
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cardTopLeft: {},
  cardTopRight: {},
  cardBottomLeft: {},
  cardBottomRight: {},
  simpleStatValue: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  simpleStatText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#8B8B8D',
    textAlign: 'center',
  },
  // Styles pour les boutons de filtre
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#181818',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#4a5cf9',
    borderColor: '#4a5cf9',
  },
  filterButtonText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#8B8B8D',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  // Styles pour les avatars et images
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailContainer: {
    marginVertical: 12,
  },
  thumbnailImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  campaignFinancials: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  progressPercentage: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#8B8B8D',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBackground: {
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#4a5cf9',
    borderRadius: 2,
  },
});

export default AdminPanelScreen; 