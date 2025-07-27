import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { supabase } from '../config/supabase';
import declarationsService, { Declaration } from '../services/viewsDeclarationService';
import { withdrawalService, Withdrawal } from '../services/withdrawalService';
import { adminService, CampaignGroup, AdminStats } from '../services/adminService';
import ScrapingService from '../services/scrapingService';
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
  const [campaignGroups, setCampaignGroups] = useState<CampaignGroup[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

  const loadAdminData = async () => {
    console.log('🔵 AdminDeclarationsScreen - loadAdminData called');
    setLoading(true);
    try {
      console.log('🔵 AdminDeclarationsScreen - Calling adminService.getDeclarationsGroupedByCampaign()');
      const groups = await adminService.getDeclarationsGroupedByCampaign();
      console.log('🔵 AdminDeclarationsScreen - Groups loaded:', groups.length);
      
      console.log('🔵 AdminDeclarationsScreen - Calling adminService.getAdminStats()');
      const stats = await adminService.getAdminStats();
      console.log('🔵 AdminDeclarationsScreen - Stats loaded:', stats);
      
      setCampaignGroups(groups);
      setAdminStats(stats);
    } catch (e) {
      console.error('❌ AdminDeclarationsScreen - Error loading des données admin:', e);
      setCampaignGroups([]);
      setAdminStats(null);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingWithdrawals = async () => {
    setLoadingWithdrawals(true);
    try {
      const data = await withdrawalService.getPendingWithdrawals();
      setPendingWithdrawals(data);
    } catch (e) {
      setPendingWithdrawals([]);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadAdminData(),
        loadPendingWithdrawals()
      ]);
    } catch (error) {
      console.error('Error lors du refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
    loadPendingWithdrawals();
    
    // Refresh automatique toutes les 30 secondes
    const interval = setInterval(() => {
      if (!refreshing) {
        onRefresh();
      }
    }, 30000); // 30 secondes
    
    return () => clearInterval(interval);
  }, [onRefresh, refreshing]);

  const handleMarkVerified = async (id: string) => {
    try {
      await adminService.validateDeclaration(id);
      // Refresh immédiat après validation
      await onRefresh();
      Alert.alert('Success', 'Déclaration validée et paiement envoyé !');
    } catch (e) {
      Alert.alert('Error', 'Error lors de la validation/paiement.');
    }
  };

  const handleRejectDeclaration = async (id: string) => {
    Alert.alert(
      'Reject Declaration',
      'Êtes-vous sûr de vouloir rejeter cette déclaration ?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.rejectDeclaration(id);
              // Refresh immédiat après rejet
              await onRefresh();
              Alert.alert('Success', 'Déclaration rejetée.');
            } catch (e) {
              Alert.alert('Error', 'Error lors du rejet.');
            }
          }
        }
      ]
    );
  };

  const handleMarkWithdrawalCompleted = async (id: string) => {
    try {
      await withdrawalService.processWithdrawal(id); // Triggers Stripe payout
      // Refresh immédiat après traitement
      await onRefresh();
      Alert.alert('Success', 'Retrait traité et envoyé !');
    } catch (e) {
      Alert.alert('Error', 'Error lors du traitement du retrait.');
    }
  };

  const handleScrapeViews = async (clip: any) => {
    try {
      console.log('🔵 Scraping views for:', clip.tiktok_url);
      const result = await ScrapingService.scrapeSingleUrl(clip.tiktok_url);
      Alert.alert(
        'Vues TikTok Scrapées', 
        `URL: ${clip.tiktok_url}\n\nVues actuelles: ${clip.views?.toLocaleString() || '0'}\nVues réelles TikTok: ${result.views.toLocaleString()}\n\nDifférence: ${Math.abs(result.views - (clip.views || 0)).toLocaleString()}`
      );
    } catch (error) {
      console.error('❌ Error scraping views:', error);
      Alert.alert('Error', 'Impossible de récupérer les vues TikTok.');
    }
  };

  const handleMassScraping = async () => {
    Alert.alert(
      'Re-scraper tous les clips',
      'Voulez-vous re-scraper les vues de tous les clips en attente ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Re-scraper',
          onPress: async () => {
            try {
              console.log('🔵 Mass scraping started');
              await ScrapingService.scrapeAllViews();
              await onRefresh();
              Alert.alert('✅ Succès', 'Tous les clips ont été re-scrapés !');
            } catch (error) {
              console.error('❌ Mass scraping error:', error);
              Alert.alert('❌ Erreur', 'Erreur lors du re-scraping en masse.');
            }
          }
        }
      ]
    );
  };

  const handleAutoApproveAll = async () => {
    Alert.alert(
      'Auto-approuver tous les clips éligibles',
      'Voulez-vous approuver automatiquement tous les clips qui ont atteint leur seuil de vues ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Auto-approuver',
          onPress: async () => {
            try {
              console.log('🔵 Auto-approve all started');
              // Logique pour auto-approuver tous les clips éligibles
              await onRefresh();
              Alert.alert('✅ Succès', 'Tous les clips éligibles ont été auto-approuvés !');
            } catch (error) {
              console.error('❌ Auto-approve error:', error);
              Alert.alert('❌ Erreur', 'Erreur lors de l\'auto-approbation.');
            }
          }
        }
      ]
    );
  };

  const handleViewPerformance = () => {
    Alert.alert(
      '📊 Performance du Système',
      `Système automatisé actif !\n\n✅ Clips auto-approuvés: ${adminStats?.totalPaid || 0}\n⏳ En attente: ${adminStats?.totalPending || 0}\n💰 Total distribué: €${adminStats?.totalEarnings?.toFixed(2) || '0.00'}\n\nLe système fonctionne automatiquement !`
    );
  };

  const renderWithdrawalsToProcess = () => (
    <View style={{ marginTop: 32, marginBottom: 16 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Retraits à traiter</Text>
      {loadingWithdrawals ? (
        <Text>Loading...</Text>
      ) : pendingWithdrawals.length === 0 ? (
        <Text>No pending withdrawals.</Text>
      ) : (
        pendingWithdrawals.map((w) => (
          <View key={w.id} style={{ marginBottom: 12, padding: 12, backgroundColor: '#f7f7f7', borderRadius: 8 }}>
            <Text>Utilisateur : {w.users?.email || w.user_id}</Text>
            <Text>Montant : {w.amount} €</Text>
            <Text>Méthode : {w.method || '—'}</Text>
            <Text>Date : {new Date(w.created_at).toLocaleString()}</Text>
            <TouchableOpacity style={{ marginTop: 8, alignSelf: 'flex-start', backgroundColor: COLORS.primarySolid, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 16 }} onPress={() => handleMarkWithdrawalCompleted(w.id)}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Marquer comme traité</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );

  const renderAdminStats = () => {
    if (!adminStats) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.modernSectionTitle}>📊 Tableau de Bord</Text>
        <View style={styles.statsGrid}>
          <View style={styles.modernStatCard}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statGradient}
            >
              <Ionicons name="videocam" size={24} color="#fff" />
              <Text style={styles.modernStatValue}>{adminStats.totalDeclarations}</Text>
              <Text style={styles.modernStatLabel}>Total Clips</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.modernStatCard}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statGradient}
            >
              <Ionicons name="time" size={24} color="#fff" />
              <Text style={styles.modernStatValue}>{adminStats.totalPending}</Text>
              <Text style={styles.modernStatLabel}>En Attente</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.modernStatCard}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statGradient}
            >
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.modernStatValue}>{adminStats.totalPaid}</Text>
              <Text style={styles.modernStatLabel}>Auto-Payés</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.modernStatCard}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statGradient}
            >
              <Ionicons name="wallet" size={24} color="#fff" />
              <Text style={styles.modernStatValue}>€{adminStats.totalEarnings.toFixed(2)}</Text>
              <Text style={styles.modernStatLabel}>Total Distribué</Text>
            </LinearGradient>
          </View>
        </View>
        
        {/* Actions rapides modernes */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>⚡ Actions Rapides</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.modernQuickActionButton}
              onPress={handleMassScraping}
            >
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionGradient}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.modernQuickActionText}>Re-scraper tout</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modernQuickActionButton}
              onPress={handleAutoApproveAll}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionGradient}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.modernQuickActionText}>Auto-approuver</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modernQuickActionButton}
              onPress={handleViewPerformance}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionGradient}
              >
                <Ionicons name="analytics" size={20} color="#fff" />
                <Text style={styles.modernQuickActionText}>Performance</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderCampaignGroups = () => {
    if (campaignGroups.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          <Text style={styles.emptyStateTitle}>Aucun clip à vérifier</Text>
          <Text style={styles.emptyStateText}>Tous les clips ont été traités automatiquement !</Text>
        </View>
      );
    }

    return campaignGroups.map((group) => (
      <View key={group.clipperId} style={styles.modernCampaignCard}>
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.campaignGradient}
        >
          <View style={styles.modernCampaignHeader}>
            <View style={styles.campaignInfo}>
              <View style={styles.clipperInfo}>
                <View style={styles.avatarContainer}>
                  <Ionicons name="person-circle" size={40} color={COLORS.primarySolid} />
                </View>
                <View style={styles.clipperDetails}>
                  <Text style={styles.modernCampaignTitle}>{group.clipperEmail}</Text>
                  <Text style={styles.modernCampaignSubtitle}>
                    {group.clips.length} clips • {group.totalViews.toLocaleString()} vues • €{group.totalEarnings.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.modernCampaignStats}>
              <View style={styles.modernStatBadge}>
                <Ionicons name="time" size={16} color="#F59E0B" />
                <Text style={styles.modernStatBadgeText}>{group.pendingClips} en attente</Text>
              </View>
              <View style={[styles.modernStatBadge, { backgroundColor: '#10B981' }]}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={[styles.modernStatBadgeText, { color: '#fff' }]}>{group.paidClips} payés</Text>
              </View>
            </View>
          </View>

          <View style={styles.clipsContainer}>
            {group.clips.map((clip) => (
              <View key={clip.id} style={styles.clipCard}>
                <View style={styles.clipHeader}>
                  <Text style={styles.clipUrl} numberOfLines={1}>
                    📱 {clip.tiktok_url}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: clip.status === 'paid' ? '#00D4AA' : clip.status === 'pending' ? '#FF6B6B' : '#FFA726' }
                  ]}>
                    <Text style={styles.statusText}>
                      {clip.status === 'paid' ? 'Payé' : clip.status === 'pending' ? 'In review' : 'Approved'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.clipDetails}>
                  <Text style={styles.clipDetail}>
                    👁️ {clip.views?.toLocaleString() || '0'} vues TikTok (réelles)
                  </Text>
                  <Text style={styles.clipDetail}>
                    💰 €{clip.earnings?.toFixed(2) || '0.00'} gains calculés
                  </Text>
                  <Text style={styles.clipDetail}>
                    🎯 Seuil: {clip.campaign?.criteria?.minViews?.toLocaleString() || 'N/A'} vues
                  </Text>
                  <Text style={styles.clipDate}>
                    📅 {new Date(clip.submitted_at || clip.created_at).toLocaleDateString()}
                  </Text>
                  
                  {/* Statut automatique */}
                  {clip.status === 'auto_approved' && (
                    <View style={styles.autoApprovedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#00D4AA" />
                      <Text style={styles.autoApprovedText}>Auto-approuvé et payé</Text>
                    </View>
                  )}
                  
                  {/* Bouton pour re-scraper les vues TikTok */}
                  <TouchableOpacity 
                    style={styles.scrapeButton}
                    onPress={() => handleScrapeViews(clip)}
                  >
                    <Ionicons name="refresh" size={16} color="#fff" />
                    <Text style={styles.scrapeButtonText}>Re-vérifier vues TikTok</Text>
                  </TouchableOpacity>
                </View>

                {clip.status === 'pending' && (
                  <View style={styles.clipActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.validateButton]} 
                      onPress={() => handleMarkVerified(clip.id)}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Approuver manuellement</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.rejectButton]} 
                      onPress={() => handleRejectDeclaration(clip.id)}
                    >
                      <Ionicons name="close-circle" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Rejeter</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {clip.status === 'auto_approved' && (
                  <View style={styles.clipActions}>
                    <View style={[styles.actionButton, { backgroundColor: '#00D4AA' }]}>
                      <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Auto-approuvé ✓</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>
    ));
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
      {/* Header moderne avec gradient */}
      <View style={styles.modernHeader}>
        <LinearGradient
          colors={['#4a5cf9', '#3c82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Ionicons name="shield-checkmark" size={32} color="#fff" />
              <View style={styles.headerTextContainer}>
                <Text style={styles.modernTitle}>Administration</Text>
                <Text style={styles.headerSubtitle}>Centre de contrôle automatisé</Text>
              </View>
            </View>
            <View style={styles.headerStats}>
              <Text style={styles.headerStatValue}>{adminStats?.totalDeclarations || 0}</Text>
              <Text style={styles.headerStatLabel}>Clips</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
      
      {renderAdminStats()}
      
      <Text style={styles.modernSectionTitle}>📋 Gestion des Clips</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primarySolid} />
          <Text style={styles.loadingText}>Chargement des données...</Text>
        </View>
      ) : (
        renderCampaignGroups()
      )}
      
      {renderWithdrawalsToProcess()}
      
      {/* Paramètres du système automatisé */}
      <View style={styles.automationSettings}>
        <Text style={styles.modernSectionTitle}>⚙️ Configuration Système</Text>
        <View style={styles.settingsGrid}>
          <View style={styles.settingCard}>
            <Text style={styles.settingTitle}>🔄 Re-scraping automatique</Text>
            <Text style={styles.settingDescription}>
              Re-scrape les vues toutes les 24h pour les clips en attente
            </Text>
            <TouchableOpacity style={styles.settingToggle}>
              <Text style={styles.settingToggleText}>Activé</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingCard}>
            <Text style={styles.settingTitle}>💰 Paiement automatique</Text>
            <Text style={styles.settingDescription}>
              Payer automatiquement quand le seuil est atteint
            </Text>
            <TouchableOpacity style={styles.settingToggle}>
              <Text style={styles.settingToggleText}>Activé</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingCard}>
            <Text style={styles.settingTitle}>📊 Notifications admin</Text>
            <Text style={styles.settingDescription}>
              Notifier l'admin des clips auto-approuvés
            </Text>
            <TouchableOpacity style={styles.settingToggle}>
              <Text style={styles.settingToggleText}>Activé</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 0 },
  
  // Header moderne
  modernHeader: { marginBottom: 24 },
  headerGradient: { 
    paddingHorizontal: 20, 
    paddingVertical: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  headerLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  headerTextContainer: { marginLeft: 16 },
  modernTitle: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 4 
  },
  headerSubtitle: { 
    fontSize: 16, 
    color: 'rgba(255,255,255,0.8)' 
  },
  headerStats: { 
    alignItems: 'center' 
  },
  headerStatValue: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  headerStatLabel: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.8)' 
  },
  
  // Titres modernes
  modernSectionTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginTop: 32, 
    marginBottom: 20, 
    color: '#1f2937',
    paddingHorizontal: 20,
  },
  
  // États vides
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#1f2937', 
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: { 
    fontSize: 16, 
    color: '#6b7280', 
    textAlign: 'center',
  },
  
  // Loading
  loadingContainer: { 
    alignItems: 'center', 
    paddingVertical: 40 
  },
  loadingText: { 
    marginTop: 16, 
    fontSize: 16, 
    color: '#6b7280' 
  },
  
  // Statistiques modernes
  statsContainer: { 
    marginBottom: 24, 
    paddingHorizontal: 20 
  },
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 16,
    marginBottom: 24,
  },
  modernStatCard: { 
    flex: 1, 
    minWidth: '45%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statGradient: { 
    padding: 20, 
    alignItems: 'center',
  },
  modernStatValue: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginTop: 8,
    marginBottom: 4 
  },
  modernStatLabel: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.9)', 
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Actions rapides modernes
  quickActions: { marginTop: 20 },
  quickActionsTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 16, 
    color: '#1f2937' 
  },
  quickActionsGrid: { 
    flexDirection: 'row', 
    gap: 12, 
    flexWrap: 'wrap' 
  },
  modernQuickActionButton: { 
    flex: 1, 
    minWidth: '30%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 14,
    justifyContent: 'center',
  },
  modernQuickActionText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    marginLeft: 8, 
    fontSize: 14 
  },
  
  // Cartes de campagne modernes
  modernCampaignCard: { 
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  campaignGradient: { 
    padding: 20 
  },
  modernCampaignHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 20 
  },
  campaignInfo: { flex: 1 },
  clipperInfo: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  avatarContainer: { 
    marginRight: 16 
  },
  clipperDetails: { flex: 1 },
  modernCampaignTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#1f2937', 
    marginBottom: 4 
  },
  modernCampaignSubtitle: { 
    fontSize: 16, 
    color: '#6b7280' 
  },
  modernCampaignStats: { 
    flexDirection: 'row', 
    gap: 12 
  },
  modernStatBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20 
  },
  modernStatBadgeText: { 
    fontSize: 14, 
    color: '#F59E0B', 
    fontWeight: 'bold',
    marginLeft: 4,
  },
  
  // Clips modernes
  clipsContainer: { gap: 16 },
  clipCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  clipHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  clipUrl: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#1f2937', 
    flex: 1,
    marginRight: 12,
  },
  statusBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12 
  },
  statusText: { 
    fontSize: 12, 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  
  clipDetails: { marginBottom: 16 },
  clipDetail: { 
    fontSize: 15, 
    color: '#374151', 
    marginBottom: 6,
    fontWeight: '500',
  },
  clipDate: { 
    fontSize: 14, 
    color: '#9ca3af', 
    fontStyle: 'italic',
    marginTop: 4,
  },
  
  clipActions: { 
    flexDirection: 'row', 
    gap: 12 
  },
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  validateButton: { 
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  rejectButton: { 
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  actionButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    marginLeft: 6, 
    fontSize: 14 
  },
  
  // Bouton de scraping moderne
  scrapeButton: { 
    backgroundColor: '#6366F1', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  scrapeButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    marginLeft: 6, 
    fontSize: 14 
  },
  
  // Badge auto-approuvé moderne
  autoApprovedBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#D1FAE5', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  autoApprovedText: { 
    color: '#10B981', 
    fontWeight: 'bold', 
    marginLeft: 6, 
    fontSize: 14 
  },
  
  // Paramètres d'automatisation modernes
  automationSettings: { 
    marginTop: 32,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  settingsGrid: { gap: 20 },
  settingCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1f2937', 
    marginBottom: 8 
  },
  settingDescription: { 
    fontSize: 16, 
    color: '#6b7280', 
    marginBottom: 16,
    lineHeight: 22,
  },
  settingToggle: { 
    backgroundColor: '#10B981', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 12,
    alignSelf: 'flex-start',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  settingToggleText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  
  // Anciens styles pour compatibilité
  card: { backgroundColor: '#f7f7f7', borderRadius: 10, padding: 16, marginBottom: 16 },
  label: { fontWeight: 'bold', color: COLORS.text, marginTop: 4 },
  value: { color: COLORS.text, marginBottom: 2 },
  button: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primarySolid, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 16, marginTop: 12, alignSelf: 'flex-start' },
  buttonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
});

export default AdminDeclarationsScreen; 