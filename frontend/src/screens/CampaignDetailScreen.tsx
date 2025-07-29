import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '../constants';
import { Campaign, Submission, User } from '../types';
import campaignService from '../services/campaignService';

interface CampaignDetailScreenProps {
  user: User;
  campaign: Campaign;
  onBack: () => void;
  onTabChange?: (tab: string) => void;
}

const CampaignDetailScreen: React.FC<CampaignDetailScreenProps> = ({
  user,
  campaign,
  onBack,
  onTabChange = () => {},
}) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'settings'>('overview');

  useEffect(() => {
    loadSubmissions();
  }, [campaign.id]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const submissionsData = await campaignService.getCampaignSubmissions(campaign.id);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error loading submissions:', error);
      Alert.alert('Error', 'Unable to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubmissions();
    setRefreshing(false);
  };

  const handleApproveSubmission = async (submissionId: string) => {
    try {
      await campaignService.approveSubmission(submissionId);
      Alert.alert('Success', 'Submission approved!');
      loadSubmissions(); // Reload to update status
    } catch (error) {
      console.error('Error approving submission:', error);
      Alert.alert('Error', 'Failed to approve submission');
    }
  };

  const handleRejectSubmission = async (submissionId: string) => {
    try {
      await campaignService.rejectSubmission(submissionId);
      Alert.alert('Success', 'Submission rejected!');
      loadSubmissions(); // Reload to update status
    } catch (error) {
      console.error('Error rejecting submission:', error);
      Alert.alert('Error', 'Failed to reject submission');
    }
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
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };



  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
        onPress={() => setActiveTab('overview')}
      >
        <Ionicons 
          name="stats-chart" 
          size={20} 
          color={activeTab === 'overview' ? '#FFFFFF' : '#8B8B8D'} 
        />
        <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
          Overview
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'submissions' && styles.activeTab]}
        onPress={() => setActiveTab('submissions')}
      >
        <Ionicons 
          name="videocam" 
          size={20} 
          color={activeTab === 'submissions' ? '#FFFFFF' : '#8B8B8D'} 
        />
        <Text style={[styles.tabText, activeTab === 'submissions' && styles.activeTabText]}>
          Submissions ({submissions.length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
        onPress={() => setActiveTab('settings')}
      >
        <Ionicons 
          name="settings" 
          size={20} 
          color={activeTab === 'settings' ? '#FFFFFF' : '#8B8B8D'} 
        />
        <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderOverview = () => (
    <View style={styles.overviewContainer}>
      <View style={styles.overviewContent}>
        {/* Left Side - Mission Details */}
        <View style={styles.leftSide}>
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Mission Details</Text>
            
            {/* Campaign Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Budget</Text>
                <Text style={styles.statValue}>{formatCurrency(campaign.budget)}</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Spent</Text>
                <Text style={styles.statValue}>{formatCurrency(campaign.totalSpent || 0)}</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Remaining</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(campaign.budget - (campaign.totalSpent || 0))}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Budget Usage</Text>
                <Text style={styles.progressPercentage}>
                  {Math.round(((campaign.totalSpent || 0) / campaign.budget) * 100)}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${Math.min(((campaign.totalSpent || 0) / campaign.budget) * 100, 100)}%` }
                  ]} 
                />
              </View>
            </View>

            {/* Campaign Details */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>CPM Rate:</Text>
              <Text style={styles.detailValue}>${(campaign.cpm / 10).toFixed(2)} / 1K views</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Min Views:</Text>
              <Text style={styles.detailValue}>{formatViews(campaign.minViewsPerVideo || 10000)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Views:</Text>
              <Text style={styles.detailValue}>{formatViews(campaign.totalViews || 0)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailValue}>{campaign.description}</Text>
            </View>
          </View>
        </View>

        {/* Right Side - Campaign Image */}
        <View style={styles.rightSide}>
          <View style={styles.imageCard}>
            <Text style={styles.imageTitle}>Mission Preview</Text>
            <View style={styles.campaignImageContainer}>
              {campaign.imageUrl ? (
                <Image source={{ uri: campaign.imageUrl }} style={styles.campaignImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image" size={40} color="#999" />
                  <Text style={styles.imagePlaceholderText}>No Image</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSubmissions = () => (
    <View style={styles.submissionsContainer}>
      {submissions.length === 0 ? (
        <View style={styles.emptySubmissions}>
          <Ionicons name="videocam-outline" size={120} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No submissions yet</Text>
          <Text style={styles.emptyText}>
            Clippers haven't submitted any clips for this campaign yet.
          </Text>
        </View>
      ) : (
        submissions.map((submission) => (
          <View key={submission.id} style={styles.submissionCard}>
            <View style={styles.submissionHeader}>
              <View style={styles.submissionInfo}>
                <Text style={styles.submissionTitle}>Clip by {submission.clipperName}</Text>
                <Text style={styles.submissionDate}>
                  {new Date(submission.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: getStatusColor(submission.status) }
              ]}>
                <Text style={styles.statusText}>{getStatusText(submission.status)}</Text>
              </View>
            </View>
            
            <View style={styles.submissionContent}>
              <Text style={styles.submissionUrl}>{submission.tiktokUrl}</Text>
              <Text style={styles.submissionViews}>
                Views: {formatViews(submission.views || 0)}
              </Text>
            </View>
            
            {submission.status === 'pending' && (
              <View style={styles.submissionActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApproveSubmission(submission.id)}
                >
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleRejectSubmission(submission.id)}
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  const renderSettings = () => (
    <View style={styles.settingsContainer}>
      <Text style={styles.settingsTitle}>Campaign Settings</Text>
      
      <TouchableOpacity style={styles.settingItem}>
        <Ionicons name="edit" size={24} color={COLORS.primary} />
        <Text style={styles.settingText}>Edit Campaign</Text>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.settingItem}>
        <Ionicons name="pause" size={24} color="#F59E0B" />
        <Text style={styles.settingText}>Pause Campaign</Text>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.settingItem}>
        <Ionicons name="trash" size={24} color="#EF4444" />
        <Text style={styles.settingText}>Delete Campaign</Text>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pageTitle}>Manage</Text>
      <View style={styles.mainContentContainer}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderTabs()}
          
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'submissions' && renderSubmissions()}
          {activeTab === 'settings' && renderSettings()}
        </ScrollView>
      </View>
      <TouchableOpacity onPress={onBack} style={styles.backButtonBottom}>
        <Ionicons name="arrow-back" size={18} color="#000000" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  scrollView: {
    flex: 1,
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
    borderRadius: 16,
    margin: 12,
    padding: 16,
    flex: 1,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7.5, // Réduit de 15 à 7.5
    marginBottom: 7.5, // Réduit de 15 à 7.5
    borderBottomColor: '#2A2A2E',
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    alignSelf: 'stretch',
    marginHorizontal: 10, // Réduit de 20 à 10
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 }, // Réduit de 4 à 2
    shadowOpacity: 0.1,
    shadowRadius: 4, // Réduit de 8 à 4
    elevation: 3, // Réduit de 6 à 3
    borderRadius: 15, // Réduit de 30 à 15
    overflow: 'hidden',
    marginBottom: 7.5, // Réduit de 15 à 7.5
  },
  headerTitleGradient: {
    paddingHorizontal: 20, // Réduit de 40 à 20
    paddingVertical: 15, // Réduit de 30 à 15
    borderRadius: 15, // Réduit de 30 à 15
    borderWidth: 1,
    borderColor: '#2A2A2E',
    borderBottomWidth: 1.5, // Réduit de 3 à 1.5
    borderBottomColor: '#1A1A1E',
    backgroundColor: '#1A1A1E',
  },
  headerTitleContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22, // Même taille que My Missions
    fontFamily: 'Inter_18pt-SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 18, // Même taille que My Missions
    marginTop: 8, // Réduit de 16 à 8
  },
  headerDescription: {
    fontSize: 14, // Même taille que My Missions
    fontFamily: 'Inter_18pt-Regular',
    color: '#8B8B8D',
    textAlign: 'center',
    lineHeight: 11, // Même taille que My Missions
    marginTop: 6, // Réduit de 12 à 6
    flexShrink: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 8, // Réduit de 16 à 8
    paddingHorizontal: 8, // Réduit de 16 à 8
    paddingVertical: 4, // Réduit de 8 à 4
    backgroundColor: '#2A2A2E',
    borderRadius: 10, // Réduit de 20 à 10
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  backButtonCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: 7.5, // Réduit de 15 à 7.5
    marginHorizontal: 10, // Même largeur que headerTitleContainer
    paddingHorizontal: 8, // Réduit de 16 à 8
    paddingVertical: 4, // Réduit de 8 à 4
    backgroundColor: '#2A2A2E',
    borderRadius: 10, // Réduit de 20 à 10
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  backButtonBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginHorizontal: 10, // Même largeur que headerTitleContainer
    marginBottom: 20, // Réduit de 20 à 10
    paddingHorizontal: 8, // Réduit de 16 à 8
    paddingVertical: 15, // Réduit de 8 à 4
    backgroundColor: '#ffffff',
    borderRadius: 10, // Réduit de 20 à 10
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  backText: {
    color: '#000000',
    fontSize: 14, // Même taille que My Missions
    fontFamily: 'Inter_18pt-SemiBold',
    marginLeft: 4, // Réduit de 8 à 4
  },
  campaignInfo: {
    flex: 1,
  },
  campaignTitle: {
    color: '#FFFFFF',
    fontSize: 14, // Même taille que My Missions
    fontFamily: 'Inter_18pt-SemiBold',
  },
  campaignStatus: {
    color: '#8B8B8D',
    fontSize: 12, // Même taille que My Missions
    fontFamily: 'Inter_18pt-Regular',
    marginTop: 2, // Réduit de 4 à 2
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    gap: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8, // Réduit de 16 à 8
    paddingVertical: 6, // Réduit de 12 à 6
    borderRadius: 8, // Réduit de 16 à 8
    backgroundColor: '#2A2A2E',
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  activeTab: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  tabText: {
    color: '#8B8B8D',
    fontSize: 14, // Même taille que My Missions
    fontFamily: 'Inter_18pt-Medium',
    marginLeft: 4, // Réduit de 8 à 4
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  overviewContainer: {
    padding: 16,
    alignItems: 'center',
  },
  overviewContent: {
    flexDirection: 'row',
    gap: 15,
    justifyContent: 'center',
    alignItems: 'flex-start',
    maxWidth: '100%',
    width: '100%',
  },
  leftSide: {
    flex: 1,
  },
  rightSide: {
    flex: 1,
  },
  detailsCard: {
    backgroundColor: '#1A1A1E',
    borderRadius: 12, // Augmenté pour un look plus moderne
    padding: 20, // Augmenté pour plus d'espace interne
    borderWidth: 1,
    borderColor: '#2A2A2E',
    minHeight: 500, // Ajouté pour utiliser l'espace disponible
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageCard: {
    backgroundColor: '#1A1A1E',
    borderRadius: 12, // Augmenté pour un look plus moderne
    padding: 20, // Augmenté pour plus d'espace interne
    borderWidth: 1,
    borderColor: '#2A2A2E',
    minHeight: 500, // Ajouté pour utiliser l'espace disponible
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageTitle: {
    color: '#FFFFFF',
    fontSize: 16, // Augmenté pour plus de visibilité
    fontFamily: 'Inter_18pt-SemiBold',
    marginTop: 20, // Augmenté pour plus d'espace
    textAlign: 'center',
  },
  campaignImageContainer: {
    marginBottom: 10, // Réduit de 20 à 10
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  campaignImage: {
    width: '100%',
    height: 300, // Augmenté pour utiliser l'espace disponible
    borderRadius: 6, // Réduit de 12 à 6
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 100, // Réduit de 200 à 100
    borderRadius: 6, // Réduit de 12 à 6
    backgroundColor: '#2A2A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#8B8B8D',
    fontSize: 8, // Réduit de 16 à 8
    marginTop: 4, // Réduit de 8 à 4
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10, // Réduit de 20 à 10
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2A2A2E',
    padding: 20, // Réduit de 16 à 8
    borderRadius: 6, // Réduit de 12 à 6
    marginHorizontal: 2, // Réduit de 4 à 2
    marginBottom: 30, // Réduit de 4 à 2
    marginTop: 10, // Réduit de 4 à 2
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  statLabel: {
    color: '#b5b5b5',
    fontSize: 14, // Même taille que My Missions
    fontFamily: 'Inter_18pt-Regular',
    marginBottom: 3, // Réduit de 4 à 2
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 15, // Même taille que My Missions
    fontFamily: 'Inter_18pt-SemiBold',
  },
  progressSection: {
    marginBottom: 10, // Réduit de 20 à 10
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4, // Réduit de 8 à 4
  },
  progressLabel: {
    color: '#FFFFFF',
    fontSize: 15, // Même taille que My Missions
    fontFamily: 'Inter_18pt-Medium',
  },
  progressPercentage: {
    color: '#4F46E5',
    fontSize: 15, // Même taille que My Missions
    fontFamily: 'Inter_18pt-SemiBold',
  },
  progressBar: {
    height: 10, // Réduit de 8 à 4
    backgroundColor: '#2A2A2E',
    borderRadius: 6, // Réduit de 4 à 2
    overflow: 'hidden',
    marginBottom: 10, // Réduit de 4 à 2
    marginTop: 10, // Réduit de 4 à 2
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
  },
  detailsContainer: {
    backgroundColor: '#2A2A2E',
    padding: 10, // Réduit de 20 à 10
    borderRadius: 6, // Réduit de 12 à 6
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  detailsTitle: {
    color: '#FFFFFF',
    fontSize: 16, // Augmenté pour plus de visibilité
    fontFamily: 'Inter_18pt-SemiBold',
    marginBottom: 45, // Augmenté pour plus d'espace
    marginTop: 20, // Augmenté pour plus d'espace
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6, // Réduit de 12 à 6
  },
  detailLabel: {
    color: '#8B8B8D',
    fontSize: 14, // Même taille que My Missions
    fontFamily: 'Inter_18pt-Regular',
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 14, // Même taille que My Missions
    fontFamily: 'Inter_18pt-Medium',
    flex: 1,
    textAlign: 'right',
  },
  submissionsContainer: {
    padding: 10, // Réduit de 20 à 10
  },
  emptySubmissions: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80, // Augmenté pour plus d'espace
    paddingHorizontal: 20, // Ajouté pour centrage horizontal
    flex: 1,
    minHeight: 400, // Ajouté pour utiliser l'espace disponible
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 24, // Augmenté pour plus de visibilité
    fontFamily: 'Inter_18pt-SemiBold',
    marginTop: 20, // Augmenté pour plus d'espace
    marginBottom: 12, // Augmenté pour plus d'espace
    textAlign: 'center',
  },
  emptyText: {
    color: '#8B8B8D',
    fontSize: 16, // Augmenté pour plus de visibilité
    textAlign: 'center',
    lineHeight: 24, // Augmenté pour plus d'espace
    maxWidth: 300, // Limite la largeur pour un meilleur centrage
  },
  submissionCard: {
    backgroundColor: '#2A2A2E',
    borderRadius: 6, // Réduit de 12 à 6
    padding: 8, // Réduit de 16 à 8
    marginBottom: 8, // Réduit de 16 à 8
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6, // Réduit de 12 à 6
  },
  submissionInfo: {
    flex: 1,
  },
  submissionTitle: {
    color: '#FFFFFF',
    fontSize: 12, // Même taille que My Missions
    fontFamily: 'Inter_18pt-SemiBold',
  },
  submissionDate: {
    color: '#8B8B8D',
    fontSize: 9, // Même taille que My Missions
    fontFamily: 'Inter_18pt-Regular',
    marginTop: 1, // Réduit de 2 à 1
  },
  statusBadge: {
    paddingHorizontal: 6, // Réduit de 12 à 6
    paddingVertical: 2, // Réduit de 4 à 2
    borderRadius: 6, // Réduit de 12 à 6
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 9, // Même taille que My Missions
    fontFamily: 'Inter_18pt-Medium',
  },
  submissionContent: {
    marginBottom: 6, // Réduit de 12 à 6
  },
  submissionUrl: {
    color: '#4F46E5',
    fontSize: 9, // Même taille que My Missions
    fontFamily: 'Inter_18pt-Regular',
    marginBottom: 2, // Réduit de 4 à 2
  },
  submissionViews: {
    color: '#8B8B8D',
    fontSize: 9, // Même taille que My Missions
    fontFamily: 'Inter_18pt-Regular',
  },
  submissionActions: {
    flexDirection: 'row',
    gap: 6, // Réduit de 12 à 6
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8, // Réduit de 16 à 8
    paddingVertical: 4, // Réduit de 8 à 4
    borderRadius: 4, // Réduit de 8 à 4
    flex: 1,
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 10, // Même taille que My Missions
    fontFamily: 'Inter_18pt-Medium',
    marginLeft: 2, // Réduit de 4 à 2
  },
  settingsContainer: {
    padding: 10, // Réduit de 20 à 10
  },
  settingsTitle: {
    color: '#FFFFFF',
    fontSize: 10, // Réduit de 20 à 10
    fontFamily: 'Inter_18pt-SemiBold',
    marginBottom: 10, // Réduit de 20 à 10
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2E',
    padding: 8, // Réduit de 16 à 8
    borderRadius: 6, // Réduit de 12 à 6
    marginBottom: 6, // Réduit de 12 à 6
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  settingText: {
    color: '#FFFFFF',
    fontSize: 8, // Réduit de 16 à 8
    fontFamily: 'Inter_18pt-Medium',
    flex: 1,
    marginLeft: 6, // Réduit de 12 à 6
  },
});

export default CampaignDetailScreen; 