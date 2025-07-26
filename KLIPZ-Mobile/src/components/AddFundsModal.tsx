import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import ResponsiveModal from './ResponsiveModal';
import { StripePaymentSheetService } from '../services/stripePaymentSheetService';

interface AddFundsModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

const AddFundsModal: React.FC<AddFundsModalProps> = ({
  visible,
  onClose,
  userId,
  onSuccess,
}) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRecharge = async () => {
    const numAmount = parseFloat(amount);
    
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (numAmount > 50000) {
      Alert.alert('Error', 'Maximum amount is €50,000');
      return;
    }

    try {
      setLoading(true);
      await StripePaymentSheetService.processWalletRecharge(numAmount, userId);
      
      Alert.alert(
        'Payment Successful!',
        `Your wallet has been recharged with €${numAmount.toFixed(2)}. The balance will be updated automatically.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              setAmount('');
              onSuccess?.();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error Payment Sheet:', error);
      Alert.alert('Error', 'Payment cancelled or failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveModal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Funds</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              Add funds to your wallet to create campaigns and pay clippers for their content.
            </Text>
          </View>

          {/* Quick Amount Selection */}
          <View style={styles.quickAmountsContainer}>
            <Text style={styles.quickAmountsLabel}>Quick amounts</Text>
            <View style={styles.quickAmountsRow}>
              {[25, 50, 100, 250].map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={[
                    styles.quickAmountButton,
                    amount === quickAmount.toString() && styles.quickAmountButtonSelected
                  ]}
                  onPress={() => setAmount(quickAmount.toString())}
                >
                  <Text style={[
                    styles.quickAmountText,
                    amount === quickAmount.toString() && styles.quickAmountTextSelected
                  ]}>
                    €{quickAmount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Custom Amount</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencyPrefix}>€</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={COLORS.textSecondary}
                autoFocus={false}
              />
            </View>
          </View>

          {/* Security Info */}
          <View style={styles.securityInfo}>
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text style={styles.securityText}>
              Secured by Stripe • No additional fees
            </Text>
          </View>

          {/* Add Funds Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.rechargeButton,
                (!amount || parseFloat(amount) <= 0) && styles.rechargeButtonDisabled
              ]}
              onPress={handleRecharge}
              disabled={!amount || parseFloat(amount) <= 0 || loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                  <Text style={styles.rechargeButtonText}>Processing...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="card" size={20} color="#FFFFFF" />
                  <Text style={styles.rechargeButtonText}>
                    Add €{amount || '0'} to Wallet
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ResponsiveModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 30,
  },
  descriptionContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  quickAmountsContainer: {
    marginBottom: 30,
  },
  quickAmountsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  quickAmountButtonSelected: {
    backgroundColor: '#EBF8FF',
    borderColor: COLORS.primarySolid,
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  quickAmountTextSelected: {
    color: COLORS.primarySolid,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 20,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    paddingVertical: 20,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    gap: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 'auto',
  },
  rechargeButton: {
    backgroundColor: COLORS.primarySolid,
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    shadowColor: COLORS.primarySolid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  rechargeButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  rechargeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AddFundsModal; 