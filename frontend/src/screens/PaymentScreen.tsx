import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';
import { StripeService } from '../services/stripeService';
import { AuthUser } from '../services/authService';

interface PaymentScreenProps {
  user: AuthUser;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSignOut?: () => void;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isConnectedToStripe, setIsConnectedToStripe] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [balance, connected] = await Promise.all([
        StripeService.getWalletBalance(user.id),
        StripeService.isConnectedToStripe(user.id)
      ]);
      
      setWalletBalance(balance);
      setIsConnectedToStripe(connected);
    } catch (error) {
      console.error('Error chargement wallet:', error);
      Alert.alert('Error', 'Unable to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async (amount: number) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not connected');
      return;
    }

    try {
      setLoading(true);
      await StripeService.openCheckout(amount, user.id);
      
      Alert.alert(
        'Payment Initiated',
        'You will be redirected to Stripe payment page. Once payment is completed, your balance will be automatically updated.',
        [
          {
            text: 'OK',
            onPress: () => {
              setTimeout(loadWalletData, 2000);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error opening checkout:', error);
      Alert.alert('Error', 'Unable to open payment page');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not connected');
      return;
    }

    try {
      setLoading(true);
      await StripeService.openConnectOnboarding(user.id, user.email);
      
      Alert.alert(
        'Stripe Connection',
        'You will be redirected to Stripe to set up your payment account. Once completed, you will be able to receive payments.',
        [
          {
            text: 'OK',
            onPress: () => {
              setTimeout(loadWalletData, 2000);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
      Alert.alert('Error', 'Unable to connect to Stripe');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawFunds = async (amount?: number) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not connected');
      return;
    }

    const withdrawAmount = amount || Number(customAmount);
    
    if (!withdrawAmount || withdrawAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (withdrawAmount > walletBalance) {
      Alert.alert('Error', 'Insufficient balance for this withdrawal');
      return;
    }

    if (!isConnectedToStripe) {
      Alert.alert(
        'Connection Required',
        'You must first connect to Stripe to withdraw your earnings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect', onPress: handleConnectStripe }
        ]
      );
      return;
    }

    Alert.alert(
      'Withdraw Funds',
      `Do you want to withdraw $${withdrawAmount.toFixed(2)} to your bank account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: async () => {
            try {
              setLoading(true);
              await StripeService.requestWithdrawal(user.id, withdrawAmount);
              
              Alert.alert(
                'Withdrawal Initiated',
                'Your withdrawal request has been sent. The money will be transferred to your bank account within 1-2 business days.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setCustomAmount('');
                      setTimeout(loadWalletData, 2000);
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Error withdrawal:', error);
              Alert.alert('Error', 'Unable to process your withdrawal request');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const presetAmounts = [10, 25, 50, 100, 200, 500];
  const isStreamer = user.role === 'streamer';
  const isClipper = user.role === 'clipper';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primarySolid} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Page Title Header */}
        <View style={styles.pageTitleContainer}>
          <View style={styles.pageTitleContent}>
            <Text style={styles.pageTitle}>Payment</Text>
            <Text style={styles.pageSubtitle}>Manage your wallet and payment methods</Text>
          </View>
        </View>

        <View style={styles.mainContent}>
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Ionicons name="wallet" size={24} color="#FFFFFF" />
              <Text style={styles.balanceLabel}>Available Balance</Text>
            </View>
            <Text style={styles.balanceAmount}>${walletBalance.toFixed(2)}</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadWalletData}
            >
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Add Funds Section - For Streamers */}
          {isStreamer && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="add-circle" size={24} color={COLORS.primarySolid} />
                <Text style={styles.sectionTitle}>Add Funds</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Top up your balance to create campaigns and pay clippers
              </Text>
              
              <View style={styles.amountGrid}>
                {presetAmounts.map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.amountButton}
                    onPress={() => handleAddFunds(amount)}
                    disabled={loading}
                  >
                    <Text style={styles.amountText}>${amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Custom Amount Input for Streamers */}
              <View style={styles.customAmountContainer}>
                <Text style={styles.inputLabel}>Or enter a custom amount:</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={customAmount}
                    onChangeText={setCustomAmount}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
                <TouchableOpacity
                  style={styles.addFundsButton}
                  onPress={() => handleAddFunds(Number(customAmount))}
                  disabled={loading || !customAmount || Number(customAmount) <= 0}
                >
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.addFundsButtonText}>Add Funds</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Withdraw Section - For Clippers */}
          {isClipper && walletBalance > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cash" size={24} color="#4CAF50" />
                <Text style={styles.sectionTitle}>Withdraw Funds</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Withdraw your earnings to your bank account
              </Text>
              
              {/* Custom Amount Input */}
              <View style={styles.customAmountContainer}>
                <Text style={styles.inputLabel}>Amount to withdraw:</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={customAmount}
                    onChangeText={setCustomAmount}
                    placeholder="0.00"
                    placeholderTextColor="#8B8B8D"
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
                <TouchableOpacity
                  style={styles.withdrawButton}
                  onPress={() => handleWithdrawFunds()}
                  disabled={loading || !customAmount || Number(customAmount) <= 0}
                >
                  <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.withdrawButtonText}>Withdraw</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Amount Buttons */}
              <View style={styles.quickAmountsContainer}>
                <Text style={styles.quickAmountsLabel}>Quick amounts:</Text>
                <View style={styles.quickAmountsGrid}>
                  {[25, 50, 100, 200].map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      style={styles.quickAmountButton}
                      onPress={() => setCustomAmount(amount.toString())}
                    >
                      <Text style={styles.quickAmountText}>${amount}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {!isConnectedToStripe && (
                <View style={styles.warningContainer}>
                  <Ionicons name="warning" size={20} color="#FF9800" />
                  <Text style={styles.warningText}>
                    Connect to Stripe to withdraw your earnings
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Stripe Connection Section - Only for Clippers */}
          {isClipper && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons 
                  name={isConnectedToStripe ? "checkmark-circle" : "card"} 
                  size={24} 
                  color={isConnectedToStripe ? "#4CAF50" : COLORS.primarySolid} 
                />
                <Text style={styles.sectionTitle}>
                  {isConnectedToStripe ? 'Connected to Stripe' : 'Connect to Stripe'}
                </Text>
              </View>
              <Text style={styles.sectionDescription}>
                Connect to Stripe to receive your payments as a clipper
              </Text>
              
              {!isConnectedToStripe && (
                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={() => handleConnectStripe()}
                  disabled={loading}
                >
                  <Ionicons name="card" size={20} color="#FFFFFF" />
                  <Text style={styles.connectButtonText}>Connect to Stripe</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* How it Works Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={24} color={COLORS.primarySolid} />
              <Text style={styles.sectionTitle}>How it works</Text>
            </View>
            
            <View style={styles.stepsContainer}>
              {isStreamer ? (
                // Steps for Streamers
                <>
                  <View style={styles.stepItem}>
                    <View style={styles.stepIcon}>
                      <Ionicons name="card" size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.stepText}>
                      Add funds with your bank card via Stripe
                    </Text>
                  </View>
                  
                  <View style={styles.stepItem}>
                    <View style={styles.stepIcon}>
                      <Ionicons name="create" size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.stepText}>
                      Create campaigns with your balance
                    </Text>
                  </View>
                  
                  <View style={styles.stepItem}>
                    <View style={styles.stepIcon}>
                      <Ionicons name="cash" size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.stepText}>
                      Clippers are paid automatically based on views
                    </Text>
                  </View>
                </>
              ) : (
                // Steps for Clippers
                <>
                  <View style={styles.stepItem}>
                    <View style={styles.stepIcon}>
                      <Ionicons name="card" size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.stepText}>
                      Connect your Stripe account to receive payments
                    </Text>
                  </View>
                  
                  <View style={styles.stepItem}>
                    <View style={styles.stepIcon}>
                      <Ionicons name="videocam" size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.stepText}>
                      Submit clips for available campaigns
                    </Text>
                  </View>
                  
                  <View style={styles.stepItem}>
                    <View style={styles.stepIcon}>
                      <Ionicons name="cash" size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.stepText}>
                      Get paid automatically when your clips are approved
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  pageTitleContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  pageTitleContent: {
    paddingHorizontal: 32,
    paddingVertical: 28,
    alignItems: 'center',
  },
  pageTitle: {
    color: '#1A1A1E',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  pageSubtitle: {
    color: '#6B7280',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginRight: 15,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    minWidth: 50,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  balanceCard: {
    backgroundColor: '#6366F1',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  balanceLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 5,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  refreshButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
  },
  mainContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1E',
    marginLeft: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  amountButton: {
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1E',
  },
  customAmountContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1E',
    marginRight: 5,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1E',
    paddingVertical: 10,
  },
  withdrawButton: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  withdrawButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  quickAmountsContainer: {
    marginTop: 15,
  },
  quickAmountsLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAmountButton: {
    backgroundColor: '#6366F1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
  },
  quickAmountText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: '#FF9800',
    padding: 10,
    borderRadius: 8,
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 5,
  },
  connectButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  connectButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  addFundsButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  addFundsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  stepsContainer: {
    marginTop: 15,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stepIcon: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    color: '#1A1A1E',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
});

export default PaymentScreen; 