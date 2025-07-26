// Polyfill structuredClone AVANT d'importer Supabase
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
  };
}

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Debug: Vérifier que les variables d'environnement sont bien chargées
console.log('🔍 Debug Supabase Config:');
console.log('URL:', supabaseUrl ? '✅ Définie' : '❌ Manquante');
console.log('Key:', supabaseAnonKey ? '✅ Définie' : '❌ Manquante');

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Désactiver la persistance automatique qui peut causer des problèmes
    storage: undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Utilitaires Supabase simplifiés
export const supabaseUtils = {
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.log('No current user session');
        return null;
      }
      return user;
    } catch (error) {
      console.log('Error getting current user:', error);
      return null;
    }
  },

  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  async updateUserProfile(userId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      return false;
    }
  }
};

export type { Database }; 