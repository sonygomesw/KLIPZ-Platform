import { supabase, supabaseUtils, Database } from '../config/supabase';
import { User } from '../types';
import { getTwitchDataFromUrl, validateTwitchUrl } from './twitchService';

export interface AuthUser {
  id: string;
  email: string;
  role: 'streamer' | 'clipper';
  twitchUrl?: string;
  tiktokUsername?: string;
  balance: number;
  createdAt: Date;
  // Nouvelles propriétés Twitch
  twitchUsername?: string;
  twitchDisplayName?: string;
  twitchFollowers?: number;
  twitchProfileImage?: string;
  // Nouvelles propriétés de profil
  displayName?: string;
  username?: string;
  phone?: string;
}

export interface StreamerSignUpData {
  email: string;
  password: string;
  twitchUrl: string;
}

export interface ClipperSignUpData {
  email: string;
  password: string;
  tiktokUsername: string;
}

class AuthService {
  // Inscription d'un streamer - Version avec intégration Twitch simplifiée
  async signUpStreamer(data: StreamerSignUpData): Promise<AuthUser> {
    try {
      console.log('🔵 Début inscription streamer:', data.email);
      
      // 1. Valider l'URL Twitch
      if (!validateTwitchUrl(data.twitchUrl)) {
        throw new Error('URL Twitch invalide');
      }
      
      // 2. Récupérer les données Twitch complètes
      console.log('🔵 Récupération des données Twitch...');
      const twitchData = await getTwitchDataFromUrl(data.twitchUrl);
      console.log('🔵 Données Twitch récupérées:', twitchData);
      
      // 3. Créer le compte Supabase Auth
      const authResult = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      console.log('🔵 Réponse Supabase Auth:', authResult);

      if (authResult.error) {
        console.error('❌ Error Supabase Auth:', authResult.error);
        throw new Error(authResult.error.message || 'Error lors de la création du compte');
      }
      
      if (!authResult.data.user) {
        console.error('❌ Pas d\'utilisateur retourné');
        throw new Error('Error lors de la création du compte');
      }

      console.log('🔵 Utilisateur créé:', authResult.data.user.id);

      // 4. Créer le profil utilisateur avec les données Twitch
      const userProfile = {
        id: authResult.data.user.id,
        email: data.email,
        role: 'streamer' as const,
        twitch_url: data.twitchUrl,
        twitch_followers: twitchData?.followers || 0,
        twitch_username: twitchData?.username || null,
        twitch_display_name: twitchData?.displayName || null,
        twitch_profile_image: twitchData?.profileImage || null,
      };

      console.log('🔵 Profil à insérer:', userProfile);

      const profileResult = await supabase
        .from('users')
        .insert(userProfile)
        .select()
        .single();

      console.log('🔵 Réponse insertion profil:', profileResult);

      if (profileResult.error) {
        console.error('❌ Error insertion profil:', profileResult.error);
        throw new Error(profileResult.error.message || 'Error lors de la création du profil');
      }

      console.log('🔵 Profil créé avec succès');

      // 5. Backner l'utilisateur formaté
      return {
        id: profileResult.data.id,
        email: profileResult.data.email,
        role: profileResult.data.role,
        twitchUrl: profileResult.data.twitch_url,
        tiktokUsername: profileResult.data.tiktok_username,
        balance: profileResult.data.balance || 0,
        createdAt: new Date(profileResult.data.created_at),
        twitchFollowers: profileResult.data.twitch_followers,
        twitchUsername: profileResult.data.twitch_username,
        twitchDisplayName: profileResult.data.twitch_display_name,
        twitchProfileImage: profileResult.data.twitch_profile_image,
      };
    } catch (error) {
      console.error('❌ Error complète inscription streamer:', error);
      if (error instanceof Error) {
        console.error('❌ Message d\'erreur:', error.message);
        throw new Error(error.message);
      }
      throw new Error('Error inconnue lors de l\'inscription');
    }
  }

  // Inscription d'un clipper - Version simplifiée
  async signUpClipper(data: ClipperSignUpData): Promise<AuthUser> {
    try {
      console.log('🔵 Début inscription clipper:', data.email);
      console.log('🔵 Données reçues:', { email: data.email, tiktokUsername: data.tiktokUsername });
      
      // 1. Vérifier si l'email existe déjà
      const existingUser = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email)
        .single();

      if (existingUser.data) {
        console.log('❌ Email déjà existant:', data.email);
        throw new Error('Un compte avec cet email existe déjà');
      }

      console.log('🔵 Email disponible, création du compte Auth...');

      // 2. Créer le compte Supabase Auth
      const authResult = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      console.log('🔵 Réponse Supabase Auth:', authResult);

      if (authResult.error) {
        console.error('❌ Error Supabase Auth:', authResult.error);
        throw new Error(authResult.error.message || 'Error lors de la création du compte');
      }
      
      if (!authResult.data.user) {
        console.error('❌ Pas d\'utilisateur retourné par Supabase Auth');
        throw new Error('Error lors de la création du compte');
      }

      console.log('🔵 Compte Auth créé avec succès:', authResult.data.user.id);

      // 3. Créer le profil utilisateur dans la base de données
      const userProfile = {
        id: authResult.data.user.id,
        email: data.email,
        role: 'clipper' as const,
        tiktok_username: data.tiktokUsername,
      };

      console.log('🔵 Profil à insérer dans la DB:', userProfile);

      const profileResult = await supabase
        .from('users')
        .insert(userProfile)
        .select()
        .single();

      console.log('🔵 Réponse insertion profil:', profileResult);

      if (profileResult.error) {
        console.error('❌ Error insertion profil:', profileResult.error);
        throw new Error(profileResult.error.message || 'Error lors de la création du profil');
      }

      console.log('🔵 Profil créé avec succès dans la DB');
      console.log('🔵 Données du profil créé:', profileResult.data);

      // 4. Backner l'utilisateur formaté
      const formattedUser = {
        id: profileResult.data.id,
        email: profileResult.data.email,
        role: profileResult.data.role,
        twitchUrl: profileResult.data.twitch_url,
        tiktokUsername: profileResult.data.tiktok_username,
        balance: profileResult.data.balance || 0,
        createdAt: new Date(profileResult.data.created_at),
      };

      console.log('🔵 Utilisateur formaté retourné:', formattedUser);
      return formattedUser;
    } catch (error) {
      console.error('❌ Error complète inscription clipper:', error);
      if (error instanceof Error) {
        console.error('❌ Message d\'erreur:', error.message);
        throw new Error(error.message);
      }
      throw new Error('Error inconnue lors de l\'inscription');
    }
  }

  // Connexion - Version simplifiée
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      console.log('🔵 Début connexion:', email);
      
      // 1. Connexion avec Supabase Auth
      const authResult = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authResult.error) {
        throw new Error(authResult.error.message || 'Error de connexion');
      }
      
      if (!authResult.data.user) {
        throw new Error('Error de connexion');
      }

      // 2. Récupérer le profil utilisateur
      const profileResult = await supabase
        .from('users')
        .select('*')
        .eq('id', authResult.data.user.id)
        .single();

      if (profileResult.error) {
        throw new Error('Error lors de la récupération du profil');
      }

      // 3. Backner l'utilisateur formaté
      return {
        id: profileResult.data.id,
        email: profileResult.data.email,
        role: profileResult.data.role,
        twitchUrl: profileResult.data.twitch_url,
        tiktokUsername: profileResult.data.tiktok_username,
        balance: profileResult.data.balance || 0,
        createdAt: new Date(profileResult.data.created_at),
        twitchFollowers: profileResult.data.twitch_followers,
        twitchUsername: profileResult.data.twitch_username,
        twitchDisplayName: profileResult.data.twitch_display_name,
        twitchProfileImage: profileResult.data.twitch_profile_image,
      };
    } catch (error) {
      console.error('❌ Error complète connexion:', error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Error inconnue lors de la connexion');
    }
  }

  // Sign Out
  async signOut(): Promise<boolean> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('❌ Error déconnexion:', error);
      return false;
    }
  }

  // Obtenir l'utilisateur actuel
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const user = await supabaseUtils.getCurrentUser();
      if (!user) return null;

      const profileResult = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileResult.error) {
        console.error('❌ Error profil utilisateur:', profileResult.error);
        return null;
      }

      // Si pas de données (profil pas encore créé)
      if (!profileResult.data) {
        console.log('⚠️ Profil utilisateur pas encore disponible');
        return null;
      }

      return {
        id: profileResult.data.id,
        email: profileResult.data.email,
        role: profileResult.data.role,
        twitchUrl: profileResult.data.twitch_url,
        tiktokUsername: profileResult.data.tiktok_username,
        balance: profileResult.data.balance || 0,
        createdAt: new Date(profileResult.data.created_at),
        twitchFollowers: profileResult.data.twitch_followers,
        twitchUsername: profileResult.data.twitch_username,
        twitchDisplayName: profileResult.data.twitch_display_name,
        twitchProfileImage: profileResult.data.twitch_profile_image,
        // Nouvelles propriétés de profil
        displayName: profileResult.data.display_name,
        username: profileResult.data.username,
        phone: profileResult.data.phone,
      };
    } catch (error) {
      console.error('❌ Error getCurrentUser:', error);
      return null;
    }
  }

  // Valider l'URL Twitch
  validateTwitchUrl(url: string): boolean {
    return validateTwitchUrl(url);
  }

  // Valider le nom d'utilisateur TikTok
  validateTikTokUsername(username: string): boolean {
    const tiktokUsernamePattern = /^[a-zA-Z0-9._]{1,24}$/;
    return tiktokUsernamePattern.test(username);
  }

  // Sauvegarder les modifications du profil
  async updateProfile(userId: string, profileData: {
    displayName?: string;
    username?: string;
    phone?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔵 Mise à jour du profil pour:', userId, profileData);
      
      const updateResult = await supabase
        .from('users')
        .update({
          display_name: profileData.displayName,
          username: profileData.username,
          phone: profileData.phone,
        })
        .eq('id', userId)
        .select('display_name, username, phone')
        .single();

      if (updateResult.error) {
        console.error('❌ Error mise à jour profil:', updateResult.error);
        
        // Gérer les erreurs spécifiques
        if (updateResult.error.code === '23505' && updateResult.error.message.includes('username_unique')) {
          return { success: false, error: 'Ce nom d\'utilisateur est déjà pris' };
        }
        
        return { success: false, error: updateResult.error.message };
      }

      console.log('✅ Profil mis à jour avec succès');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updateProfile:', error);
      return { success: false, error: 'Error inattendue' };
    }
  }

  // Mettre à jour les followers Twitch
  async updateTwitchFollowers(userId: string): Promise<number | null> {
    try {
      console.log('🔵 Mise à jour des followers Twitch pour:', userId);
      
      // 1. Récupérer l'URL Twitch de l'utilisateur
      const profileResult = await supabase
        .from('users')
        .select('twitch_url')
        .eq('id', userId)
        .single();

      if (profileResult.error || !profileResult.data.twitch_url) {
        console.error('❌ Pas d\'URL Twitch trouvée');
        return null;
      }

      // 2. Récupérer les nouvelles données Twitch
      const twitchData = await getTwitchDataFromUrl(profileResult.data.twitch_url);
      
      if (!twitchData) {
        console.error('❌ Impossible de récupérer les données Twitch');
        return null;
      }

      // 3. Mettre à jour la base de données
      const updateResult = await supabase
        .from('users')
        .update({
          twitch_followers: twitchData.followers,
          twitch_username: twitchData.username,
          twitch_display_name: twitchData.displayName,
          twitch_profile_image: twitchData.profileImage,
        })
        .eq('id', userId)
        .select('twitch_followers')
        .single();

      if (updateResult.error) {
        console.error('❌ Error mise à jour followers:', updateResult.error);
        return null;
      }

      console.log('✅ Followers mis à jour:', twitchData.followers);
      return twitchData.followers;
    } catch (error) {
      console.error('❌ Error mise à jour followers Twitch:', error);
      return null;
    }
  }
}

export default new AuthService(); 