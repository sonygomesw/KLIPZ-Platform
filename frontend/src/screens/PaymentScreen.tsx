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
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { StripeService } from '../services/stripeService';
import { User } from '../types';

interface PaymentScreenProps {
  user: User;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSignOut?: () => void;
}

const PaymentScreen: React.FC<PaymentScreenProps> = ({ 
  user,
  activeTab = 'Payment',
  onTabChange = () => {},
  onSignOut = () => {}
}) => {
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
      Alert.alert('Error', 'Impossible de charger les données du wallet');
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
        'Paiement initié',
        'Vous allez être redirigé vers la page de paiement Stripe. Once payment is completed, your balance will be automatically updated.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Recharger les données après un délai
              setTimeout(loadWalletData, 2000);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error ouverture checkout:', error);
      Alert.alert('Error', 'Impossible d\'ouvrir la page de paiement');
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
      await StripeService.openConnectOnboarding(user.id);
      
      Alert.alert(
        'Stripe Connection',
        'You will be redirected to Stripe to set up your payment account. Once completed, you will be able to receive payments.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Recharger les données après un délai
              setTimeout(loadWalletData, 2000);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error connexion Stripe:', error);
              Alert.alert('Error', 'Unable to connect to Stripe');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawFunds = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not connected');
      return;
    }

    if (walletBalance <= 0) {
      Alert.alert('Error', 'No balance to withdraw');
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
      'Withdraw vos gains',
      `Do you want to withdraw €${walletBalance.toFixed(2)} vers votre compte bancaire ?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: async () => {
            try {
              setLoading(true);
              await StripeService.requestWithdrawal(user.id, walletBalance);
              
              Alert.alert(
                'Retrait initié',
                'Votre demande de retrait a été envoyée. L\'argent sera transféré vers votre compte bancaire dans 1-2 jours ouvrables.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Recharger les données après un délai
                      setTimeout(loadWalletData, 2000);
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Error retrait:', error);
              Alert.alert('Error', 'Impossible de traiter votre demande de retrait');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCustomAmount = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (amount < 5) {
      Alert.alert('Error', 'Minimum amount is €5');
      return;
    }
    if (amount > 10000) {
      Alert.alert('Error', 'Maximum amount is €10,000');
      return;
    }
    
    setCustomAmount('');
    handleAddFunds(amount);
  };

  const presetAmounts = [10, 25, 50, 100, 200, 500];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primarySolid} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Payment</Text>
      <View style={styles.mainContentContainer}>
        <ScrollView style={styles.scrollView}>

      {/* Solde actuel */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>€{walletBalance.toFixed(2)}</Text>
                  <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadWalletData}
          >
            <Ionicons name="refresh" size={20} color={COLORS.primarySolid} />
          </TouchableOpacity>
      </View>

      {/* Button de retrait pour les clippers */}
      {user?.role === 'clipper' && walletBalance > 0 && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={handleWithdrawFunds}
            disabled={loading || !isConnectedToStripe}
          >
            <Ionicons name="cash-outline" size={24} color={COLORS.white} />
            <Text style={styles.withdrawButtonText}>
              Withdraw €{walletBalance.toFixed(2)}
            </Text>
          </TouchableOpacity>
          {!isConnectedToStripe && (
            <Text style={styles.withdrawNote}>
              ⚠️ Connectez-vous à Stripe pour retirer vos gains
            </Text>
          )}
        </View>
      )}

      {/* Add des fonds */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add money</Text>
        <Text style={styles.sectionDescription}>
          Top up your balance to create missions and pay clippers
        </Text>
        
        <View style={styles.amountGrid}>
          {presetAmounts.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.amountButton}
              onPress={() => handleAddFunds(amount)}
              disabled={loading}
            >
              <Text style={styles.amountText}>€{amount}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Montant personnalisé */}
        <View style={styles.customAmountSection}>
          <Text style={styles.customAmountLabel}>Montant personnalisé</Text>
          <View style={styles.customAmountContainer}>
            <View style={styles.customInputContainer}>
              <Text style={styles.currencySymbol}>€</Text>
              <TextInput
                style={styles.customAmountInput}
                value={customAmount}
                onChangeText={setCustomAmount}
                placeholder="0.00"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleCustomAmount}
              disabled={loading || !customAmount.trim()}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Informations */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Comment ça marche ?</Text>
        <View style={styles.infoItem}>
          <Ionicons name="card" size={20} color={'#9e9e9e'} />
          <Text style={styles.infoText}>
            Ajoutez des fonds avec votre carte bancaire via Stripe
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="create" size={20} color={'#9e9e9e'} />
          <Text style={styles.infoText}>
            Create campaigns with your balance
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="cash" size={20} color={'#9e9e9e'} />
          <Text style={styles.infoText}>
            Les clippers sont payés selon les vues aprés verification
          </Text>
        </View>
      </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0A0A0A',
  },
  pageTitle: {
    fontSize: 14,
    fontFamily: 'Inter_18pt-Medium',
    color: '#e0e0e0',
    textAlign: 'center',
    marginTop: -30,
    marginBottom: 6,
  },
  mainContentContainer: {
    backgroundColor: '#181818',
    borderRadius: 12,
    margin: 9,
    padding: 12,
    flex: 1,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFFFFF',
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
    backgroundColor: COLORS.primarySolid,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginRight: 15,
    shadowColor: COLORS.primarySolid,
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
    color: '#FFFFFF',
  },
  balanceCard: {
    backgroundColor: COLORS.primarySolid,
    margin: 12,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
  },
  balanceLabel: {
    color: COLORS.white,
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Inter_18pt-Regular',
    fontWeight: 'bold',
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter_18pt-SemiBold',
  },
  refreshButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
  section: {
    margin: 12,
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Inter_18pt-SemiBold',
  },
  sectionDescription: {
    fontSize: 12,
    color: '#B5B5B5',
    marginBottom: 16,
    lineHeight: 20,
    fontFamily: 'Inter_18pt-Regular',
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  amountButton: {
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter_18pt-SemiBold',
  },
  connectButton: {
    backgroundColor: '#f5f5f7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginTop: 12,
  },
  connectedButton: {
    backgroundColor: '#f5f5f7',
  },
  connectButtonText: {
    color: '#181818',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'Inter_18pt-SemiBold',
  },
  connectedButtonText: {
    color: '#181818',
  },
  withdrawButton: {
    backgroundColor: '#181818',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  withdrawButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    fontFamily: 'Inter_18pt-SemiBold',
  },
  withdrawNote: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'Inter_18pt-Regular',
  },
  infoSection: {
    margin: 12,
    marginTop: 70,
    backgroundColor: '#1A1A1E',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: 'Inter_18pt-SemiBold',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  infoText: {
    fontSize: 12,
    color: '#B5B5B5',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
    fontFamily: 'Inter_18pt-Regular',
  },
  customAmountSection: {
    marginTop: 16,
  },
  customAmountLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter_18pt-Medium',
    marginBottom: 12,
    marginTop: 10,
  },
  customAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    flex: 1,
  },
  currencySymbol: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 6,
    fontFamily: 'Inter_18pt-SemiBold',
  },
  customAmountInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    paddingVertical: 12,
    fontFamily: 'Inter_18pt-Regular',
    ...(Platform.OS === 'web' && { outline: 'none' }),
  },
  addButton: {
    backgroundColor: COLORS.primarySolid,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter_18pt-SemiBold',
  },
});

export default PaymentScreen; 