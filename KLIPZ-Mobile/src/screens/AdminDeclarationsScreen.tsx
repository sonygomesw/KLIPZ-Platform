import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { supabase } from '../config/supabase';
import declarationsService, { Declaration } from '../services/viewsDeclarationService';
import { withdrawalService, Withdrawal } from '../services/withdrawalService';
import { adminService, CampaignGroup, AdminStats } from '../services/adminService';

const AdminDeclarationsScreen: React.FC = () => {
  const [campaignGroups, setCampaignGroups] = useState<CampaignGroup[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

  useEffect(() => {
    loadAdminData();
    
    // Refresh automatique toutes les 30 secondes
    const interval = setInterval(() => {
      if (!refreshing) {
        onRefresh();
      }
    }, 30000); // 30 secondes
    
    return () => clearInterval(interval);
  }, [onRefresh, refreshing]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [groups, stats] = await Promise.all([
        adminService.getDeclarationsGroupedByCampaign(),
        adminService.getAdminStats()
      ]);
      setCampaignGroups(groups);
      setAdminStats(stats);
    } catch (e) {
      console.error('Error loading des données admin:', e);
      setCampaignGroups([]);
      setAdminStats(null);
    } finally {
      setLoading(false);
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
    loadPendingWithdrawals();
  }, []);

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
        <Text style={styles.statsTitle}>📊 Statistiques Globales</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{adminStats.totalDeclarations}</Text>
            <Text style={styles.statLabel}>Total Déclarations</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{adminStats.totalPending}</Text>
            <Text style={styles.statLabel}>In Review</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{adminStats.totalPaid}</Text>
            <Text style={styles.statLabel}>Payées</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>€{adminStats.totalEarnings.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Gains</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCampaignGroups = () => {
    if (campaignGroups.length === 0) {
      return <Text style={styles.emptyText}>No declarations to verify.</Text>;
    }

    return campaignGroups.map((group) => (
      <View key={group.clipperId} style={styles.campaignCard}>
        <View style={styles.campaignHeader}>
          <View style={styles.campaignInfo}>
            <Text style={styles.campaignTitle}>🎬 {group.clipperEmail}</Text>
            <Text style={styles.campaignSubtitle}>
              {group.clips.length} clips • {group.totalViews.toLocaleString()} vues • €{group.totalEarnings.toFixed(2)}
            </Text>
          </View>
          <View style={styles.campaignStats}>
            <View style={styles.statBadge}>
                              <Text style={styles.statBadgeText}>{group.pendingClips} in review</Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: '#00D4AA' }]}>
              <Text style={styles.statBadgeText}>{group.paidClips} payés</Text>
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
                  👁️ {clip.declared_views.toLocaleString()} vues déclarées
                </Text>
                <Text style={styles.clipDetail}>
                  💰 €{clip.earnings.toFixed(2)} gains
                </Text>
                {clip.verification_code && (
                  <Text style={styles.clipDetail}>
                    🔑 Code: {clip.verification_code}
                  </Text>
                )}
                <Text style={styles.clipDate}>
                  📅 {new Date(clip.created_at).toLocaleDateString()}
                </Text>
              </View>

              {clip.status === 'pending' && (
                <View style={styles.clipActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.validateButton]} 
                    onPress={() => handleMarkVerified(clip.id)}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Valider</Text>
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
            </View>
          ))}
        </View>
      </View>
    ));
  };

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
      <Text style={styles.title}>🏢 Administration</Text>
      
      {renderAdminStats()}
      
      <Text style={styles.sectionTitle}>📋 Déclarations par Clipper</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primarySolid} />
      ) : (
        renderCampaignGroups()
      )}
      
      {renderWithdrawalsToProcess()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: COLORS.text },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 24, marginBottom: 16, color: COLORS.text },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 32 },
  
  // Statistiques globales
  statsContainer: { marginBottom: 24 },
  statsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: COLORS.text },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { 
    backgroundColor: COLORS.surface, 
    borderRadius: 12, 
    padding: 16, 
    flex: 1, 
    minWidth: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.primarySolid, marginBottom: 4 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  
  // Campaign groups
  campaignCard: { 
    backgroundColor: COLORS.surface, 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  campaignHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 16 
  },
  campaignInfo: { flex: 1 },
  campaignTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  campaignSubtitle: { fontSize: 14, color: COLORS.textSecondary },
  campaignStats: { flexDirection: 'row', gap: 8 },
  statBadge: { 
    backgroundColor: '#FF6B6B', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  statBadgeText: { fontSize: 12, color: '#fff', fontWeight: 'bold' },
  
  // Clips
  clipsContainer: { gap: 12 },
  clipCard: { 
    backgroundColor: '#f8f9fa', 
    borderRadius: 12, 
    padding: 12, 
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primarySolid,
  },
  clipHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  clipUrl: { fontSize: 14, fontWeight: '500', color: COLORS.text, flex: 1 },
  statusBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  statusText: { fontSize: 12, color: '#fff', fontWeight: 'bold' },
  
  clipDetails: { marginBottom: 12 },
  clipDetail: { fontSize: 13, color: COLORS.text, marginBottom: 2 },
  clipDate: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic' },
  
  clipActions: { flexDirection: 'row', gap: 8 },
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  validateButton: { backgroundColor: '#00D4AA' },
  rejectButton: { backgroundColor: '#FF6B6B' },
  actionButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 4, fontSize: 12 },
  
  // Anciens styles pour compatibilité
  card: { backgroundColor: '#f7f7f7', borderRadius: 10, padding: 16, marginBottom: 16 },
  label: { fontWeight: 'bold', color: COLORS.text, marginTop: 4 },
  value: { color: COLORS.text, marginBottom: 2 },
  button: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primarySolid, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 16, marginTop: 12, alignSelf: 'flex-start' },
  buttonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
});

export default AdminDeclarationsScreen; 