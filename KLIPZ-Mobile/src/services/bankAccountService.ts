import { supabase } from '../config/supabase';

export interface BankAccount {
  id: string;
  user_id: string;
  iban: string;
  account_holder_name: string;
  bank_name?: string;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBankAccountData {
  iban: string;
  account_holder_name: string;
  bank_name?: string;
}

class BankAccountService {
  /**
   * Récupérer les comptes bancaires d'un utilisateur
   */
  async getUserBankAccounts(userId: string): Promise<BankAccount[]> {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error lors de la récupération des comptes bancaires:', error);
      throw error;
    }
  }

  /**
   * Récupérer le compte bancaire principal d'un utilisateur
   */
  async getPrimaryBankAccount(userId: string): Promise<BankAccount | null> {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data;
    } catch (error) {
      console.error('Error lors de la récupération du compte principal:', error);
      throw error;
    }
  }

  /**
   * Add un nouveau compte bancaire
   */
  async addBankAccount(userId: string, data: CreateBankAccountData): Promise<BankAccount> {
    try {
      // Valider l'IBAN
      if (!this.validateIBAN(data.iban)) {
        throw new Error('Format IBAN invalide');
      }

      // Vérifier si c'est le premier compte (devient automatiquement principal)
      const existingAccounts = await this.getUserBankAccounts(userId);
      const isPrimary = existingAccounts.length === 0;

      const bankAccountData = {
        user_id: userId,
        iban: data.iban.toUpperCase().replace(/\s/g, ''),
        account_holder_name: data.account_holder_name,
        bank_name: data.bank_name,
        is_primary: isPrimary,
      };

      const { data: result, error } = await supabase
        .from('bank_accounts')
        .insert(bankAccountData)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error lors de l\'ajout du compte bancaire:', error);
      throw error;
    }
  }

  /**
   * Définir un compte comme principal
   */
  async setPrimaryBankAccount(userId: string, accountId: string): Promise<void> {
    try {
      // Désactiver tous les comptes principaux existants
      await supabase
        .from('bank_accounts')
        .update({ is_primary: false })
        .eq('user_id', userId);

      // Définir le nouveau compte principal
      const { error } = await supabase
        .from('bank_accounts')
        .update({ is_primary: true })
        .eq('id', accountId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error lors de la définition du compte principal:', error);
      throw error;
    }
  }

  /**
   * Supprimer un compte bancaire
   */
  async deleteBankAccount(userId: string, accountId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', accountId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error lors de la suppression du compte bancaire:', error);
      throw error;
    }
  }

  /**
   * Valider le format IBAN
   */
  validateIBAN(iban: string): boolean {
    // Nettoyer l'IBAN
    const cleanIban = iban.toUpperCase().replace(/\s/g, '');
    
    // Format basique pour les IBANs européens
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;
    
    return ibanRegex.test(cleanIban);
  }

  /**
   * Formater l'IBAN pour l'affichage
   */
  formatIBAN(iban: string): string {
    const cleanIban = iban.toUpperCase().replace(/\s/g, '');
    return cleanIban.replace(/(.{4})/g, '$1 ').trim();
  }

  /**
   * Masquer l'IBAN pour l'affichage sécurisé
   */
  maskIBAN(iban: string): string {
    const cleanIban = iban.toUpperCase().replace(/\s/g, '');
    if (cleanIban.length < 8) return cleanIban;
    
    const prefix = cleanIban.substring(0, 4);
    const suffix = cleanIban.substring(cleanIban.length - 4);
    const masked = '*'.repeat(cleanIban.length - 8);
    
    return `${prefix} ${masked} ${suffix}`;
  }
}

export const bankAccountService = new BankAccountService(); 