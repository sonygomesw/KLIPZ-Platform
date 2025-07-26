import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';
import { bankAccountService, BankAccount, CreateBankAccountData } from '../services/bankAccountService';

interface BankAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (bankAccount: BankAccount) => void;
  userId: string;
}

const BankAccountModal: React.FC<BankAccountModalProps> = ({
  visible,
  onClose,
  onSuccess,
  userId,
}) => {
  const [iban, setIban] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingAccounts, setExistingAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadExistingAccounts();
    }
  }, [visible]);

  const loadExistingAccounts = async () => {
    try {
      const accounts = await bankAccountService.getUserBankAccounts(userId);
      setExistingAccounts(accounts);
      
      // Sélectionner automatiquement le compte principal
      const primaryAccount = accounts.find(acc => acc.is_primary);
      if (primaryAccount) {
        setSelectedAccountId(primaryAccount.id);
      }
    } catch (error) {
      console.error('Error loading des comptes:', error);
    }
  };

  const handleAddAccount = async () => {
    if (!iban.trim() || !accountHolderName.trim()) {
      Alert.alert('Error', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!bankAccountService.validateIBAN(iban)) {
      Alert.alert('Error', 'Format IBAN invalide');
      return;
    }

    setIsLoading(true);
    try {
      const bankAccountData: CreateBankAccountData = {
        iban: iban.trim(),
        account_holder_name: accountHolderName.trim(),
        bank_name: bankName.trim() || undefined,
      };

      const newAccount = await bankAccountService.addBankAccount(userId, bankAccountData);
      
      Alert.alert(
        'Success',
        'Compte bancaire ajouté avec succès !',
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess(newAccount);
              resetForm();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Impossible d\'ajouter le compte bancaire');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAccount = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  const handleUseSelectedAccount = () => {
    if (!selectedAccountId) {
      Alert.alert('Error', 'Veuillez sélectionner un compte bancaire');
      return;
    }

    const selectedAccount = existingAccounts.find(acc => acc.id === selectedAccountId);
    if (selectedAccount) {
      onSuccess(selectedAccount);
    }
  };

  const resetForm = () => {
    setIban('');
    setAccountHolderName('');
    setBankName('');
    setSelectedAccountId(null);
  };

  const formatIBAN = (iban: string) => {
    return bankAccountService.formatIBAN(iban);
  };

  const maskIBAN = (iban: string) => {
    return bankAccountService.maskIBAN(iban);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Compte Bancaire</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Comptes existants */}
          {existingAccounts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Comptes existants</Text>
              {existingAccounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountCard,
                    selectedAccountId === account.id && styles.selectedAccountCard,
                  ]}
                  onPress={() => handleSelectAccount(account.id)}
                >
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountHolderName}>
                      {account.account_holder_name}
                    </Text>
                    <Text style={styles.accountIban}>
                      {maskIBAN(account.iban)}
                    </Text>
                    {account.bank_name && (
                      <Text style={styles.bankName}>{account.bank_name}</Text>
                    )}
                  </View>
                  <View style={styles.accountStatus}>
                    {account.is_primary && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryText}>Principal</Text>
                      </View>
                    )}
                    {selectedAccountId === account.id && (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primarySolid} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              
              {selectedAccountId && (
                <TouchableOpacity
                  style={styles.useAccountButton}
                  onPress={handleUseSelectedAccount}
                >
                  <Text style={styles.useAccountButtonText}>
                    Utiliser ce compte
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Séparateur */}
          {existingAccounts.length > 0 && (
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>OU</Text>
              <View style={styles.separatorLine} />
            </View>
          )}

          {/* Add un nouveau compte */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add un nouveau compte</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>IBAN *</Text>
              <TextInput
                style={styles.input}
                value={iban}
                onChangeText={setIban}
                placeholder="FR76 1234 5678 9012 3456 7890 123"
                placeholderTextColor={COLORS.textLight}
                autoCapitalize="characters"
                maxLength={34}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name du titulaire *</Text>
              <TextInput
                style={styles.input}
                value={accountHolderName}
                onChangeText={setAccountHolderName}
                placeholder="Jean Dupont"
                placeholderTextColor={COLORS.textLight}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name de la banque (optionnel)</Text>
              <TextInput
                style={styles.input}
                value={bankName}
                onChangeText={setBankName}
                placeholder="Crédit Agricole"
                placeholderTextColor={COLORS.textLight}
                autoCapitalize="words"
              />
            </View>

            <TouchableOpacity
              style={[styles.addButton, isLoading && styles.addButtonDisabled]}
              onPress={handleAddAccount}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.addButtonText}>Add le compte</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: 16,
  },
  accountCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.medium,
  },
  selectedAccountCard: {
    borderColor: COLORS.primarySolid,
    backgroundColor: COLORS.primaryLight,
  },
  accountInfo: {
    flex: 1,
  },
  accountHolderName: {
    fontSize: SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: 4,
  },
  accountIban: {
    fontSize: SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  bankName: {
    fontSize: SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  accountStatus: {
    alignItems: 'flex-end',
  },
  primaryBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  primaryText: {
    fontSize: SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.white,
  },
  useAccountButton: {
    backgroundColor: COLORS.primarySolid,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  useAccountButtonText: {
    fontSize: SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  separatorText: {
    fontSize: SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textLight,
    marginHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addButton: {
    backgroundColor: COLORS.primarySolid,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: SIZES.md,
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
});

export default BankAccountModal; 