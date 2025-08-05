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
  TextInput,
  Platform,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '../constants';
import { Campaign, Submission, User } from '../types';
import campaignService from '../services/campaignService';
import ResponsiveGrid from '../components/ResponsiveGrid';
import { useResponsive, GRID_CONFIG } from '../hooks/useResponsive';

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
  
  // Hook responsive pour le système de grille
  const responsive = useResponsive();
  
  // États pour les settings
  const [editableTitle, setEditableTitle] = useState(campaign.title || '');
  const [editableDescription, setEditableDescription] = useState(campaign.description || '');
  const [addBudgetAmount, setAddBudgetAmount] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, [campaign.id]);

  // Fonction pour ajouter du budget
  const handleAddBudget = () => {
    const amountToAdd = Number(addBudgetAmount) || 0;
    if (amountToAdd > 0 && user.balance >= amountToAdd) {
      // Ici on appellerait une fonction pour :
      // 1. Débiter le user.balance
      // 2. Augmenter le campaign.budget
      console.log(`Adding $${amountToAdd} to campaign budget`);
      setAddBudgetAmount('');
    } else {
      alert('Insufficient balance or invalid amount');
    }
  };

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

  // Fonction pour récupérer le thumbnail via un service API
  const getTikTokThumbnailFromAPI = async (tiktokUrl: string): Promise<string | null> => {
    try {
      console.log('🎯 Récupération thumbnail via API pour:', tiktokUrl);
      
      // Utiliser l'API oEmbed de TikTok directement (pas de CORS)
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(tiktokUrl)}`;
      
      const response = await fetch(oembedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Données oEmbed récupérées:', data);
        
        if (data.thumbnail_url) {
          console.log('✅ Thumbnail trouvé via oEmbed:', data.thumbnail_url);
          return data.thumbnail_url;
        }
      }
      
      console.log('❌ oEmbed failed, trying alternative API');
      
      // Alternative: Utiliser un service public sans CORS
      try {
        const alternativeUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(tiktokUrl)}`;
        const altResponse = await fetch(alternativeUrl);
        
        if (altResponse.ok) {
          const altData = await altResponse.json();
          console.log('✅ Données alternative API:', altData);
          
          if (altData.video && altData.video.cover) {
            return altData.video.cover;
          }
        }
      } catch (altError) {
        console.log('❌ Alternative API failed:', altError);
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Erreur API thumbnail:', error);
      return null;
    }
  };

  // Fonction pour extraire l'ID TikTok et générer l'URL du thumbnail
  const getTikTokThumbnail = (tiktokUrl: string): string | null => {
    try {
      console.log('🎯 Extraction thumbnail pour URL:', tiktokUrl);
      
      // Extraire l'ID de la vidéo TikTok depuis l'URL
      const regex = /\/video\/(\d+)/;
      const match = tiktokUrl.match(regex);
      
      if (match && match[1]) {
        const videoId = match[1];
        console.log('🎯 ID vidéo extrait:', videoId);
        
        // Méthode 1: Essayer le format thumbnail TikTok mis à jour
        return `https://p16-sign-sg.tiktokcdn.com/aweme/100x100/${videoId}.jpeg`;
      }
      
      console.log('❌ Impossible d\'extraire l\'ID de la vidéo');
      return null;
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération de l\'URL:', error);
      return null;
    }
  };

  // Fonction pour essayer différentes URLs si la première échoue
  const getThumbnailWithFallbacks = (tiktokUrl: string): string[] => {
    const regex = /\/video\/(\d+)/;
    const match = tiktokUrl.match(regex);
    
    if (match && match[1]) {
      const videoId = match[1];
      return [
        `https://p16-sign-sg.tiktokcdn.com/aweme/100x100/${videoId}.jpeg`,
        `https://p16-va.tiktokcdn.com/img/tos-useast2a-v-2774/${videoId}~tplv-resize:100:100.jpeg`,
        `https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/${videoId}.jpeg`,
        `https://www.tiktok.com/api/img/?itemId=${videoId}`
      ];
    }
    return [];
  };

  const renderSubmissionCard = (submission: Submission) => {
    const thumbnailUrl = getTikTokThumbnail(submission.tiktokUrl);
    const fallbackUrls = getThumbnailWithFallbacks(submission.tiktokUrl);
    
    // Composant pour gérer les fallbacks d'images
    const TikTokThumbnail = ({ urls, tiktokUrl, style }: { urls: string[], tiktokUrl: string, style: any }) => {
      const [currentIndex, setCurrentIndex] = useState(0);
      const [hasError, setHasError] = useState(false);
      const [apiThumbnail, setApiThumbnail] = useState<string | null>(null);
      const [isLoadingApi, setIsLoadingApi] = useState(true);
      
      useEffect(() => {
        // Essayer d'abord l'API backend
        getTikTokThumbnailFromAPI(tiktokUrl).then((apiUrl) => {
          if (apiUrl) {
            setApiThumbnail(apiUrl);
          }
          setIsLoadingApi(false);
        }).catch(() => {
          setIsLoadingApi(false);
        });
      }, [tiktokUrl]);
      
      const handleError = () => {
        console.log(`❌ Erreur URL ${currentIndex + 1}:`, urls[currentIndex]);
        if (currentIndex < urls.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setHasError(false);
        } else {
          setHasError(true);
        }
      };
      
      const handleLoad = () => {
        console.log(`✅ Succès URL ${currentIndex + 1}:`, urls[currentIndex]);
      };
      
      const handleApiError = () => {
        console.log('❌ Erreur API thumbnail, passage aux fallbacks');
        setApiThumbnail(null);
      };
      
      const handleApiLoad = () => {
        console.log('✅ Succès API thumbnail:', apiThumbnail);
      };
      
      if (isLoadingApi) {
        return (
          <View style={[style, styles.thumbnailFallback]}>
            <View style={styles.thumbnailPlaceholder}>
              <Ionicons name="reload" size={32} color="#8B8B8D" />
              <Text style={styles.thumbnailPlaceholderText}>Loading...</Text>
            </View>
          </View>
        );
      }
      
      // Si on a un thumbnail de l'API, l'utiliser en priorité
      if (apiThumbnail) {
        return (
          <Image 
            source={{ uri: apiThumbnail }} 
            style={style}
            resizeMode="cover"
            onError={handleApiError}
            onLoad={handleApiLoad}
          />
        );
      }
      
      // Sinon, utiliser les fallbacks classiques
      if (hasError || !urls[currentIndex]) {
        return (
          <View style={[style, styles.thumbnailFallback]}>
            <View style={styles.thumbnailPlaceholder}>
              <Ionicons name="videocam-outline" size={32} color="#8B8B8D" />
              <Text style={styles.thumbnailPlaceholderText}>Video Preview</Text>
            </View>
          </View>
        );
      }
      
      return (
        <Image 
          source={{ uri: urls[currentIndex] }} 
          style={style}
          resizeMode="cover"
          onError={handleError}
          onLoad={handleLoad}
        />
      );
    };
    
    return (
      <View key={submission.id} style={styles.submissionCard}>
        {/* Thumbnail TikTok */}
        <View style={styles.thumbnailContainer}>
          <TikTokThumbnail urls={fallbackUrls} tiktokUrl={submission.tiktokUrl} style={styles.thumbnail} />
          <View style={styles.thumbnailOverlay}>
            <Ionicons name="logo-tiktok" size={20} color="#FFFFFF" />
          </View>
        </View>
        
        <View style={styles.submissionHeader}>
          <View style={styles.submissionInfo}>
            <Text style={styles.submissionTitle}>Clip by {submission.clipperName}</Text>
            <Text style={styles.submissionDate}>
              {new Date((submission as any).createdAt || Date.now()).toLocaleDateString()}
            </Text>
          </View>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(submission.status) }
          ]}>
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
            onPress={() => Linking.openURL(submission.tiktokUrl)}
          >
            <Ionicons name="logo-tiktok" size={16} color="#FF0050" />
            <Text style={[styles.submissionStatText, { color: '#FF0050' }]}>View</Text>
          </TouchableOpacity>
        </View>
        
        {/* Lien TikTok complet */}
        <TouchableOpacity 
          style={styles.linkContainer}
          onPress={() => Linking.openURL(submission.tiktokUrl)}
        >
          <Ionicons name="link" size={14} color="#8B8B8D" />
          <Text style={styles.linkText} numberOfLines={1}>
            {submission.tiktokUrl.replace('https://', '')}
          </Text>
          <Ionicons name="open-outline" size={14} color="#8B8B8D" />
        </TouchableOpacity>
        
        {submission.status === 'pending' && (
          <View style={styles.submissionActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRejectSubmission(submission.id)}
            >
              <Ionicons name="close" size={14} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApproveSubmission(submission.id)}
            >
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {/* Petit bouton Back à gauche */}
      <TouchableOpacity onPress={onBack} style={styles.backButtonLeft}>
        <Ionicons name="arrow-back" size={22} color="#8B8B8D" />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
        onPress={() => setActiveTab('overview')}
      >
        <Ionicons 
          name="analytics" 
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
              <Text style={styles.detailValue}>{formatViews((campaign as any).minViewsPerVideo || 10000)}</Text>
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
          {submissions.map(renderSubmissionCard)}
        </ResponsiveGrid>
      )}
    </View>
  );

  const renderSettings = () => {
    return (
      <View style={styles.settingsContainer}>
        <View style={styles.mainContent}>
          {/* Left Side - Form */}
          <View style={styles.leftSide}>
            <View style={styles.setupCard}>
              <View style={styles.setupHeader}>
                <Text style={styles.setupTitle}>Edit</Text>
                <View style={styles.helpIcon}>
                  <Ionicons name="create-outline" size={20} color={COLORS.textSecondary} />
                </View>
              </View>

              {/* Title Input */}
              <View style={styles.modernInputGroup}>
                <Text style={styles.modernLabel}>Title *</Text>
                <TextInput
                  style={styles.modernInput}
                  value={editableTitle}
                  onChangeText={setEditableTitle}
                  placeholder="KLIPZ Mission"
                  placeholderTextColor={COLORS.textLight}
                  maxLength={100}
                />
              </View>

              {/* Description */}
              <View style={styles.modernInputGroup}>
                <Text style={styles.modernLabel}>Description *</Text>
                <TextInput
                  style={[styles.modernInput, styles.textArea]}
                  value={editableDescription}
                  onChangeText={setEditableDescription}
                  placeholder="Describe what kind of clips you want..."
                  placeholderTextColor={COLORS.textLight}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
              </View>

              {/* Current Budget Display */}
              <View style={styles.modernInputGroup}>
                <Text style={styles.modernLabel}>Current Budget</Text>
                <View style={styles.budgetDisplayContainer}>
                  <Text style={styles.budgetDisplayText}>${campaign.budget || 0}</Text>
                  <Text style={styles.budgetDisplayLabel}>USD</Text>
                </View>
              </View>

              {/* Add Budget Section */}
              <View style={styles.modernInputGroup}>
                <Text style={styles.modernLabel}>Add Budget</Text>
                <Text style={styles.balanceText}>Your balance: ${user.balance || 0}</Text>
                <View style={styles.addBudgetContainer}>
                  <Text style={styles.dollarSign}>$</Text>
                  <TextInput
                    style={styles.addBudgetInput}
                    value={addBudgetAmount}
                    onChangeText={setAddBudgetAmount}
                    placeholder="0"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity style={styles.addBudgetButton} onPress={handleAddBudget}>
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text style={styles.addBudgetButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.autoApproveText}>
                All submissions will be auto-approved after 48 hours if still pending.
              </Text>
            </View>
          </View>

          {/* Right Side - Campaign Actions */}
          <View style={styles.rightSide}>
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Campaign Actions</Text>
              
              {/* Platform Link */}
              <View style={styles.modernInputGroup}>
                <Text style={styles.modernLabel}>
                  Twitch Rediffusion Link *
                </Text>
                <TextInput
                  style={styles.modernInput}
                  placeholder="https://www.twitch.tv/videos/..."
                  placeholderTextColor={COLORS.textLight}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>

              {/* TikTok Clips Requirements - Non modifiable */}
              <View style={styles.modernInputGroup}>
                <Text style={styles.modernLabel}>TikTok clips requirements *</Text>
                <TextInput
                  style={[styles.modernInput, styles.textArea, styles.disabledInput]}
                  placeholder="Describe the specific requirements for TikTok clips..."
                  placeholderTextColor={COLORS.textLight}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  editable={false}
                />
              </View>

              {/* Save Button */}
              <View style={styles.createButtonContainer}>
                <TouchableOpacity 
                  style={styles.createButton}
                >
                  <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>
                    Save Changes
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Message si suppression en cours */}
              {campaign.status === 'pending_deletion' && (
                <View style={styles.deletionWarningContainer}>
                  <View style={styles.deletionWarningIcon}>
                    <Ionicons name="warning" size={20} color="#FF6B35" />
                  </View>
                  <View style={styles.deletionWarningContent}>
                    <Text style={styles.deletionWarningTitle}>
                      Suppression en cours
                    </Text>
                    <Text style={styles.deletionWarningText}>
                      Cette mission sera automatiquement supprimée une fois que toutes les submissions seront traitées. Le budget restant sera remboursé.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181818',
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
    backgroundColor: '#181818',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    width: '100%', // ResponsiveGrid gère la largeur
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2A2A2A', // fallback color
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 6,
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
  statusText: {
    color: '#FFFFFF',
    fontSize: 9, // Même taille que My Missions
    fontFamily: 'Inter_18pt-Medium',
  },
  submissionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  submissionStatItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  submissionStatText: {
    color: '#8B8B8D',
    fontSize: 10,
    fontFamily: 'Inter_18pt-Medium',
    marginTop: 3,
  },
  submissionActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#5146e6',
  },
  rejectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333236',
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
  mainContent: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 7,
    gap: 11,
    backgroundColor: '#181818',
    width: '100%',
    flex: 1,
    minHeight: 0,
  },
  leftSide: {
    flex: 1,
    maxWidth: '55%',
    minHeight: 0,
  },
  rightSide: {
    flex: 1,
    maxWidth: '45%',
    minHeight: 0,
  },
  setupCard: {
    backgroundColor: '#1A1A1E',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2E',
    flex: 1,
    minHeight: 0,
  },
  setupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
  },
  setupTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  helpIcon: {
    padding: 4,
  },
  modernInputGroup: {
    marginBottom: 14,
  },
  modernLabel: {
    color: '#E5E5E7',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 5,
  },
  modernInput: {
    backgroundColor: '#2A2A2E',
    borderRadius: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    fontSize: 11,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3E',
    ...(Platform.OS === 'web' && { outline: 'none' }),
  },
  textArea: {
    height: 51,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetInput: {
    backgroundColor: '#2A2A2E',
    borderRadius: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    fontSize: 11,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3E',
    flex: 1,
    marginRight: 5,
    ...(Platform.OS === 'web' && { outline: 'none' }),
  },
  incrementButton: {
    padding: 5,
    backgroundColor: '#4F46E5',
    borderRadius: 5,
    marginLeft: 5,
  },
  currencySelector: {
    backgroundColor: '#2A2A2E',
    borderRadius: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3E',
    minWidth: 42,
  },
  currencyText: {
    color: '#FFFFFF',
    fontSize: 11,
    marginRight: 1,
  },
  rewardSection: {
    marginBottom: 28,
  },
  rewardRateContainer: {
    backgroundColor: '#2A2A2E',
    borderRadius: 8,
    padding: 11,
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  rateInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  rateLabel: {
    color: '#E5E5E7',
    fontSize: 11,
    fontWeight: '500',
  },
  rateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1E',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  dollarSign: {
    color: '#E5E5E7',
    fontSize: 11,
    marginRight: 3,
  },
  rateInput: {
    color: '#FFFFFF',
    fontSize: 11,
    minWidth: 29,
    ...(Platform.OS === 'web' && { outline: 'none' }),
  },
  perText: {
    color: '#E5E5E7',
    fontSize: 11,
    fontWeight: '500',
  },
  viewsContainer: {
    backgroundColor: '#4F46E5',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewsNumber: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  viewsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  previewCard: {
    backgroundColor: '#1A1A1E',
    borderRadius: 24,
    padding: 25,
    borderWidth: 1,
    borderColor: '#2A2A2E',
    flex: 1,
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 32,
  },
  statusContainer: {
    marginBottom: 15,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#10B981',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_18pt-Medium',
    marginLeft: 5,
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  pauseButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_18pt-Medium',
    marginLeft: 5,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_18pt-Medium',
    marginLeft: 5,
  },
  // Styles copiés de CreateCampaignScreen
  platformButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  platformButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2E',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
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
  doubleRow: {
    flexDirection: 'row',
    gap: 11,
    marginBottom: 14,
  },
  doubleRowItem: {
    flex: 1,
  },
  payoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2E',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  payoutInput: {
    color: '#FFFFFF',
    fontSize: 11,
    flex: 1,
    ...(Platform.OS === 'web' && { outline: 'none' }),
  },
  autoApproveText: {
    color: '#8B8B8D',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 30,
  },
  uploadDescription: {
    color: '#8B8B8D',
    fontSize: 11,
    marginBottom: 16,
    lineHeight: 20,
  },
  imageUploadButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#4F46E5',
    borderStyle: 'dashed',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 120,
  },
  imageUploadText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
  },
  imageUploadSubtext: {
    color: '#8B8B8D',
    fontSize: 13,
  },
  createButtonContainer: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 9,
    paddingVertical: 11,
    paddingHorizontal: 41,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    minWidth: 180,
    shadowColor: '#4F4506E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginTop: 10,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  backButtonLeft: {
    position: 'absolute',
    left: 16,
    top: 10,
    zIndex: 1,
  },
  disabledInput: {
    opacity: 0.5,
  },
  // Nouveaux styles pour Add Budget
  budgetDisplayContainer: {
    backgroundColor: '#2A2A2E',
    borderRadius: 7,
    paddingHorizontal: 11,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  budgetDisplayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  budgetDisplayLabel: {
    color: '#8B8B8D',
    fontSize: 12,
    fontWeight: '500',
  },
  balanceText: {
    color: '#8B8B8D',
    fontSize: 11,
    marginBottom: 8,
  },
  addBudgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2E',
    borderRadius: 7,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  addBudgetInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 11,
    marginLeft: 5,
    ...(Platform.OS === 'web' && { outline: 'none' }),
  },
  addBudgetButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  addBudgetButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },

  // Styles pour le message de suppression en cours
  deletionWarningContainer: {
    flexDirection: 'row',
    backgroundColor: '#2A1A1A',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  deletionWarningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  deletionWarningContent: {
    flex: 1,
  },
  deletionWarningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 4,
  },
  deletionWarningText: {
    fontSize: 12,
    color: '#CCCCCC',
    lineHeight: 16,
  },

  // Styles pour le modal de confirmation
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteConfirmationModal: {
    backgroundColor: '#1A1A1E',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    borderWidth: 1,
    borderColor: '#2A2A2E',
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  deleteModalText: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteModalWarning: {
    backgroundColor: '#2A1A1A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  deleteModalWarningText: {
    fontSize: 12,
    color: '#E6E6E6',
    lineHeight: 16,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelDeleteButton: {
    flex: 1,
    backgroundColor: '#2A2A2E',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  confirmDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  thumbnailFallback: {
    backgroundColor: '#2A2A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlaceholderText: {
    color: '#8B8B8D',
    fontSize: 10,
    marginTop: 4,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#3A3A3E',
    marginTop: 12,
    marginBottom: 4,
  },
  linkText: {
    color: '#8B8B8D',
    fontSize: 11,
    fontFamily: 'Inter_18pt-Medium',
    flex: 1,
    marginHorizontal: 8,
  },
  debugText: {
    color: '#FF0000',
    fontSize: 10,
    marginTop: 4,
  },
});

export default CampaignDetailScreen; 