import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Linking,
  TextInput,
  Dimensions,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';
import { Submission } from '../types';
import { AuthUser } from '../services/authService';
import campaignService from '../services/campaignService';
import Button from '../components/Button';
import declarationsService, { Declaration } from '../services/viewsDeclarationService';
import { supabase } from '../config/supabase';
// import { scrapingService } from '../services/scrapingService';
import { useSubmissionRefresh } from '../contexts/SubmissionContext';

const { width } = Dimensions.get('window');

interface SubmissionsScreenProps {
  user: AuthUser;
  navigation: any;
  onTabChange?: (tab: string) => void;
}

const SubmissionsScreen: React.FC<SubmissionsScreenProps> = ({ user, navigation, onTabChange = () => {} }) => {
  const { refreshKey } = useSubmissionRefresh();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showDeclareModal, setShowDeclareModal] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [declaredViews, setDeclaredViews] = useState('');
  const [isFinal, setIsFinal] = useState(false);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loadingDeclarations, setLoadingDeclarations] = useState(false);
  const [finalCode, setFinalCode] = useState<string | null>(null);
  const [tiktokUrl, setTiktokUrl] = useState('');
  
  // États pour le modal de confirmation de suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<Submission | null>(null);

  useEffect(() => {
    loadSubmissions();
    loadDeclarations();
  }, []);

  // Écouter les changements de soumissions pour rafraîchir automatiquement
  useEffect(() => {
    if (refreshKey > 0) {
      loadSubmissions();
    }
  }, [refreshKey]);

  useEffect(() => {
    if (declarations.some(d => d.status === 'paid')) {
      Alert.alert('Paiement validé', 'Félicitations ! Votre paiement a été validé et envoyé.');
    }
  }, [declarations]);

  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      const submissionsData = await campaignService.getClipperSubmissions(user.id);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error loading des soumissions:', error);
      Alert.alert('Error', 'Impossible de charger vos soumissions');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubmissions();
    setRefreshing(false);
  };

  const handleOpenTikTok = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Impossible d\'ouvrir le lien TikTok');
    });
  };

  const handleTestScraping = async (submission: Submission) => {
    // Vérification de sécurité - seuls les admins peuvent tester le scraping
    if (user.role !== 'admin') {
      Alert.alert('❌ Access Denied', 'Only administrators can test scraping functionality.');
      return;
    }

    try {
      Alert.alert(
        '🔍 Test Scraping (Admin Only)',
        `Voulez-vous tester le scraping pour cette soumission ?\n\nURL: ${submission.tiktokUrl}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Test', onPress: async () => {
            try {
              console.log('🔍 Admin testing scraping for submission:', submission.id);
              const result = await scrapingService.scrapeSingleUrl(submission.tiktokUrl);
              Alert.alert(
                '✅ Scraping Result',
                `Views scraped: ${result.views.toLocaleString()}\n\nThis is a test value for development.`
              );
            } catch (error: any) {
              Alert.alert('❌ Error', error.message || 'Failed to scrape views');
            }
          }}
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to test scraping');
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'Inconnu';
    }
  };

  const getFilteredSubmissions = () => {
    if (selectedFilter === 'all') return submissions;
    return submissions.filter(sub => sub.status === selectedFilter);
  };

  const getTotalEarnings = () => {
    return submissions
      .filter(sub => sub.status === 'approved')
      .reduce((total, sub) => total + (sub.earnings || 0), 0);
  };

  const loadDeclarations = async () => {
    try {
      setLoadingDeclarations(true);
      const declarationsData = await declarationsService.getDeclarationsForClipper(user.id);
      setDeclarations(declarationsData);
    } catch (error) {
      console.error('Error loading des déclarations:', error);
    } finally {
      setLoadingDeclarations(false);
    }
  };

  const generateCode = () => Math.floor(10000 + Math.random() * 90000).toString();

  const handleDeclareViews = async () => {
    if (!currentSubmission || !declaredViews || !tiktokUrl) {
      Alert.alert('Error', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      const code = generateCode();
      setFinalCode(code);
      
      await declarationsService.declareViews(
        user.id,
        currentSubmission.campaignId,
        parseInt(declaredViews),
        tiktokUrl,
        code,
        isFinal
      );

      Alert.alert('Success', 'Vos vues ont été déclarées avec succès !');
      setShowDeclareModal(false);
      setDeclaredViews('');
      setTiktokUrl('');
      setIsFinal(false);
      setFinalCode(null);
      loadDeclarations();
    } catch (error) {
      console.error('Error lors de la déclaration:', error);
      Alert.alert('Error', 'Impossible de déclarer vos vues');
    }
  };

  const handleDeleteSubmission = (submission: Submission) => {
    console.log('🗑️ handleDeleteSubmission appelé pour:', submission.id);
    setSubmissionToDelete(submission);
    setShowDeleteModal(true);
  };

  const confirmDeleteSubmission = async () => {
    if (!submissionToDelete) return;

    console.log('🗑️ Suppression confirmée pour submission:', submissionToDelete.id);
    try {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', submissionToDelete.id);

      if (error) {
        console.error('❌ Error deleting submission:', error);
        Alert.alert('Error', 'Impossible de supprimer le clip');
        return;
      }

      console.log('✅ Submission supprimée avec succès');
      // Refresh the submissions list
      loadSubmissions();
      setShowDeleteModal(false);
      setSubmissionToDelete(null);
      Alert.alert('Succès', 'Clip supprimé avec succès');
    } catch (error) {
      console.error('❌ Error deleting submission:', error);
      Alert.alert('Error', 'Impossible de supprimer le clip');
    }
  };

  const cancelDeleteSubmission = () => {
    console.log('🚫 Suppression annulée par l\'utilisateur');
    setShowDeleteModal(false);
    setSubmissionToDelete(null);
  };

  const renderSubmissionsTable = () => (
    <View style={styles.mainCard}>
      <View style={styles.tableHeader}>
        <View style={styles.leftContent}>
          <View style={styles.platformStatsContainer}>
            <View style={styles.platformStatContainer}>
              <Image source={require('../../assets/twitch-logo.jpg')} style={styles.platformImage} />
              <View style={styles.platformStatContent}>
                <Text style={styles.statsText}>
                  {getFilteredSubmissions().filter(s => (s as any).platform === 'twitch' || !(s as any).platform).length} clips
                </Text>
                <View style={styles.statsDot} />
                <Text style={styles.statsText}>
                  {formatCurrency(getFilteredSubmissions()
                    .filter(s => (s as any).platform === 'twitch' || !(s as any).platform)
                    .reduce((sum, s) => sum + (s.earnings || 0), 0))} earned
                </Text>
              </View>
            </View>
            <View style={styles.platformStatContainer}>
              <Image source={require('../../assets/youtube_logo.png')} style={styles.platformImage} />
              <View style={styles.platformStatContent}>
                <Text style={styles.statsText}>
                  {getFilteredSubmissions().filter(s => (s as any).platform === 'youtube').length} clips
                </Text>
                <View style={styles.statsDot} />
                <Text style={styles.statsText}>
                  {formatCurrency(getFilteredSubmissions()
                    .filter(s => (s as any).platform === 'youtube')
                    .reduce((sum, s) => sum + (s.earnings || 0), 0))} earned
                </Text>
              </View>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.browseButton}
          onPress={() => onTabChange('AvailableMissions')}
        >
          <LinearGradient
            colors={['#475ae8', '#397ce8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.browseGradient}
          >
            <Ionicons name="add-outline" size={20} color="#FFFFFF" />
            <Text style={styles.browseButtonText}>Add a clip</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tableContainer}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.platformHeaderCell, styles.tableHeaderCell]}>PLATFORM</Text>
          <Text style={[styles.campaignHeaderCell, styles.tableHeaderCell]}>MISSION</Text>
          <Text style={[styles.linkHeaderCell, styles.tableHeaderCell]}>TIKTOK LINK</Text>
          <Text style={[styles.viewsHeaderCell, styles.tableHeaderCell]}>VIEWS</Text>
          <Text style={[styles.earningsHeaderCell, styles.tableHeaderCell]}>EARNINGS</Text>
          <Text style={[styles.statusHeaderCell, styles.tableHeaderCell]}>STATUS</Text>
          <Text style={[styles.actionsHeaderCell, styles.tableHeaderCell]}>ACTIONS</Text>
        </View>
        
        {getFilteredSubmissions().length > 0 ? (
          getFilteredSubmissions().map((submission, index) => (
            <View key={index} style={styles.tableDataRow}>
              <View style={styles.platformCell}>
                <Ionicons 
                  name={(submission as any).platform === 'youtube' ? 'logo-youtube' : 'logo-twitch'} 
                  size={20} 
                  color={(submission as any).platform === 'youtube' ? '#FF0000' : '#9146FF'} 
                />
              </View>
              <View style={styles.campaignCell}>
                <View style={styles.campaignIconContainer}>
                  <Ionicons name="videocam" size={13} color="#0a0a0a" />
                </View>
                <Text style={styles.campaignName}>{submission.campaignName}</Text>
              </View>
              <TouchableOpacity 
                style={styles.linkCell}
                onPress={() => handleOpenTikTok(submission.tiktokUrl)}
              >
                <Text style={styles.linkText} numberOfLines={1}>
                  {submission.tiktokUrl.replace('https://', '')}
                </Text>
                <View style={styles.linkIconContainer}>
                  <Ionicons name="open-outline" size={13} color="#0a0a0a" />
                </View>
              </TouchableOpacity>
              <View style={styles.viewsCell}>
                <Text style={styles.tableCell}>{formatViews(submission.views)}</Text>
              </View>
              <View style={styles.earningsCell}>
                <Text style={styles.earningsAmount}>{formatCurrency(submission.earnings)}</Text>
              </View>
              <View style={styles.statusCellContainer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(submission.status) }]}>
                  <Text style={styles.statusBadgeText}>
                    {getStatusText(submission.status)}
                  </Text>
                </View>
              </View>
              <View style={styles.actionsCell}>
                {user.role === 'admin' && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleTestScraping(submission)}
                  >
                    <Ionicons name="refresh" size={16} color="#4a5cf9" />
                  </TouchableOpacity>
                )}
                {user.role !== 'admin' && (
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => {
                      console.log('🔘 Bouton supprimer cliqué pour submission:', submission.id);
                      handleDeleteSubmission(submission);
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="videocam-off-outline" size={48} color="#8eaad6" />
            </View>
            <Text style={styles.emptyTitle}>No clips yet</Text>
            <Text style={styles.emptyDescription}>
              Start creating clips to see them here. Join campaigns and earn money with your content!
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderDeclarationsTable = () => (
    <View style={styles.tableSection}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableTitle}>Views Declarations</Text>
      </View>
      
      <View style={styles.tableContainer}>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>Date</Text>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>Campagne</Text>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>Declared Views</Text>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>Status</Text>
        </View>
        
        {declarations.length > 0 ? (
          declarations.map((declaration, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>
                {new Date(declaration.created_at).toLocaleDateString('en-US')}
              </Text>
              <Text style={styles.tableCell}>{declaration.campaign_name}</Text>
              <Text style={styles.tableCell}>{formatViews(declaration.views_declared)}</Text>
              <Text style={[styles.tableCell, styles.statusCell, { color: getStatusColor(declaration.status) }]}>
                {getStatusText(declaration.status)}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No declarations</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderDeclareModal = () => (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Declare Views</Text>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setShowDeclareModal(false)}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.modalBody}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>URL TikTok</Text>
            <TextInput
              style={styles.textInput}
              value={tiktokUrl}
              onChangeText={setTiktokUrl}
              placeholder="https://www.tiktok.com/@..."
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre de vues</Text>
            <TextInput
              style={styles.textInput}
              value={declaredViews}
              onChangeText={setDeclaredViews}
              placeholder="1000"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.finalCheckbox}>
            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => setIsFinal(!isFinal)}
            >
              {isFinal && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>
              C'est ma déclaration finale pour ce clip
            </Text>
          </View>

          {finalCode && (
            <View style={styles.codeInfo}>
              <Text style={styles.codeInfoText}>
                Code de vérification : {finalCode}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.modalFooter}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => setShowDeclareModal(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={handleDeclareViews}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="refresh" size={30} color={COLORS.primarySolid} />
        <Text style={styles.loadingText}>Loading clips...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>My Clips</Text>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderSubmissionsTable()}
      </ScrollView>

      {/* Pagination en dessous du conteneur principal */}
      <View style={styles.paginationSection}>
        <Text style={styles.paginationText}>
          Showing 1 to {getFilteredSubmissions().length} of {getFilteredSubmissions().length} clips
        </Text>
        <View style={styles.paginationControls}>
          <TouchableOpacity style={styles.paginationButton}>
            <Ionicons name="chevron-back" size={14} color="#6B7280" />
          </TouchableOpacity>
          <View style={styles.currentPage}>
            <Text style={styles.currentPageText}>1</Text>
          </View>
          <TouchableOpacity style={styles.paginationButton}>
            <Ionicons name="chevron-forward" size={14} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <View style={styles.showEntriesContainer}>
          <Text style={styles.showEntriesText}>Show</Text>
          <TouchableOpacity style={styles.showEntriesDropdown}>
            <Text style={styles.showEntriesValue}>10</Text>
            <Ionicons name="chevron-down" size={14} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {showDeclareModal && renderDeclareModal()}
      
      {/* Modal de confirmation de suppression */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDeleteSubmission}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="trash-outline" size={32} color="#EF4444" />
              <Text style={styles.deleteModalTitle}>Supprimer le clip</Text>
            </View>
            
            <Text style={styles.deleteModalMessage}>
              Êtes-vous sûr de vouloir supprimer ce clip ? Cette action est irréversible.
            </Text>
            
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity 
                style={styles.cancelDeleteButton}
                onPress={cancelDeleteSubmission}
              >
                <Text style={styles.cancelDeleteButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmDeleteButton}
                onPress={confirmDeleteSubmission}
              >
                <Text style={styles.confirmDeleteButtonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Thème sombre comme Dashboard
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 19,
    marginBottom: 4,
    marginTop: 4,
  },

  headerTitle: {
    fontSize: 20, // Réduit de 40 à 20
    fontFamily: 'Inter_18pt-SemiBold',
    fontWeight: '600',
    color: '#FFFFFF', // Blanc pour le thème sombre
    textAlign: 'center',
    lineHeight: 18, // Réduit de 36 à 18
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
    marginBottom: SIZES.spacing.xl,
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
  headerDescription: {
    fontSize: 24,
    fontFamily: FONTS.regular,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 20,
    flexShrink: 1,
  },

  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#8B8B8D',
    marginTop: 16,
  },
  mainCard: {
    backgroundColor: '#1C1C1E', // Thème sombre
    marginBottom: 12, // Réduit de 24 à 12
    borderRadius: 12, // Réduit de 20 à 12
    borderWidth: 1,
    borderColor: '#38383A', // Couleur sombre
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // Réduit de 4 à 2
    shadowOpacity: 0.08,
    shadowRadius: 6, // Réduit de 12 à 6
    elevation: 3, // Réduit de 6 à 3
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Centrer verticalement comme le bouton
    padding: 16, // Réduit de 24 à 16
    flexWrap: 'wrap',
    gap: 12,
  },

  leftContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  platformStatsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  platformStatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    minWidth: 400,
    borderWidth: 1,
    borderColor: '#38383A',
  },
  platformImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 20,
    resizeMode: 'contain',
  },
  platformStatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsText: {
    fontSize: 14, // Augmenté de 13 à 15
    fontFamily: 'Inter_18pt-Medium',
    fontWeight: '600',
    color: '#ededee', // Couleur thème sombre
    opacity: 0.8,
  },
  statsDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#faf9f0',
    opacity: 0.6,
  },
  tableTitle: {
    fontSize: 14, // Réduit de 28 à 14
    fontFamily: 'Inter_18pt-SemiBold',
    fontWeight: '600',
    color: '#FFFFFF', // Blanc pour le thème sombre
  },
  browseButton: {
    borderRadius: 12,
  },
  browseGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  browseButtonText: {
    fontSize: 14, // Réduit de 24 à 12
    fontFamily: 'Inter_18pt-SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tableContainer: {
    backgroundColor: '#1C1C1E', // Thème sombre
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1, // Réduit de 2 à 1
    borderBottomColor: '#38383A', // Couleur sombre
    backgroundColor: '#0A0A0A', // Background noir comme demandé
  },
  tableDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#38383A', // Couleur sombre
    backgroundColor: '#1C1C1E', // Couleur sombre
    minHeight: 40, // Réduit de 60 à 40
    alignItems: 'center',
  },
  tableCell: {
    flex: 1,
    paddingVertical: 12, // Réduit de 20 à 12
    paddingHorizontal: 12, // Réduit de 20 à 12
    fontSize: 12, // Réduit de 26 à 12
    fontFamily: 'Inter_18pt-Medium',
    fontWeight: '600',
    color: '#FFFFFF', // Blanc pour le thème sombre
  },
  tableHeaderCell: {
    backgroundColor: '#2A2A2E',
    fontSize: 12,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#eaeaea',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  platformHeaderCell: {
    flex: 0.8,
    textAlign: 'center',
  },
  campaignHeaderCell: {
    flex: 1.5,
  },
  linkHeaderCell: {
    flex: 1.8,
  },
  viewsHeaderCell: {
    flex: 1,
    textAlign: 'center',
  },
  earningsHeaderCell: {
    flex: 1,
    textAlign: 'center',
  },
  statusHeaderCell: {
    flex: 1,
    textAlign: 'center',
  },
  actionsHeaderCell: {
    flex: 1,
    textAlign: 'center',
  },
  platformCell: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  campaignCell: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 12,
  },
  campaignIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  campaignName: {
    fontSize: 30,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    color: '#374151',
  },
  linkCell: {
    flex: 1.8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 8,
  },
  linkIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: '#e8eae9',
    flex: 1,
    textDecorationLine: 'underline',
    textDecorationColor: '#e8eae9',
  },
  statusCell: {
    fontFamily: FONTS.medium,
  },
  viewsCell: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  earningsCell: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  earningsAmount: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: '#e8eae9',
    fontWeight: '600',
  },
  statusCellContainer: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  actionsCell: {
    flex: 0.8,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
    backgroundColor: '#1C1C1E',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#485aeb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: '#e4e4e4',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 300,
  },
  paginationSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: -20,
    marginBottom: 20,
  },
  paginationText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#ededee',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paginationButton: {
    padding: 12,
  },
  currentPage: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  currentPageText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    color: '#374151',
  },
  showEntriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  showEntriesText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#6B7280',
  },
  showEntriesDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    gap: 6,
  },
  showEntriesValue: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#374151',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    width: Math.min(440, width - 40),
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 15,
    borderWidth: 0,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#000000',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#faf9f0',
    letterSpacing: -0.2,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#faf9f0',
    borderWidth: 1,
    borderColor: '#e8e6d9',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#000000',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#FFFFFF',
    backgroundColor: '#0A0A0A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    ...(Platform.OS === 'web' && { outline: 'none' }),
  },
  finalCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
    padding: 16,
    backgroundColor: '#2A2A2E',
    borderRadius: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 18,
    fontFamily: FONTS.medium,
    color: '#374151',
    flex: 1,
  },
  codeInfo: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  codeInfoText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#3B82F6',
    lineHeight: 22,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    gap: 16,
    backgroundColor: '#2A2A2E',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#0A0A0A',
    borderWidth: 2,
    borderColor: '#38383A',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 25,
    backgroundColor: '#FF8C42',
    alignItems: 'center',
    shadowColor: '#E65100',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E65100',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderColor: '#EF4444',
    borderWidth: 1,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    gap: 4,
  },
  deleteButtonText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#EF4444',
  },
  
  // Styles pour le modal de suppression
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContainer: {
    backgroundColor: '#1A1A1E',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  deleteModalMessage: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },

  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelDeleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2A2A2E',
    borderWidth: 1,
    borderColor: '#38383A',
    alignItems: 'center',
  },
  cancelDeleteButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
});

export default SubmissionsScreen; 