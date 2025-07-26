import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { StripeService } from '../services/stripeService';
import { useUser } from '../contexts/UserContext';

const PaymentScreen = ({ navigation }: any) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isConnectedToStripe, setIsConnectedToStripe] = useState(false);

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

  const presetAmounts = [10, 25, 50, 100, 200, 500];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Payments</Text>
      </View>

      {/* Solde actuel */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>€{walletBalance.toFixed(2)}</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadWalletData}
        >
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
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
        <Text style={styles.sectionTitle}>Add des fonds</Text>
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
              <Text style={styles.amountText}>€{amount}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Connexion Stripe Connect */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Receive payments</Text>
        <Text style={styles.sectionDescription}>
          Connect to Stripe to receive your payments as a clipper
        </Text>
        
        <TouchableOpacity
          style={[
            styles.connectButton,
            isConnectedToStripe && styles.connectedButton
          ]}
          onPress={handleConnectStripe}
          disabled={loading || isConnectedToStripe}
        >
          <Ionicons 
            name={isConnectedToStripe ? "checkmark-circle" : "card"} 
            size={24} 
            color={isConnectedToStripe ? COLORS.success : COLORS.white} 
          />
          <Text style={[
            styles.connectButtonText,
            isConnectedToStripe && styles.connectedButtonText
          ]}>
            {isConnectedToStripe ? 'Connected to Stripe' : 'Connect to Stripe'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Informations */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Comment ça marche ?</Text>
        <View style={styles.infoItem}>
          <Ionicons name="card" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Ajoutez des fonds avec votre carte bancaire via Stripe
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="create" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Create campaigns with your balance
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="cash" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Les clippers sont payés automatiquement selon les vues
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.primary,
    margin: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    position: 'relative',
  },
  balanceLabel: {
    color: COLORS.white,
    fontSize: 16,
    marginBottom: 5,
  },
  balanceAmount: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: 'bold',
  },
  refreshButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
  },
  section: {
    margin: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  amountButton: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  connectButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  connectedButton: {
    backgroundColor: COLORS.success,
  },
  connectButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  connectedButtonText: {
    color: COLORS.white,
  },
  withdrawButton: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  withdrawButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  withdrawNote: {
    color: COLORS.error,
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoSection: {
    margin: 20,
    marginTop: 10,
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 15,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
});

export default PaymentScreen; 