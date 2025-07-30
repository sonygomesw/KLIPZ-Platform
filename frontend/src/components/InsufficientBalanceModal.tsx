import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';

interface InsufficientBalanceModalProps {
  visible: boolean;
  currentBalance: number;
  requiredAmount: number;
  onClose: () => void;
  onAddFunds: () => void;
}

const InsufficientBalanceModal: React.FC<InsufficientBalanceModalProps> = ({
  visible,
  currentBalance,
  requiredAmount,
  onClose,
  onAddFunds,
}) => {
  const missingAmount = requiredAmount - currentBalance;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={32} color="#FF6B35" />
            </View>
            <Text style={styles.title}>Insufficient Balance</Text>
            <Text style={styles.subtitle}>
              You don't have enough funds to create this campaign
            </Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.balanceInfo}>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Current balance:</Text>
                <Text style={styles.balanceAmount}>${currentBalance.toFixed(2)}</Text>
              </View>
              
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Required amount:</Text>
                <Text style={styles.balanceAmount}>${requiredAmount.toFixed(2)}</Text>
              </View>
              
              <View style={[styles.balanceRow, styles.missingRow]}>
                <Text style={styles.balanceLabel}>Missing amount:</Text>
                <Text style={styles.missingAmount}>${missingAmount.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={COLORS.primarySolid} />
              <Text style={styles.infoText}>
                Recharge your wallet to be able to create your campaign and start attracting talented clippers.
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.addFundsButton} onPress={onAddFunds}>
              <Ionicons name="wallet" size={20} color="#FFFFFF" />
              <Text style={styles.addFundsButtonText}>Recharge Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 450,
    borderWidth: 1,
    borderColor: '#555555',
    ...SHADOWS.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    marginBottom: 24,
  },
  balanceInfo: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  missingRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 8,
  },
  balanceLabel: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  balanceAmount: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  missingAmount: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: '#FF6B35',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#d9d9d9',
  },
  addFundsButton: {
    flex: 2,
    backgroundColor: COLORS.primarySolid,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addFundsButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  },
});

export default InsufficientBalanceModal; 