import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';
import { Campaign, Submission, User } from '../types';
import campaignService from '../services/campaignService';
import Button from '../components/Button';
import ResponsiveLayout from '../components/ResponsiveLayout';

interface CampaignDetailScreenProps {
  user: User;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSignOut?: () => void;
}

const CampaignDetailScreen: React.FC<CampaignDetailScreenProps> = ({
  user,
  activeTab = 'Dashboard',
  onTabChange = () => {},
  onSignOut = () => {}
}) => {
  const [campaign, setCampaign] = useState<Campaign>({} as Campaign);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // For My Clips, we load the streamer's campaigns
    if (user.role === 'streamer') {
      loadStreamerCampaigns();
    }
  }, []);

  const loadStreamerCampaigns = async () => {
    try {
      const campaigns = await campaignService.getStreamerCampaigns(user.id);
      if (campaigns.length > 0) {
        setCampaign(campaigns[0]); // Take the first campaign as an example
        loadSubmissions();
      }
    } catch (error) {
      console.error('❌ Error loading streamer campaigns:', error);
    }
  };

  const loadSubmissions = async () => {
    try {
      if (campaign.id) {
      const submissionsData = await campaignService.getCampaignSubmissions(campaign.id);
      setSubmissions(submissionsData);
      }
    } catch (error) {
      console.error('Error loading des soumissions:', error);
    }
  };

  const handleSubmitClip = async () => {
    if (!tiktokUrl.trim()) {
      Alert.alert('Error', 'Veuillez entrer une URL TikTok valide');
      return;
    }

    setSubmitting(true);
    try {
      // Submit participation directly to the campaign
      await campaignService.submitClip(user.id, {
        campaignId: campaign.id,
        tiktokUrl: tiktokUrl.trim(),
        views: 0, // Les vues seront déclarées plus tard
        earnings: 0 // Les gains seront calculés plus tard
      });

      setShowSubmitModal(false);
      setTiktokUrl('');
      
      Alert.alert(
        'Participation soumise !',
        'Votre clip a été soumis avec succès. Vous pourrez déclarer vos vues plus tard dans "Mes Déclarations".',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveSubmission = async (submissionId: string) => {
    try {
      await campaignService.approveSubmission(submissionId);
      loadSubmissions();
      Alert.alert('Success', 'Soumission approuvée !');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Échec de l\'approbation');
    }
  };

  const handleRejectSubmission = async (submissionId: string) => {
    try {
      await campaignService.rejectSubmission(submissionId);
      loadSubmissions();
      Alert.alert('Success', 'Soumission rejetée');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Rejection failed');
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '€0.00';
    return `€${amount.toFixed(2)}`;
  };

  const formatFollowers = (followers: number | undefined) => {
    if (followers === undefined || followers === null) return '0';
    if (followers >= 1000000) {
      return `${(followers / 1000000).toFixed(1)}M`;
    } else if (followers >= 1000) {
      return `${(followers / 1000).toFixed(1)}K`;
    }
    return followers.toString();
  };

  const getProgressPercentage = () => {
    if (campaign.budget === 0) return 0;
    return Math.min((campaign.totalSpent / campaign.budget) * 100, 100);
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage < 50) return '#FF6B35';
    if (percentage < 80) return '#FFB84D';
    return '#4CAF50';
  };

  const renderSubmitModal = () => (
    <Modal
      visible={showSubmitModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowSubmitModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowSubmitModal(false)}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Soumettre votre clip</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>URL TikTok *</Text>
            <TextInput
              style={styles.input}
              value={tiktokUrl}
              onChangeText={setTiktokUrl}
              placeholder="https://tiktok.com/@username/video/123456789"
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={styles.helperText}>
              Copy the full URL of your TikTok video for this campaign
            </Text>
          </View>

          <View style={styles.criteriaCard}>
            <Text style={styles.criteriaTitle}>Critères à respecter :</Text>
            <View style={styles.criteriaList}>
              <View style={styles.criteriaItem}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.teal} />
                <Text style={styles.criteriaText}>
                  Durée max: {campaign.criteria?.duration || 'No spécifiée'} secondes
                </Text>
              </View>
              <View style={styles.criteriaItem}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.teal} />
                <Text style={styles.criteriaText}>
                  Style: {campaign.criteria?.style || 'No spécifié'}
                </Text>
              </View>
              <View style={styles.criteriaItem}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.teal} />
                <Text style={styles.criteriaText}>
                  Hashtags: {campaign.criteria?.hashtags?.join(', ') || 'No spécifiés'}
                </Text>
              </View>
            </View>
          </View>

          <Button
            title="Soumettre le clip"
            onPress={handleSubmitClip}
            loading={submitting}
            style={[styles.submitButton, { backgroundColor: '#000000' }]}
            textStyle={{ color: '#FFFFFF' }}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderSubmissionItem = (submission: Submission) => (
    <View key={submission.id} style={styles.submissionCard}>
      <View style={styles.submissionHeader}>
        <Text style={styles.submissionUrl} numberOfLines={1}>
          {submission.tiktokUrl}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(submission.status) }
        ]}>
          <Text style={styles.statusText}>{submission.status}</Text>
        </View>
      </View>
      
      <View style={styles.submissionStats}>
        <Text style={styles.submissionStat}>
          {submission.views.toLocaleString()} vues
        </Text>
        <Text style={styles.submissionStat}>
          {formatCurrency(submission.earnings)} gagnés
        </Text>
      </View>

      {user.role === 'streamer' && submission.status === 'pending' && (
        <View style={styles.submissionActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApproveSubmission(submission.id)}
          >
            <Text style={styles.actionButtonText}>Approuver</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRejectSubmission(submission.id)}
          >
            <Text style={styles.actionButtonText}>Rejeter</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return COLORS.teal;
      case 'pending':
        return COLORS.purple;
      case 'rejected':
        return COLORS.primarySolid;
      default:
        return COLORS.textSecondary;
    }
  };

  const campaignContent = (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {campaign.id ? (
        <>
      <View style={styles.header}>
            <Text style={styles.title}>Campaign: {campaign.title || 'Untitled'}</Text>
      </View>

        {/* Campaign Card */}
        <LinearGradient
          colors={['#FF6B35', '#9146FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
        <View style={styles.campaignCard}>
          <View style={styles.campaignHeader}>
            <View style={styles.streamerInfo}>
              <Image
                source={{
                  uri: campaign.streamerAvatar || 'https://via.placeholder.com/40x40/6366F1/FFFFFF?text=S'
                }}
                style={styles.avatar}
              />
              <View style={styles.streamerDetails}>
                <Text style={styles.streamerName}>{campaign.streamerName}</Text>
              </View>
            </View>
          </View>

          <View style={styles.campaignContent}>
            <View style={styles.leftSection}>
              <View style={styles.tiktokIcon}>
                <Ionicons name="logo-tiktok" size={32} color="#000000" />
              </View>
            </View>

            <View style={styles.centerSection}>
              <View style={styles.cpmBadge}>
                  <Text style={styles.cpmText}>{campaign.cpm?.toFixed(2) || '0.00'}$US / 1K</Text>
              </View>
            </View>

            <View style={styles.rightSection}>
              <View style={styles.twitchIcon}>
                <Ionicons name="logo-twitch" size={32} color="#9146FF" />
              </View>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${getProgressPercentage()}%`,
                    backgroundColor: getProgressColor()
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {formatCurrency(campaign.totalSpent)} / {formatCurrency(campaign.budget)} versés
            </Text>
          </View>
        </View>
        </LinearGradient>

        {/* Campaign Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{campaign.description}</Text>

          <Text style={styles.sectionTitle}>Critères</Text>
          <View style={styles.criteriaList}>
            <View style={styles.criteriaItem}>
              <Ionicons name="time-outline" size={20} color={COLORS.primarySolid} />
              <Text style={styles.criteriaText}>
                Durée maximale: {campaign.criteria?.duration || 'No spécifiée'} secondes
              </Text>
            </View>
            <View style={styles.criteriaItem}>
              <Ionicons name="brush-outline" size={20} color={COLORS.lightPurple} />
              <Text style={styles.criteriaText}>
                Style: {campaign.criteria?.style || 'No spécifié'}
              </Text>
            </View>
            <View style={styles.criteriaItem}>
              <Ionicons name="pricetag-outline" size={20} color={COLORS.accent} />
              <Text style={styles.criteriaText}>
                Hashtags: {campaign.criteria?.hashtags?.join(', ') || 'No spécifiés'}
              </Text>
            </View>
          </View>
        </View>

        {/* Submissions (for streamers) */}
          {user.role === 'streamer' && (
          <View style={styles.submissionsSection}>
            <Text style={styles.sectionTitle}>
              Soumissions ({submissions.length})
            </Text>
            {submissions.length > 0 ? (
              submissions.map(renderSubmissionItem)
            ) : (
              <Text style={styles.emptyText}>No submissions yet</Text>
            )}
          </View>
        )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No campaigns</Text>
          <Text style={styles.emptyText}>
                            No campaign found to display clips
          </Text>
        </View>
      )}

      {renderSubmitModal()}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {campaignContent}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySolid,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: COLORS.primarySolid,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    minWidth: 50,
    justifyContent: 'center',
  },
  title: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
    padding: SIZES.spacing.lg,
  },
  gradientBorder: {
    borderRadius: 18,
    padding: 3,
    marginBottom: 24,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  campaignCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 16,
    ...SHADOWS.base,
  },
  campaignHeader: {
    marginBottom: 16,
  },
  streamerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  streamerDetails: {
    flex: 1,
  },
  streamerName: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 2,
  },
  followersText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  campaignContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  tiktokIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  twitchIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#9146FF',
  },
  cpmBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cpmText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  progressSection: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontFamily: FONTS.medium,
  },
  detailsCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.lg,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.spacing.base,
  },
  description: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    lineHeight: 22,
    marginBottom: SIZES.spacing.lg,
  },
  criteriaList: {
    gap: SIZES.spacing.base,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  criteriaText: {
    fontSize: SIZES.base,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    marginLeft: SIZES.spacing.sm,
    flex: 1,
  },
  actionButton: {
    marginBottom: SIZES.spacing.lg,
  },
  submissionsSection: {
    marginTop: SIZES.spacing.lg,
  },
  submissionCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius.base,
    padding: SIZES.spacing.base,
    marginBottom: SIZES.spacing.sm,
    ...SHADOWS.sm,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  submissionUrl: {
    fontSize: SIZES.sm,
    color: COLORS.primarySolid,
    fontFamily: FONTS.medium,
    flex: 1,
    marginRight: SIZES.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: SIZES.spacing.sm,
    paddingVertical: SIZES.spacing.xs,
    borderRadius: SIZES.radius.sm,
  },
  statusText: {
    fontSize: SIZES.xs,
    color: COLORS.white,
    fontFamily: FONTS.medium,
    textTransform: 'uppercase',
  },
  submissionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.spacing.sm,
  },
  submissionStat: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  submissionActions: {
    flexDirection: 'row',
    gap: SIZES.spacing.sm,
  },
  approveButton: {
    backgroundColor: COLORS.teal,
    flex: 1,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.sm,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: COLORS.error,
    flex: 1,
    paddingVertical: SIZES.spacing.sm,
    borderRadius: SIZES.radius.sm,
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: SIZES.sm,
    fontFamily: FONTS.medium,
  },
  emptyText: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    padding: SIZES.spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.spacing.xl,
  },
  emptyTitle: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.spacing.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCancel: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  modalTitle: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  modalContent: {
    flex: 1,
    padding: SIZES.spacing.lg,
  },
  inputGroup: {
    marginBottom: SIZES.spacing.lg,
  },
  label: {
    fontSize: SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: SIZES.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius.base,
    padding: SIZES.spacing.base,
    fontSize: SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  helperText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SIZES.spacing.xs,
  },
  criteriaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.base,
    padding: SIZES.spacing.base,
    marginBottom: SIZES.spacing.lg,
  },
  criteriaTitle: {
    fontSize: SIZES.base,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.spacing.sm,
  },
  submitButton: {
    marginTop: SIZES.spacing.base,
  },
});

export default CampaignDetailScreen; 