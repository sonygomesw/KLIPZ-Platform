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

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        <Text style={styles.backText}>Back to Campaigns</Text>
      </TouchableOpacity>
      
      <View style={styles.campaignInfo}>
        <Text style={styles.campaignTitle}>{campaign.title}</Text>
        <Text style={styles.campaignStatus}>
          {campaign.status === 'active' ? 'Active Campaign' : 'Completed'}
        </Text>
      </View>
    </View>
  );

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
      {/* Campaign Image */}
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
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Campaign Details</Text>
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
  );

  const renderSubmissions = () => (
    <View style={styles.submissionsContainer}>
      {submissions.length === 0 ? (
        <View style={styles.emptySubmissions}>
          <Ionicons name="videocam-outline" size={64} color="#9ca3af" />
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
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderHeader()}
        {renderTabs()}
        
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'submissions' && renderSubmissions()}
        {activeTab === 'settings' && renderSettings()}
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1A1A1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2E',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
    fontFamily: FONTS.medium,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: FONTS.bold,
  },
  campaignStatus: {
    color: '#8B8B8D',
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1E',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 20,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    color: '#8B8B8D',
    fontSize: 14,
    fontFamily: FONTS.medium,
    marginLeft: 8,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  overviewContainer: {
    padding: 20,
  },
  campaignImageContainer: {
    marginBottom: 20,
  },
  campaignImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#2A2A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#8B8B8D',
    fontSize: 16,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2A2A2E',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  statLabel: {
    color: '#8B8B8D',
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  progressPercentage: {
    color: '#4F46E5',
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2A2A2E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
  },
  detailsContainer: {
    backgroundColor: '#2A2A2E',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  detailsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    color: '#8B8B8D',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.medium,
    flex: 1,
    textAlign: 'right',
  },
  submissionsContainer: {
    padding: 20,
  },
  emptySubmissions: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#8B8B8D',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  submissionCard: {
    backgroundColor: '#2A2A2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  submissionInfo: {
    flex: 1,
  },
  submissionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  submissionDate: {
    color: '#8B8B8D',
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  submissionContent: {
    marginBottom: 12,
  },
  submissionUrl: {
    color: '#4F46E5',
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  submissionViews: {
    color: '#8B8B8D',
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  submissionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
    color: COLORS.white,
    fontSize: 14,
    fontFamily: FONTS.medium,
    marginLeft: 4,
  },
  settingsContainer: {
    padding: 20,
  },
  settingsTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  settingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.medium,
    flex: 1,
    marginLeft: 12,
  },
});

export default CampaignDetailScreen; 