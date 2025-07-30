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
  Image,
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
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [tiktokUsername, setTiktokUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStreamerAuth = async () => {
    console.log('🔵 handleStreamerAuth appelé');
    console.log('🔵 État actuel:', { isLogin, email, password, confirmPassword, twitchUrl });
    
    console.log('🔵 Vérification des champs...');
    if (!email || !password) {
      console.log('❌ Champs manquants');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    console.log('✅ Champs email/password OK');

    // For registration, also check Twitch or YouTube URL
    if (!isLogin) {
      console.log('🔵 Mode inscription - vérifications supplémentaires...');
      
      if (!twitchUrl && !youtubeUrl) {
        console.log('❌ Aucune chaîne fournie');
        Alert.alert('Error', 'Please provide at least one channel (Twitch or YouTube)');
        return;
      }
      console.log('✅ Au moins une chaîne fournie');
      
      // Validate Twitch URL if provided
      if (twitchUrl) {
        console.log('🔵 Validation URL Twitch...');
        if (!authService.validateTwitchUrl(twitchUrl)) {
          console.log('❌ URL Twitch invalide');
          Alert.alert('Error', 'Invalid Twitch URL. Expected format: https://twitch.tv/your_channel');
          return;
        }
        console.log('✅ URL Twitch valide');
      }
      
      // Validate YouTube URL if provided
      if (youtubeUrl) {
        console.log('🔵 Validation URL YouTube...');
        if (!youtubeUrl.includes('youtube.com/') && !youtubeUrl.includes('youtu.be/')) {
          console.log('❌ URL YouTube invalide');
          Alert.alert('Error', 'Invalid YouTube URL. Expected format: https://youtube.com/@your_channel');
          return;
        }
        console.log('✅ URL YouTube valide');
      }
      
      // Check password confirmation for registration
      console.log('🔵 Vérification confirmation mot de passe...');
      if (password !== confirmPassword) {
        console.log('❌ Mots de passe différents');
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      console.log('✅ Mots de passe identiques');
    }

    console.log('🔵 Début du processus d\'authentification...');
    setIsLoading(true);
    try {
      if (isLogin) {
        console.log('🔵 Mode connexion...');
        // Streamer login - only email/password
        const user = await authService.signIn(email, password);
        console.log('✅ Connexion réussie:', user);
        onAuthSuccess(user);
      } else {
        console.log('🔵 Mode inscription...');
        // Streamer registration
        console.log('🔵 Appel de signUpStreamer...');
        const user = await authService.signUpStreamer({
          email,
          password,
          twitchUrl,
          youtubeUrl,
        });
        
        console.log('✅ Inscription réussie:', user);
        onAuthSuccess(user);
      }
    } catch (error: any) {
      console.error('❌ Error d\'authentification streamer:', error);
      console.error('❌ Message d\'erreur:', error.message);
      console.error('❌ Stack:', error.stack);
      
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
      console.log('🔵 Fin du processus d\'authentification');
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

  const handleContinue = () => {
    // Cette fonction sera appelée quand l'utilisateur clique sur Continue
  };

  const renderUserTypeSelection = () => (
    <View style={styles.container}>
      <View style={styles.centeredContent}>
        <View style={styles.headerContainer}>
          <Image 
            source={require('../../assets/klipz-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome</Text>
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
          <View style={styles.platformLogosContainer}>
            <View style={[styles.iconContainer, userType === 'streamer' && styles.selectedIconContainer]}>
              <Image 
                source={require('../../assets/twitch-logo.jpg')}
                style={styles.platformLogo}
                resizeMode="contain"
              />
            </View>
            <View style={[styles.iconContainer, userType === 'streamer' && styles.selectedIconContainer]}>
              <Image 
                source={require('../../assets/youtube_logo.png')}
                style={styles.platformLogo}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={[
            styles.userTypeTitle,
            userType === 'streamer' && styles.selectedText,
          ]}>
            Streamer / YouTubeur
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
              <Image 
                source={require('../../assets/tiktok-logo.png')}
                style={styles.platformLogo}
                resizeMode="contain"
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
          <Image 
            source={require('../../assets/klipz-logo.png')}
            style={styles.authLogoImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>
            {userType === 'streamer' 
              ? (isLogin ? 'Streamer Login' : 'Streamer Sign Up')
              : (isLogin ? 'Clipper Login' : 'Clipper Sign Up')
            }
          </Text>
          <Text style={styles.subtitle}>
            {userType === 'streamer' 
              ? 'Connect your Twitch or YouTube account to create campaigns'
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
                <Text style={styles.inputLabel}>Chaîne Twitch</Text>
                <TextInput
                  style={styles.input}
                  value={twitchUrl}
                  onChangeText={setTwitchUrl}
                  placeholder="https://twitch.tv/your_channel"
                  autoCapitalize="none"
                />
              </View>
            )}

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Chaîne YouTube</Text>
                <TextInput
                  style={styles.input}
                  value={youtubeUrl}
                  onChangeText={setYoutubeUrl}
                  placeholder="https://youtube.com/@your_channel"
                  autoCapitalize="none"
                />
              </View>
            )}

            <Button
              title={isLogin ? "Sign In" : "Sign Up"}
              onPress={() => {
                console.log('🔵 Bouton cliqué !');
                console.log('🔵 isLogin:', isLogin);
                console.log('🔵 Titre du bouton:', isLogin ? "Sign In" : "Sign Up");
                if (userType === 'streamer') {
                  handleStreamerAuth();
                } else {
                  handleTikTokAuth();
                }
              }}
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
                  placeholder="Your TikTok username"
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
                  <Ionicons name="logo-tiktok" size={25} color="#000000" />
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
    backgroundColor: '#0A0A0B', // Blanc
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContent: {
    width: '100%',
    maxWidth: 550,
    alignItems: 'center',
    paddingHorizontal: 26,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 24,
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 31.5, // Reduced by 10% from 35
    marginTop: 16.2, // Reduced by 10% from 18
  },
  logoContainer: {
    backgroundColor: '#0052FF',
    width: 132,
    height: 132,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 35,
    shadowColor: '#0052FF',
    shadowOffset: { width: 0, height: 13 },
    shadowOpacity: 0.4,
    shadowRadius: 26,
    elevation: 13,
  },
  logoImage: {
    width: 80, // Reduced by 10% from 110
    height: 80, // Reduced by 10% from 110
    marginBottom: 31.5, // Reduced by 10% from 35
    borderRadius: 16,
  },
  authLogoImage: {
    width: 65, // Reduced by 10% from 59
    height: 65, // Reduced by 10% from 59
    marginBottom: 18, // Reduced by 10% from 20
    borderRadius: 16,
  },
      title: {
      fontSize: 21.6, // Reduced by 10% from 24
      fontFamily: 'Inter_18pt-SemiBold',
      color: '#FFFFFF',
      textAlign: 'center',
      marginTop: 7.2, // Reduced by 10% from 8
      marginBottom: 7.2, // Reduced by 10% from 8
      fontWeight: '700',
    },
  subtitle: {
    fontSize: 10.8, // Reduced by 10% from 12
    color: '#8B8B8D',
    textAlign: 'center',
    lineHeight: 13.5, // Reduced by 10% from 15
    maxWidth: 249.3, // Reduced by 10% from 277
    marginBottom: -7.2, // Reduced by 10% from -8
  },
  userTypeContainer: {
    width: '100%',
    marginBottom: 21.6, // Reduced by 10% from 24
    flexDirection: 'column',
    gap: 12.6, // Reduced by 10% from 14
  },
  userTypeCard: {
    backgroundColor: '#1A1A1E',
    borderRadius: 16, // Reduced by 10% from 12
    padding: 19.8, // Reduced by 10% from 22
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3.6 }, // Reduced by 10% from 4
    shadowOpacity: 0.3,
    shadowRadius: 9, // Reduced by 10% from 10
    elevation: 6,
    minHeight: 200, // Increased from 130.5 to 150
    justifyContent: 'center',
    width: '100%',
  },
  selectedCard: {
    borderColor: '#0052FF',
    borderWidth: 2.7, // Reduced by 10% from 3
    backgroundColor: '#2A2A2E',
    shadowColor: '#0052FF',
    shadowOpacity: 0.3,
  },
  iconContainer: {
    width: 55.8, // Reduced by 10% from 62
    height: 55.8, // Reduced by 10% from 62
    borderRadius: 13.5, // Reduced by 10% from 15
    backgroundColor: '#2A2A2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 9, // Reduced by 10% from 10
  },
  platformLogosContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8.1, // Reduced by 10% from 9
    gap: 12.6, // Reduced by 10% from 14
  },
  platformLogo: {
    width: 32.4, // Reduced by 10% from 36
    height: 32.4, // Reduced by 10% from 36
    borderRadius: 8.1, // Reduced by 10% from 9
  },
  selectedIconContainer: {
    backgroundColor: '#0052FF',
  },
  userTypeTitle: {
    fontSize: 17.1, // Reduced by 10% from 19
    fontFamily: 'Inter_18pt-SemiBold',
    color: '#FFFFFF',
    marginTop: 13.5, // Reduced by 10% from 15
    marginBottom: 13.5, // Reduced by 10% from 15
    fontWeight: '600',
  },
  selectedText: {
    color: '#0052FF',
  },
  userTypeDescription: {
    fontSize: 9.9, // Reduced by 10% from 11
    color: '#8B8B8D',
    textAlign: 'center',
    lineHeight: 12.6, // Reduced by 10% from 14
    maxWidth: 139.5, // Reduced by 10% from 155
  },
  continueButton: {
    marginTop: 12.6, // Reduced by 10% from 14
    width: '100%',
    maxWidth: 134.1, // Reduced by 10% from 149
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: 'Inter_18pt-Medium',
    color: '#FFFFFF',
    marginBottom: 6,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#2A2A2E',
    borderRadius: 7,
    padding: 13,
    fontSize: 11,
    fontFamily: 'Inter_18pt-Regular',
    color: '#FFFFFF',
    backgroundColor: '#1A1A1E',
    minHeight: 31,
    ...(Platform.OS === 'web' && { outline: 'none' }),
  },
  authButton: {
    marginTop: 20,
    minHeight: 36,
  },
  tiktokAuthContainer: {
    alignItems: 'center',
    padding: 31,
  },
  tiktokTitle: {
    fontSize: 20,
    fontFamily: 'Inter_18pt-SemiBold',
    color: '#FFFFFF',
    marginTop: 23,
    marginBottom: 8,
  },
  tiktokDescription: {
    fontSize: 16,
    color: '#8B8B8D',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 31,
  },
  tiktokButton: {
    width: '100%',
    minHeight: 36,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginTop: 30,
    marginBottom: 31,
    minWidth: 79,
  },
  backButtonText: {
    fontSize: 13,
    fontFamily: 'FONTS.medium',
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginLeft: -18,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1E',
    borderRadius: 7,
    padding: 2.5,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#2A2A2E',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 5,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#4a5cf9',
  },
  toggleText: {
    fontSize: 13,
    fontFamily: 'FONTS.medium',
    color: '#8B8B8D',
    fontWeight: '600',
  },
  activeToggleText: {
    color: '#FFFFFF',
  },
  helperText: {
    fontSize: 13,
    color: '#8B8B8D',
    fontFamily: 'Inter_18pt-Regular',
    marginTop: 4,
  },
  socialAuthContainer: {
    marginTop: 23,
    alignItems: 'center',
  },
  socialAuthText: {
    fontSize: 16,
    color: '#8B8B8D',
    fontFamily: 'Inter_18pt-Regular',
    marginBottom: 16,
  },
  tiktokButtonText: {
    fontSize: 13,
    fontFamily: 'Inter_18pt-Medium',
    fontWeight: '600',
    color: '#000000',
    marginLeft: 3,
  },
});

export default AuthScreen; 