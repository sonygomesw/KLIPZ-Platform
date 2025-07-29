// Polyfill structuredClone AVANT d'importer Supabase
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
  };
}

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';
import ENV from './env';

const supabaseUrl = ENV.SUPABASE_URL;
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY;

// Debug: Vérifier que les variables d'environnement sont bien chargées
console.log('🔍 Debug Supabase Config:');
console.log('URL:', supabaseUrl ? `✅ Définie (${supabaseUrl.length} chars)` : '❌ Manquante');
console.log('Key:', supabaseAnonKey ? `✅ Définie (${supabaseAnonKey.length} chars)` : '❌ Manquante');

// Créer un client Supabase mock si les clés ne sont pas disponibles
let supabase: any;

// Vérification plus stricte des clés
const isValidSupabaseUrl = supabaseUrl && supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co');
const isValidSupabaseKey = supabaseAnonKey && supabaseAnonKey.startsWith('eyJ') && supabaseAnonKey.length > 100;

console.log('🔍 Validation Supabase:');
console.log('URL valide:', isValidSupabaseUrl ? '✅' : '❌');
console.log('Key valide:', isValidSupabaseKey ? '✅' : '❌');

// Vérifier que les clés sont valides avant d'initialiser Supabase
if (!isValidSupabaseUrl || !isValidSupabaseKey) {
  console.warn('⚠️ Supabase non configuré - Utilisation du mode mock');
  supabase = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({ error: null })
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) })
    })
  };
} else {
  try {
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    console.log('✅ Supabase initialisé avec succès');
  } catch (error) {
    console.error('❌ Erreur initialisation Supabase:', error);
    // Fallback vers mock
    supabase = {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signOut: async () => ({ error: null })
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) })
      })
    };
  }
}

export { supabase };

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