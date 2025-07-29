import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { adminService } from '../services/adminService';
import autoScrapingService from '../services/autoScrapingService';
import { User } from '../types';

interface AdminDeclarationsScreenProps {
  user: User;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSignOut?: () => void;
}

const AdminDeclarationsScreen: React.FC<AdminDeclarationsScreenProps> = ({ 
  user, 
  activeTab = 'AdminDeclarations',
  onTabChange = () => {},
  onSignOut = () => {}
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [campaignGroups, setCampaignGroups] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [scrapingClips, setScrapingClips] = useState<Set<string>>(new Set());

  const loadAdminData = async () => {
    try {
      console.log('🔵 AdminDeclarationsScreen - Loading admin data...');
      const [declarationsData, statsData] = await Promise.all([
        adminService.getDeclarationsGroupedByCampaign(),
        adminService.getAdminStats()
      ]);
      
      console.log('🔵 AdminDeclarationsScreen - Declarations data:', declarationsData?.length);
      console.log('🔵 AdminDeclarationsScreen - Declarations data details:', declarationsData);
      console.log('🔵 AdminDeclarationsScreen - Stats data:', statsData);
      
      setCampaignGroups(declarationsData || []);
      setAdminStats(statsData);
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données admin');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingWithdrawals = async () => {
    try {
      // Simuler des retraits en attente pour le design
      setPendingWithdrawals([
        {
          id: '1',
          user_email: 'clipper1@example.com',
          amount: 150.00,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('❌ Error loading withdrawals:', error);
    }
  };

  const handleMarkVerified = async (id: string) => {
    try {
      await adminService.validateDeclaration(id);
      Alert.alert('Succès', 'Clip approuvé avec succès');
      loadAdminData();
    } catch (error) {
      console.error('❌ Error validating declaration:', error);
      Alert.alert('Erreur', 'Impossible d\'approuver le clip');
    }
  };

  const handleRejectDeclaration = async (id: string) => {
    try {
      await adminService.rejectDeclaration(id);
      Alert.alert('Succès', 'Clip rejeté');
      loadAdminData();
    } catch (error) {
      console.error('❌ Error rejecting declaration:', error);
      Alert.alert('Erreur', 'Impossible de rejeter le clip');
    }
  };

  const handleMarkWithdrawalCompleted = async (id: string) => {
    try {
      // Logique pour marquer le retrait comme complété
      Alert.alert('Succès', 'Retrait marqué comme complété');
      loadPendingWithdrawals();
    } catch (error) {
      console.error('❌ Error completing withdrawal:', error);
      Alert.alert('Erreur', 'Impossible de compléter le retrait');
    }
  };

  const handleScrapeViews = async (clip: any) => {
    try {
      console.log('🔵 AdminDeclarationsScreen - Scraping views for clip:', clip.id);
      
      // Ajouter le clip à la liste des clips en cours de scraping
      setScrapingClips(prev => new Set(prev).add(clip.id));
      
      const result = await autoScrapingService.scrapeSingleSubmission(clip.id);
      console.log('🔵 AdminDeclarationsScreen - Scraping result:', result);
      
      if (result.success) {
        Alert.alert('✅ Succès', `Vues TikTok mises à jour : ${result.views?.toLocaleString()} vues`);
      } else {
        Alert.alert('⚠️ Attention', 'Impossible de récupérer les vues TikTok');
      }
      
      // Recharger les données pour afficher les nouvelles vues
      await loadAdminData();
      
    } catch (error) {
      console.error('❌ Error scraping views:', error);
      Alert.alert('❌ Erreur', 'Impossible de vérifier les vues TikTok');
    } finally {
      // Retirer le clip de la liste des clips en cours de scraping
      setScrapingClips(prev => {
        const newSet = new Set(prev);
        newSet.delete(clip.id);
        return newSet;
      });
    }
  };

  const handleMassScraping = async () => {
    try {
      console.log('🔵 AdminDeclarationsScreen - Starting mass scraping...');
      
      // Ajouter tous les clips à la liste de scraping
      const allClipIds = campaignGroups.flatMap(group => 
        group.clips.map(clip => clip.id)
      );
      setScrapingClips(new Set(allClipIds));
      
      const result = await autoScrapingService.triggerAutoScraping();
      console.log('🔵 AdminDeclarationsScreen - Mass scraping result:', result);
      
      if (result.success) {
        Alert.alert('✅ Succès', `Scraping en masse terminé. ${result.successCount || 0} clips mis à jour avec RapidAPI.`);
      } else {
        Alert.alert('⚠️ Attention', 'Erreur lors du scraping en masse');
      }
      
      // Recharger les données pour afficher les nouvelles vues
      await loadAdminData();
      
    } catch (error) {
      console.error('❌ Error mass scraping:', error);
      Alert.alert('❌ Erreur', 'Impossible de lancer le scraping en masse');
    } finally {
      // Vider la liste des clips en cours de scraping
      setScrapingClips(new Set());
    }
  };

  const handleAutoApproveAll = async () => {
    try {
      // Logique pour approuver automatiquement tous les clips éligibles
      Alert.alert('Succès', 'Tous les clips éligibles ont été approuvés automatiquement');
      loadAdminData();
    } catch (error) {
      console.error('❌ Error auto approving all:', error);
      Alert.alert('Erreur', 'Impossible d\'approuver automatiquement les clips');
    }
  };

  const handleViewPerformance = () => {
    Alert.alert('Performance', 'Fonctionnalité de performance à venir');
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadAdminData(), loadPendingWithdrawals()]);
    setRefreshing(false);
  }, [loadAdminData, loadPendingWithdrawals]);

  useEffect(() => {
    loadAdminData();
    loadPendingWithdrawals();
  }, []);

  const renderWithdrawalsToProcess = () => {
    if (pendingWithdrawals.length === 0) return null;

    return (
      <View style={styles.withdrawalsSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="card" size={24} color="#FFFFFF" />
          <Text style={styles.sectionTitle}>💰 Retraits en Attente</Text>
        </View>
        {pendingWithdrawals.map((withdrawal) => (
          <View key={withdrawal.id} style={styles.withdrawalCard}>
            <View style={styles.withdrawalInfo}>
              <View style={styles.withdrawalHeader}>
                <Ionicons name="person-circle" size={20} color="#9CA3AF" />
                <Text style={styles.withdrawalEmail}>{withdrawal.user_email}</Text>
              </View>
              <View style={styles.withdrawalAmountContainer}>
                <Text style={styles.withdrawalAmount}>€{withdrawal.amount.toFixed(2)}</Text>
                <Text style={styles.withdrawalStatus}>En attente</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => handleMarkWithdrawalCompleted(withdrawal.id)}
            >
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>Traiter</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderAdminStats = () => {
    return (
      <View style={styles.statsSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="analytics" size={24} color="#FFFFFF" />
          <Text style={styles.sectionTitle}>📊 Vue d'ensemble</Text>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="videocam" size={28} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{adminStats?.totalDeclarations || 0}</Text>
            <Text style={styles.statLabel}>Clips Total</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="time" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{adminStats?.totalPending || 0}</Text>
            <Text style={styles.statLabel}>En Attente</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="checkmark-circle" size={28} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{adminStats?.totalPaid || 0}</Text>
            <Text style={styles.statLabel}>Approuvés</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="wallet" size={28} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>€{adminStats?.totalEarnings?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.statLabel}>Gains Total</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderQuickActions = () => {
    return (
      <View style={styles.quickActionsSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flash" size={24} color="#FFFFFF" />
          <Text style={styles.sectionTitle}>⚡ Actions Rapides</Text>
        </View>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard} onPress={handleMassScraping}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="refresh" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.quickActionTitle}>Re-scraper</Text>
            <Text style={styles.quickActionSubtitle}>Tous les clips</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard} onPress={handleAutoApproveAll}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="checkmark-done" size={24} color="#10B981" />
            </View>
            <Text style={styles.quickActionTitle}>Auto-approuver</Text>
            <Text style={styles.quickActionSubtitle}>Clips éligibles</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard} onPress={handleViewPerformance}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="trending-up" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.quickActionTitle}>Performance</Text>
            <Text style={styles.quickActionSubtitle}>Voir les stats</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionCard} onPress={() => Alert.alert('Info', 'Configuration système')}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="settings" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.quickActionTitle}>Configuration</Text>
            <Text style={styles.quickActionSubtitle}>Paramètres</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderClipsTable = () => {
    console.log('🔵 AdminDeclarationsScreen - renderClipsTable - campaignGroups:', campaignGroups);
    
    // Aplatir tous les clips de tous les groupes
    const allClips = campaignGroups.flatMap(group => 
      group.clips.map(clip => ({
        ...clip,
        clipperEmail: group.clipperEmail
      }))
    );
    
    if (allClips.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          </View>
          <Text style={styles.emptyStateTitle}>🎉 Tout est à jour !</Text>
          <Text style={styles.emptyStateText}>Aucun clip soumis</Text>
        </View>
      );
    }

    return (
      <View style={styles.tableSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list" size={24} color="#FFFFFF" />
          <Text style={styles.sectionTitle}>📋 Clips Soumis par les Clippeurs</Text>
        </View>
        
        {/* En-tête du tableau */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Clipper</Text>
          <Text style={[styles.tableHeaderText, { flex: 2.8 }]}>Lien TikTok</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>Vues</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>Gains</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>Date</Text>
          <Text style={[styles.tableHeaderText, { flex: 0.8 }]}>Statut</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Actions</Text>
        </View>

        {/* Lignes du tableau */}
        <ScrollView style={styles.tableBody}>
          {allClips.map((clip, index) => {
            console.log('🔍 Clip complet:', clip);
            return (
            <View key={clip.id} style={[
              styles.tableRow,
              { backgroundColor: index % 2 === 0 ? '#374151' : '#4B5563' }
            ]}>
              <View style={[styles.tableCell, { flex: 1.2 }]}>
                <View style={styles.clipperCell}>
                  <Ionicons name="person-circle" size={20} color="#6366F1" />
                  <Text style={styles.tableCellText} numberOfLines={1}>
                    {clip.clipperEmail}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.tableCell, { flex: 2.8 }]}>
                <View style={styles.urlCell}>
                  <Ionicons name="logo-tiktok" size={16} color="#FF0050" />
                  <Text style={styles.tableCellText} numberOfLines={1}>
                    {clip.tiktok_url}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.tableCell, { flex: 0.8 }]}>
                {scrapingClips.has(clip.id) ? (
                  <View style={styles.loadingViewsContainer}>
                    <ActivityIndicator size="small" color="#3B82F6" />
                    <Text style={[styles.tableCellText, { fontSize: 10, color: '#9CA3AF' }]}>
                      RapidAPI...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.tableCellText}>
                    {(() => {
                      console.log('🔍 Clip views:', clip.views, 'Type:', typeof clip.views);
                      return clip.views?.toLocaleString() || '0';
                    })()}
                  </Text>
                )}
              </View>
              
              <View style={[styles.tableCell, { flex: 0.8 }]}>
                <Text style={[styles.tableCellText, { color: '#10B981' }]}>
                  {(() => {
                    console.log('🔍 Clip earnings:', clip.earnings, 'Type:', typeof clip.earnings);
                    return `€${clip.earnings?.toFixed(2) || '0.00'}`;
                  })()}
                </Text>
              </View>
              
              <View style={[styles.tableCell, { flex: 0.8 }]}>
                <Text style={styles.tableCellTextSmall}>
                  {(() => {
                    console.log('🔍 Clip created_at:', clip.created_at);
                    return new Date(clip.created_at).toLocaleDateString('fr-FR');
                  })()}
                </Text>
              </View>
              
              <View style={[styles.tableCell, { flex: 0.8 }]}>
                <View style={[
                  styles.statusBadgeSmall,
                  { backgroundColor: clip.status === 'paid' ? '#10B981' : clip.status === 'pending' ? '#F59E0B' : '#3B82F6' }
                ]}>
                  <Text style={styles.statusTextSmall}>
                    {clip.status === 'paid' ? 'Payé' : clip.status === 'pending' ? 'Attente' : 'Approuvé'}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.tableCell, { flex: 1.2 }]}>
                <View style={styles.tableActions}>
                  <TouchableOpacity
                    style={styles.tableActionButton}
                    onPress={() => handleScrapeViews(clip)}
                  >
                    <Ionicons name="eye" size={14} color="#3B82F6" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.tableActionButton, { borderColor: '#EF4444' }]}
                    onPress={() => handleRejectDeclaration(clip.id)}
                  >
                    <Ionicons name="close" size={14} color="#EF4444" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.tableActionButton, { borderColor: '#10B981' }]}
                    onPress={() => handleMarkVerified(clip.id)}
                  >
                    <Ionicons name="checkmark" size={14} color="#10B981" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
        </ScrollView>
      </View>
    );
  };

  console.log('🔵 AdminDeclarationsScreen - Rendering component');
  console.log('🔵 AdminDeclarationsScreen - loading:', loading);
  console.log('🔵 AdminDeclarationsScreen - campaignGroups:', campaignGroups?.length);
  console.log('🔵 AdminDeclarationsScreen - adminStats:', adminStats);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primarySolid]}
          tintColor={COLORS.primarySolid}
        />
      }
    >
      {renderAdminStats()}
      {renderQuickActions()}
      {renderWithdrawalsToProcess()}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primarySolid} />
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      ) : (
        renderClipsTable()
      )}
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  quickActionIcon: {
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  withdrawalsSection: {
    marginBottom: 24,
  },
  withdrawalCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  withdrawalInfo: {
    flex: 1,
  },
  withdrawalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  withdrawalEmail: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  withdrawalAmountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  withdrawalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  withdrawalStatus: {
    fontSize: 12,
    color: '#F59E0B',
    marginLeft: 8,
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  campaignsSection: {
    marginBottom: 24,
  },
  campaignCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  campaignInfo: {
    flex: 1,
  },
  clipperInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  clipperDetails: {
    flex: 1,
  },
  campaignTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  campaignSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  campaignSummary: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  campaignStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statBadgeText: {
    fontSize: 12,
    color: '#F59E0B',
    marginLeft: 4,
  },
  modernStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modernStatBadgeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  clipsContainer: {
    gap: 12,
  },
  clipCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  clipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clipUrlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flex: 1,
    marginRight: 8,
  },
  clipUrl: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  clipDetails: {
    marginBottom: 12,
  },
  clipStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  clipStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clipStatText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginLeft: 4,
  },
  clipDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  autoApprovedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  autoApprovedText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  scrapeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  scrapeButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  clipActions: {
    flexDirection: 'row',
    gap: 8,
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
  validateButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  validateButtonText: {
    color: '#10B981',
  },
  rejectButtonText: {
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
  tableSection: {
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4B5563',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    minHeight: 70,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E5E7EB',
    textAlign: 'center',
    flex: 1,
  },
  tableBody: {
    maxHeight: 600,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    minHeight: 70,
  },
  tableCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    flex: 1,
    minHeight: 60,
    marginHorizontal: 8,
  },
  tableCellText: {
    fontSize: 10,
    color: '#E5E7EB',
    textAlign: 'center',
    flexShrink: 1,
    lineHeight: 14,
  },
  tableCellTextSmall: {
    fontSize: 9,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 12,
  },
  clipperCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 8,
  },
  urlCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 8,
  },
  statusBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  statusTextSmall: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  tableActionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  loadingViewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
};

export default AdminDeclarationsScreen; 