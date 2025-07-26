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

const { width } = Dimensions.get('window');

interface SubmissionsScreenProps {
  user: AuthUser;
  navigation: any;
}

const SubmissionsScreen: React.FC<SubmissionsScreenProps> = ({ user, navigation }) => {
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

  useEffect(() => {
    loadSubmissions();
    loadDeclarations();
  }, []);

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



  const renderSubmissionsTable = () => (
    <View style={styles.mainCard}>
      <View style={styles.tableHeader}>
        <View style={styles.titleContainer}>
          <View style={styles.titleWithIcon}>
            <Text style={styles.tableTitle}>My Clips</Text>
            <View style={styles.infoIconContainer}>
              <Ionicons name="information-circle" size={20} color="#faf9f0" />
            </View>
          </View>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>{getFilteredSubmissions().length} clips</Text>
            <View style={styles.statsDot} />
            <Text style={styles.statsText}>
              {formatCurrency(getFilteredSubmissions().reduce((sum, s) => sum + (s.earnings || 0), 0))} earned
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.browseButton}>
          <LinearGradient
            colors={['#4a5cf9', '#4a5cf9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.browseGradient}
          >
            <Ionicons name="add-outline" size={18} color="#FFFFFF" />
            <Text style={styles.browseButtonText}>Create Clip</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tableContainer}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.campaignHeaderCell, styles.tableHeaderCell]}>CAMPAIGN</Text>
          <Text style={[styles.linkHeaderCell, styles.tableHeaderCell]}>TIKTOK LINK</Text>
          <Text style={[styles.viewsHeaderCell, styles.tableHeaderCell]}>VIEWS</Text>
          <Text style={[styles.earningsHeaderCell, styles.tableHeaderCell]}>EARNINGS</Text>
          <Text style={[styles.statusHeaderCell, styles.tableHeaderCell]}>STATUS</Text>
          <Text style={[styles.actionsHeaderCell, styles.tableHeaderCell]}>ACTIONS</Text>
        </View>
        
        {getFilteredSubmissions().length > 0 ? (
          getFilteredSubmissions().map((submission, index) => (
            <View key={index} style={styles.tableDataRow}>
              <View style={styles.campaignCell}>
                <View style={styles.campaignIconContainer}>
                  <Ionicons name="videocam" size={24} color="#4a5cf9" />
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
                  <Ionicons name="open-outline" size={24} color="#4a5cf9" />
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
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="videocam-off-outline" size={48} color="#FF8C42" />
            </View>
            <Text style={styles.emptyTitle}>No clips yet</Text>
            <Text style={styles.emptyDescription}>
              Start creating clips to see them here. Join campaigns and earn money with your content!
            </Text>
            <TouchableOpacity style={styles.emptyAction}>
              <LinearGradient
                colors={['#FF8C42', '#E65100']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.emptyActionGradient}
              >
                <Ionicons name="add-outline" size={20} color="#FFFFFF" />
                <Text style={styles.emptyActionText}>Create Your First Clip</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <View style={styles.paginationSection}>
        <Text style={styles.paginationText}>
          Showing 1 to {getFilteredSubmissions().length} of {getFilteredSubmissions().length} clips
        </Text>
        <View style={styles.paginationControls}>
          <TouchableOpacity style={styles.paginationButton}>
            <Ionicons name="chevron-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <View style={styles.currentPage}>
            <Text style={styles.currentPageText}>1</Text>
          </View>
          <TouchableOpacity style={styles.paginationButton}>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
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
            <Text style={styles.emptyText}>
              You haven't declared any views yet. Use the "Declare" button on your submissions.
            </Text>
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
        <Ionicons name="refresh" size={40} color={COLORS.primarySolid} />
        <Text style={styles.loadingText}>Loading submissions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <LinearGradient
              colors={['#ffffff', '#ffffff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.headerTitleGradient}
            >
              <View style={styles.headerTitleContent}>
                <Text style={styles.headerTitle}>My Clips</Text>
                <Text style={styles.headerDescription}>View your submitted clips and track their performance and earnings.</Text>
              </View>
            </LinearGradient>
          </View>
        </View>
        
        {renderSubmissionsTable()}
      </ScrollView>

      {showDeclareModal && renderDeclareModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.spacing.xl,
    paddingBottom: 50,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginBottom: SIZES.spacing.xl,
  },

  headerTitle: {
    fontSize: 40,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#363636',
    textAlign: 'center',
    lineHeight: 36,
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
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 42,
    fontFamily: FONTS.medium,
    color: '#6B7280',
    marginTop: 16,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIconContainer: {
    backgroundColor: 'rgba(250, 249, 240, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsText: {
    fontSize: 24,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    color: '#6b7280',
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
    fontSize: 28,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#000000',
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
    fontSize: 24,
    fontFamily: FONTS.semibold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#e8e6d9',
    backgroundColor: '#faf9f0',
  },
  tableDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e6d9',
    backgroundColor: '#ffffff',
    minHeight: 60,
    alignItems: 'center',
    '&:hover': {
      backgroundColor: '#faf9f0',
    },
  },
  tableCell: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
    fontSize: 26,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    color: '#374151',
  },
  tableHeaderCell: {
    backgroundColor: '#F9FAFB',
    fontSize: 22,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingVertical: 16,
    paddingHorizontal: 20,
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
  campaignCell: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 12,
  },
  campaignIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
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
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 24,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    textDecorationLine: 'underline',
    textDecorationColor: '#374151',
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
    fontSize: 26,
    fontFamily: FONTS.bold,
    color: '#374151',
    fontWeight: '600',
  },
  statusCellContainer: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
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
    backgroundColor: '#faf9f0',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 140, 66, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: '#000000',
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
  emptyAction: {
    borderRadius: 12,
    shadowColor: '#E65100',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  emptyActionText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  paginationSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paginationText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#6B7280',
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
    fontSize: 28,
    fontFamily: FONTS.medium,
    color: '#374151',
  },
  showEntriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  showEntriesText: {
    fontSize: 24,
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
    fontSize: 24,
    fontFamily: FONTS.medium,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
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
    color: '#111827',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  finalCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#F9FAFB',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#000000',
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
});

export default SubmissionsScreen; 