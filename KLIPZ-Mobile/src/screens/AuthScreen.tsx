import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';
import Button from '../components/Button';
import authService, { AuthUser } from '../services/authService';
import tiktokAuthService from '../services/tiktokAuthService';

interface AuthScreenProps {
  onAuthSuccess: (user: AuthUser) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<'streamer' | 'clipper' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twitchUrl, setTwitchUrl] = useState('');
  const [tiktokUsername, setTiktokUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStreamerAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // For registration, also check Twitch URL
    if (!isLogin) {
      if (!twitchUrl) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      
      // Validate Twitch URL
      if (!authService.validateTwitchUrl(twitchUrl)) {
        Alert.alert('Error', 'Invalid Twitch URL. Expected format: https://twitch.tv/your_channel');
        return;
      }
      
      // Check password confirmation for registration
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        // Streamer login - only email/password
        const user = await authService.signIn(email, password);
        onAuthSuccess(user);
      } else {
        // Streamer registration
        const user = await authService.signUpStreamer({
          email,
          password,
          twitchUrl,
        });
        
        onAuthSuccess(user);
      }
    } catch (error: any) {
      console.error('Error d\'authentification streamer:', error);
      
      if (error.message?.includes('Invalid login credentials')) {
        Alert.alert('Error', 'Incorrect email or password');
      } else if (error.message?.includes('User already registered')) {
        Alert.alert('Error', 'An account with this email already exists');
      } else if (error.message?.includes('Email not confirmed')) {
        Alert.alert('Error', 'Please confirm your email before logging in');
      } else {
        Alert.alert('Error', 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTikTokAuth = async () => {
    console.log('🔵 handleTikTokAuth appelé');
    console.log('🔵 État actuel:', { isLogin, email, tiktokUsername });
    
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // For registration, also check TikTok username
    if (!isLogin && !tiktokUsername) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Check password confirmation for registration
    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // For registration, also check TikTok username
    if (!isLogin) {
      if (!tiktokUsername) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      
      // Validate TikTok username
      if (!authService.validateTikTokUsername(tiktokUsername)) {
        Alert.alert('Error', 'Invalid TikTok username');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        console.log('🔵 Tentative de connexion clipper...');
        // Clipper login
        const user = await authService.signIn(email, password);
        
        // If user exists but has no TikTok username, update it
        if (user.role === 'clipper' && !user.tiktokUsername) {
          await authService.updateProfile(user.id, { tiktokUsername });
          user.tiktokUsername = tiktokUsername;
        }
        
        console.log('🔵 Connexion clipper réussie:', user);
        onAuthSuccess(user);
      } else {
        console.log('🔵 Tentative d\'inscription clipper...');
        
        // TikTok OAuth authentication for registration
        try {
          console.log('🔵 Début de l\'authentification TikTok...');
          const tiktokUserInfo = await tiktokAuthService.authenticateWithTikTok();
          
          console.log('🔵 Authentification TikTok réussie:', tiktokUserInfo);
          
          // Clipper registration with TikTok info
          const user = await authService.signUpClipper({
            email,
            password,
            tiktokUsername: tiktokUserInfo.username,
          });
          
          // Save TikTok info in the database
          await tiktokAuthService.saveTikTokInfo(user.id, tiktokUserInfo);
          
          console.log('🔵 Inscription clipper réussie:', user);
          onAuthSuccess(user);
        } catch (tiktokError: any) {
          console.error('❌ Error authentification TikTok:', tiktokError);
          
          if (tiktokError.message?.includes('ACCESS_DENIED')) {
            Alert.alert('Error', 'TikTok connection cancelled. Please try again.');
          } else if (tiktokError.message?.includes('INVALID_CODE')) {
            Alert.alert('Error', 'TikTok connection error. Please try again.');
          } else {
            Alert.alert('Error', 'Could not connect to TikTok. Please try again.');
          }
          throw tiktokError;
        }
      }
    } catch (error: any) {
      console.error('❌ Error d\'authentification clipper:', error);
      
      if (error.message?.includes('Invalid login credentials')) {
        Alert.alert('Error', 'Incorrect email or password');
      } else if (error.message?.includes('User already registered')) {
        Alert.alert('Error', 'An account with this email already exists');
      } else if (error.message?.includes('Email not confirmed')) {
        Alert.alert('Error', 'Please confirm your email before logging in');
      } else {
        Alert.alert('Error', 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderUserTypeSelection = () => (
    <View style={styles.container}>
      <View style={styles.centeredContent}>
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>KLIPZ</Text>
          </View>
          <Text style={styles.title}>Welcome to KLIPZ</Text>
          <Text style={styles.subtitle}>
            Log in to start creating or participating in campaigns
                  </Text>
        </View>

        <View style={styles.userTypeContainer}>
        <TouchableOpacity
          style={[
            styles.userTypeCard,
            userType === 'streamer' && styles.selectedCard,
          ]}
          onPress={() => setUserType('streamer')}
        >
          <View style={[styles.iconContainer, userType === 'streamer' && styles.selectedIconContainer]}>
            <Ionicons 
              name="game-controller" 
              size={32} 
              color={userType === 'streamer' ? '#FFFFFF' : COLORS.textSecondary} 
            />
          </View>
          <Text style={[
            styles.userTypeTitle,
            userType === 'streamer' && styles.selectedText,
          ]}>
            Streamer
          </Text>
          <Text style={styles.userTypeDescription}>
            Create campaigns and manage your budget
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.userTypeCard,
            userType === 'clipper' && styles.selectedCard,
          ]}
          onPress={() => setUserType('clipper')}
        >
          <View style={[styles.iconContainer, userType === 'clipper' && styles.selectedIconContainer]}>
            <Ionicons 
              name="videocam" 
              size={32} 
              color={userType === 'clipper' ? '#FFFFFF' : COLORS.textSecondary} 
            />
          </View>
          <Text style={[
            styles.userTypeTitle,
            userType === 'clipper' && styles.selectedText,
          ]}>
            Clipper
          </Text>
          <Text style={styles.userTypeDescription}>
            Create viral content and earn money
          </Text>
        </TouchableOpacity>

        {userType && (
          <Button
            title="Continue"
            onPress={handleContinue}
            style={styles.continueButton}
          />
        )}
      </View>
      </View>
    </View>
  );

  const renderAuthForm = () => (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {userType === 'streamer' ? 'Streamer Login' : 'Clipper Login'}
          </Text>
          <Text style={styles.subtitle}>
            {userType === 'streamer' 
              ? 'Connect your Twitch account to create campaigns'
              : 'Connect your TikTok account to start clipping'
            }
          </Text>
        </View>

        {userType === 'streamer' ? (
          <View style={styles.formContainer}>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, isLogin && styles.activeToggle]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.toggleText, isLogin && styles.activeToggleText]}>
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, !isLogin && styles.activeToggle]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.toggleText, !isLogin && styles.activeToggleText]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                secureTextEntry
              />
            </View>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm the password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  secureTextEntry
                />
              </View>
            )}

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Twitch URL</Text>
                <TextInput
                  style={styles.input}
                  value={twitchUrl}
                  onChangeText={setTwitchUrl}
                  placeholder="https://twitch.tv/your_channel"
                  autoCapitalize="none"
                />
              </View>
            )}

            <Button
              title={isLogin ? "Sign In" : "Sign Up"}
              onPress={handleStreamerAuth}
              loading={isLoading}
              style={styles.authButton}
            />
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, isLogin && styles.activeToggle]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.toggleText, isLogin && styles.activeToggleText]}>
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, !isLogin && styles.activeToggle]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.toggleText, !isLogin && styles.activeToggleText]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                secureTextEntry
              />
            </View>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm the password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  secureTextEntry
                />
              </View>
            )}

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>TikTok Username</Text>
                <TextInput
                  style={styles.input}
                  value={tiktokUsername}
                  onChangeText={setTiktokUsername}
                  placeholder="your_tiktok_username"
                  autoCapitalize="none"
                />
                <Text style={styles.helperText}>
                  Or connect directly with TikTok
                </Text>
              </View>
            )}

            <Button
              title={isLogin ? "Sign In" : "Sign Up"}
              onPress={handleTikTokAuth}
              loading={isLoading}
              style={styles.authButton}
            />

            {!isLogin && (
              <View style={styles.socialAuthContainer}>
                <Text style={styles.socialAuthText}>Or</Text>
                <TouchableOpacity
                  style={styles.tiktokButton}
                  onPress={async () => {
                    try {
                      setIsLoading(true);
                      const tiktokUserInfo = await tiktokAuthService.authenticateWithTikTok();
                      console.log('🔵 TikTok OAuth successful:', tiktokUserInfo);
                      
                      // Pre-fill the form
                      setTiktokUsername(tiktokUserInfo.username);
                      setEmail(tiktokUserInfo.username + '@tiktok.klipz');
                      
                      Alert.alert(
                        'TikTok Connection Successful',
                        `Welcome @${tiktokUserInfo.username}! Complete your registration.`
                      );
                    } catch (error: any) {
                      console.error('❌ Error TikTok OAuth:', error);
                      Alert.alert('Error', 'TikTok connection failed. Please try again.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                >
                  <Ionicons name="logo-tiktok" size={20} color="#FFFFFF" />
                  <Text style={styles.tiktokButtonText}>Connect with TikTok</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setUserType(null)}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {!userType ? renderUserTypeSelection() : renderAuthForm()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background, // Blanc
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContent: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    paddingHorizontal: SIZES.spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SIZES.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.xl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.xl * 2,
  },
  logoContainer: {
    backgroundColor: COLORS.primarySolid,
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.spacing.lg,
    shadowColor: COLORS.primarySolid,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  title: {
    fontSize: SIZES['3xl'],
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  subtitle: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  userTypeContainer: {
    width: '100%',
    marginBottom: SIZES.spacing.xl,
  },
  userTypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: SIZES.spacing.xl * 1.5,
    marginBottom: SIZES.spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 200,
    justifyContent: 'center',
  },
  selectedCard: {
    borderColor: COLORS.primarySolid,
    borderWidth: 3,
    backgroundColor: '#F8FAFF',
    shadowColor: COLORS.primarySolid,
    shadowOpacity: 0.2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.spacing.base,
  },
  selectedIconContainer: {
    backgroundColor: COLORS.primarySolid,
  },
  userTypeTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: SIZES.spacing.base,
    marginBottom: SIZES.spacing.sm,
    fontWeight: '600',
  },
  selectedText: {
    color: COLORS.primarySolid,
  },
  userTypeDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 220,
  },
  continueButton: {
    marginTop: SIZES.spacing.xl,
    width: '100%',
    maxWidth: 300,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: SIZES.spacing.lg,
  },
  inputLabel: {
    fontSize: SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginBottom: SIZES.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius.base,
    padding: SIZES.spacing.base,
    fontSize: SIZES.base,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    backgroundColor: COLORS.surface, // Gris clair
  },
  authButton: {
    marginTop: SIZES.spacing.xl,
  },
  tiktokAuthContainer: {
    alignItems: 'center',
    padding: SIZES.spacing.xl,
  },
  tiktokTitle: {
    fontSize: SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.sm,
  },
  tiktokDescription: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SIZES.spacing.xl,
  },
  tiktokButton: {
    minWidth: 200,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySolid,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: SIZES.spacing.xl,
    marginBottom: SIZES.spacing.lg,
    shadowColor: COLORS.primarySolid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 120,
  },
  backButtonText: {
    fontSize: 18,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.base,
    padding: 4,
    marginBottom: SIZES.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: SIZES.spacing.base,
    paddingHorizontal: SIZES.spacing.lg,
    borderRadius: SIZES.radius.sm,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: COLORS.primarySolid,
  },
  toggleText: {
    fontSize: SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  activeToggleText: {
    color: COLORS.white,
  },
  helperText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginTop: SIZES.spacing.xs,
  },
  socialAuthContainer: {
    marginTop: SIZES.spacing.lg,
    alignItems: 'center',
  },
  socialAuthText: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginBottom: SIZES.spacing.base,
  },
  tiktokButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: SIZES.spacing.base,
    paddingHorizontal: SIZES.spacing.lg,
    borderRadius: SIZES.radius.base,
    minWidth: 250,
    justifyContent: 'center',
    gap: SIZES.spacing.sm,
  },
  tiktokButtonText: {
    fontSize: SIZES.base,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  },
});

export default AuthScreen; 