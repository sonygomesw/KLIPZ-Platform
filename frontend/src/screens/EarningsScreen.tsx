import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';
import { User } from '../types';
import { clipperEarningsService, ClipperEarningsData, ClipperCampaignGroup } from '../services/clipperEarningsService';
import { withdrawalService, Withdrawal } from '../services/withdrawalService';
import { bankAccountService, BankAccount } from '../services/bankAccountService';
import BankAccountModal from '../components/BankAccountModal';

const { width } = Dimensions.get('window');

interface EarningsScreenProps {
  user: User;
  navigation: any;
}

const EarningsScreen: React.FC<EarningsScreenProps> = ({ user, navigation }) => {
  const [earningsData, setEarningsData] = useState<ClipperEarningsData>({
    totalEarnings: 0,
    thisMonth: 0,
    pendingPayments: 0,
    completedClips: 0,
    averagePerClip: 0,
    clipsThisWeek: 0,
    campaignGroups: [],
  });
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadEarningsData();
      loadWithdrawals();
    }
  }, [user?.id]);

  const loadEarningsData = async () => {
    try {
      setIsLoading(true);
      const data = await clipperEarningsService.getClipperEarningsGrouped(user.id);
      setEarningsData(data);
    } catch (error) {
      console.error('Error loading des gains:', error);
      Alert.alert('Error', 'Impossible de charger les données de gains');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWithdrawals = async () => {
    try {
      const withdrawalsData = await withdrawalService.getWithdrawalsForUser(user.id);
      setWithdrawals(withdrawalsData);
    } catch (error) {
      console.error('Error loading des retraits:', error);
    }
  };

  const handleWithdraw = async () => {
    if (earningsData.totalEarnings <= 0) {
      Alert.alert('Error', 'No earnings available for withdrawal');
      return;
    }

    try {
      const primaryAccount = await bankAccountService.getPrimaryBankAccount(user.id);
      
      if (primaryAccount) {
        setSelectedBankAccount(primaryAccount);
        confirmWithdrawal(primaryAccount);
      } else {
        setShowBankAccountModal(true);
      }
    } catch (error) {
      console.error('Error lors de la vérification du compte bancaire:', error);
      setShowBankAccountModal(true);
    }
  };

  const confirmWithdrawal = (bankAccount: BankAccount) => {
    Alert.alert(
      'Confirmation de retrait',
      `Do you want to withdraw ${formatCurrency(earningsData.totalEarnings)} to account:\n\n${bankAccount.account_holder_name}\n${bankAccountService.maskIBAN(bankAccount.iban)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => processWithdrawal(bankAccount) },
      ]
    );
  };

  const processWithdrawal = async (bankAccount: BankAccount) => {
    try {
      setWithdrawing(true);
      await withdrawalService.createWithdrawal(user.id, earningsData.totalEarnings, bankAccount.id);
      Alert.alert('Success', 'Votre demande de retrait a été enregistrée');
      loadEarningsData();
      loadWithdrawals();
    } catch (error) {
      console.error('Error lors du retrait:', error);
      Alert.alert('Error', 'Impossible de traiter votre demande de retrait');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleBankAccountSelected = (bankAccount: BankAccount) => {
    setSelectedBankAccount(bankAccount);
    setShowBankAccountModal(false);
    confirmWithdrawal(bankAccount);
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  const renderTopMetrics = () => (
    <View style={styles.topMetricsSection}>
      <View style={styles.mainEarningsCard}>
        <View style={styles.mainEarningsHeader}>
          <View style={styles.mainEarningsTitleContainer}>
            <View style={styles.titleAndIcon}>
              <Text style={styles.mainEarningsTitle}>Total Earnings</Text>
              <Ionicons name="information-circle" size={16} color="#FFFFFF" />
            </View>
            <TouchableOpacity style={styles.withdrawButtonInline} onPress={handleWithdraw}>
              <Ionicons name="trending-up" size={14} color="#000000" />
              <Text style={styles.withdrawButtonTextInline}>Withdraw</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dateFilterContainer}>
            <TouchableOpacity style={styles.dateFilter}>
              <Text style={styles.dateFilterText}>Last 7 days</Text>
              <Ionicons name="chevron-down" size={14} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.dateRangeContainer}>
              <Ionicons name="calendar" size={12} color="#FFFFFF" style={{ marginTop: 8 }} />
              <Text style={styles.dateRangeText}>19 - 25 Jul. 2025</Text>
            </View>
          </View>
        </View>
        <Text style={styles.mainEarningsValue}>{formatCurrency(earningsData.totalEarnings)}</Text>
      </View>
    </View>
  );

  const renderEarningsTable = () => (
    <View style={styles.tableSection}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableTitle}>Your earnings by campaign</Text>
      </View>
      
      <View style={styles.tableContainer}>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>CAMPAIGN</Text>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>CLIPS CREATED</Text>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>YOUR EARNINGS</Text>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>PRICE/CLIP</Text>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>RATE</Text>
        </View>
        
        {earningsData.campaignGroups.length > 0 ? (
          earningsData.campaignGroups.map((group, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.campaignCell}>
                <Ionicons name="videocam" size={12} color="#8B8B8D" />
                <Text style={styles.campaignName}>{group.campaignName}</Text>
              </View>
              <Text style={styles.tableCell}>{group.clipCount}</Text>
              <Text style={styles.tableCell}>{formatCurrency(group.totalEarnings)}</Text>
              <Text style={styles.tableCell}>{formatCurrency(group.averagePerClip)}</Text>
              <Text style={styles.tableCell}>100%</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="videocam-outline" size={32} color="#8B8B8D" />
            <Text style={styles.emptyTitle}>No earnings available</Text>
            <Text style={styles.emptyText}>
              You haven't created any clips yet. Start participating in campaigns to earn money.
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderWithdrawalHistory = () => (
    <View style={styles.tableSection}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableTitle}>Withdrawal History</Text>
      </View>
      
      <View style={styles.tableContainer}>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>DATE</Text>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>AMOUNT</Text>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>STATUS</Text>
        </View>
        
        {withdrawals.length > 0 ? (
          withdrawals.map((withdrawal, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>
                {new Date(withdrawal.created_at).toLocaleDateString('en-US')}
              </Text>
              <Text style={styles.tableCell}>{formatCurrency(withdrawal.amount)}</Text>
              <Text style={[styles.tableCell, styles.statusCell, { color: getWithdrawalStatusColor(withdrawal.status) }]}>
                {getWithdrawalStatusText(withdrawal.status)}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No withdrawals</Text>
            <Text style={styles.emptyText}>
              You haven't made any withdrawals yet. Your earnings accumulate in your balance.
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const getWithdrawalStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'completed': return '#10B981';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getWithdrawalStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'In Progress';
      case 'completed': return 'Completed';
      case 'failed': return 'Échoué';
      default: return 'Inconnu';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primarySolid} />
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>My Earnings</Text>
      <View style={styles.mainContentContainer}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {renderTopMetrics()}
          {renderEarningsTable()}
          {renderWithdrawalHistory()}
        </ScrollView>

        <BankAccountModal
          visible={showBankAccountModal}
          onClose={() => setShowBankAccountModal(false)}
          onBankAccountSelected={handleBankAccountSelected}
          user={user}
        />
      </View>
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
    marginBottom: 2,
  },
  mainContentContainer: {
    backgroundColor: '#181818',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    flex: 1,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 8,
    marginTop: 8,
  },

  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_18pt-SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
  },
  titleContainer: {
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
  titleGradient: {
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderBottomWidth: 3,
    borderBottomColor: '#d0d0d0',
  },
  titleContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 24,
    fontFamily: FONTS.regular,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 20,
    flexShrink: 1,
  },
  withdrawButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  withdrawButtonText: {
    fontSize: 36,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  withdrawButtonInline: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginLeft: 24,
  },
  withdrawButtonTextInline: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 3,
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
    fontFamily: 'Inter_18pt-Medium',
    color: '#FFFFFF',
    marginTop: 8,
  },
  topMetricsSection: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  mainEarningsCard: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#38383A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  mainEarningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mainEarningsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  mainEarningsTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  titleAndIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateFilterContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  dateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateFilterText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
    marginRight: 2,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateRangeText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  mainEarningsValue: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    textAlign: 'left',
  },
  tableSection: {
    paddingHorizontal: 0,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  tableTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  browseButton: {
    backgroundColor: '#4a5cf9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  browseButtonText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  },
  tableContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38383A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#38383A',
  },
  tableCell: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  },
  tableHeaderCell: {
    backgroundColor: '#2A2A2E',
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: '#8B8B8D',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontWeight: '600',
  },
  campaignCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  campaignName: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  statusCell: {
    fontFamily: FONTS.medium,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#8B8B8D',
    textAlign: 'center',
    lineHeight: 18,
  },
  earningsGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 140, 66, 0.1)',
    opacity: 0.6,
  },
  sectionSpacer: {
    height: 16,
    backgroundColor: 'transparent',
  },
  bottomSpacer: {
    height: 16,
  },
});

export default EarningsScreen; 