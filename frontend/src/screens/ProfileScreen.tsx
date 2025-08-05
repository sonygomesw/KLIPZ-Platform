import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
  TextInput,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';
import { AuthUser } from '../services/authService';
import Button from '../components/Button';
import authService from '../services/authService';
import { supabase } from '../config/supabase';

interface ProfileScreenProps {
  user: AuthUser;
  onLogout: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogout }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [clipsCount, setClipsCount] = useState(0);
  const [campaignsCount, setCampaignsCount] = useState(0);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  const [profileData, setProfileData] = useState({
    name: user.displayName || (user.role === 'streamer' && user.twitchDisplayName ? user.twitchDisplayName : user.email.split('@')[0]),
    username: user.username || user.email.split('@')[0],
    email: user.email,
    phone: user.phone || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [showSavedPopup, setShowSavedPopup] = useState(false);

  // Gestion responsive
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  const isTablet = screenWidth > 768;
  const isDesktop = screenWidth > 1024;

  // Initialize country and phone number
  useEffect(() => {
    if (user.phone) {
      // Find country matching phone code
      const foundCountry = countries.find(country => 
        user.phone!.startsWith(country.dialCode)
      );
      
      if (foundCountry) {
        setSelectedCountry(foundCountry.code);
        // Extract number without country code
        const phoneWithoutCode = user.phone!.replace(foundCountry.dialCode, '');
        setProfileData(prev => ({ ...prev, phone: phoneWithoutCode }));
      }
    }
  }, [user.phone]);

  // List of countries with phone codes
  const countries = [
    { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
    { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39' },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪', dialCode: '+32' },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57' },
    { code: 'PE', name: 'Peru', flag: '🇵🇪', dialCode: '+51' },
    { code: 'VE', name: 'Venezuela', flag: '🇻🇪', dialCode: '+58' },
    { code: 'AT', name: 'Austria', flag: '🇦🇹', dialCode: '+43' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351' },
    { code: 'GR', name: 'Greece', flag: '🇬🇷', dialCode: '+30' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪', dialCode: '+46' },
    { code: 'NO', name: 'Norway', flag: '🇳🇴', dialCode: '+47' },
    { code: 'DK', name: 'Denmark', flag: '🇩🇰', dialCode: '+45' },
    { code: 'FI', name: 'Finland', flag: '🇫🇮', dialCode: '+358' },
    { code: 'PL', name: 'Poland', flag: '🇵🇱', dialCode: '+48' },
    { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', dialCode: '+420' },
    { code: 'HU', name: 'Hungary', flag: '🇭🇺', dialCode: '+36' },
    { code: 'RO', name: 'Romania', flag: '🇷🇴', dialCode: '+40' },
    { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', dialCode: '+359' },
    { code: 'HR', name: 'Croatia', flag: '🇭🇷', dialCode: '+385' },
    { code: 'SI', name: 'Slovenia', flag: '🇸🇮', dialCode: '+386' },
    { code: 'SK', name: 'Slovakia', flag: '🇸🇰', dialCode: '+421' },
    { code: 'IE', name: 'Ireland', flag: '🇮🇪', dialCode: '+353' },
    { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', dialCode: '+352' },
    { code: 'MC', name: 'Monaco', flag: '🇲🇨', dialCode: '+377' },
    { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺', dialCode: '+7' },
    { code: 'UA', name: 'Ukraine', flag: '🇺🇦', dialCode: '+380' },
    { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
    { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭', dialCode: '+66' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63' },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20' },
    { code: 'MA', name: 'Morocco', flag: '🇲🇦', dialCode: '+212' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254' },
    { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', dialCode: '+251' },
  ].sort((a, b) => a.name.localeCompare(b.name, 'en'));

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  // Charger les vraies statistiques
  useEffect(() => {
    const loadStats = async () => {
      try {
        if (user.role === 'clipper') {
          const { count: clips } = await supabase
            .from('declarations')
            .select('*', { count: 'exact', head: true })
            .eq('clipper_id', user.id);
          setClipsCount(clips || 0);
        } else if (user.role === 'streamer') {
          const { count: campaigns } = await supabase
            .from('campaigns')
            .select('*', { count: 'exact', head: true })
            .eq('streamer_id', user.id);
          setCampaignsCount(campaigns || 0);
        }
      } catch (error) {
        console.error('Error loading des stats:', error);
      }
    };

    loadStats();
  }, [user.id, user.role]);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  const handleSaveProfile = async () => {
    try {
      // Field validation
      if (!profileData.name.trim()) {
        Alert.alert('Error', 'Name cannot be empty');
        return;
      }

      if (!profileData.username.trim()) {
        Alert.alert('Error', 'Username cannot be empty');
        return;
      }

      // Username validation (letters, numbers, dashes, underscores)
      const usernameRegex = /^[a-zA-Z0-9_-]+$/;
      if (!usernameRegex.test(profileData.username.trim())) {
        Alert.alert('Error', 'Username can only contain letters, numbers, dashes and underscores');
        return;
      }

      setIsSaving(true);
      
      // Build complete number with country code
      const selectedCountryData = countries.find(c => c.code === selectedCountry);
      const fullPhoneNumber = profileData.phone.trim() 
        ? `${selectedCountryData?.dialCode || '+1'}${profileData.phone.trim()}`
        : '';

      const result = await authService.updateProfile(user.id, {
        displayName: profileData.name.trim(),
        username: profileData.username.trim(),
        phone: fullPhoneNumber,
      });

      if (result.success) {
        // Attendre un peu avant de montrer "Saved!"
        setTimeout(() => {
          setIsSaving(false);
          setShowSavedPopup(true);
          
          // Cacher "Saved!" après 3 secondes
          setTimeout(() => {
            setShowSavedPopup(false);
          }, 3000);
        }, 800);
        // Reload user data if needed
        // You could add a callback to refresh the data
      } else {
        setIsSaving(false);
        Alert.alert('Error', result.error || 'Unable to update profile');
      }
    } catch (error) {
      console.error('Error during save:', error);
      setIsSaving(false);
      Alert.alert('Error', 'An error occurred during save');
    }
  };

  const renderGeneralSection = () => (
    <View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Name</Text>
        <TextInput
          style={styles.textInput}
          value={profileData.name}
          onChangeText={(text) => setProfileData({...profileData, name: text})}
          placeholder="Your name"
          maxLength={50}
          autoCapitalize="words"
        />
      </View>



      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Username</Text>
        <TextInput
          style={styles.textInput}
          value={profileData.username}
          onChangeText={(text) => setProfileData({...profileData, username: text.toLowerCase()})}
          placeholder="Username"
          maxLength={30}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={[styles.textInput, styles.disabledInput]}
          value={profileData.email}
          editable={false}
          placeholder="Your email"
          keyboardType="email-address"
        />
        <Text style={styles.disabledNote}>Email cannot be modified</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <View style={styles.phoneInputContainer}>
          <View style={styles.countryPickerContainer}>
            <Picker
              selectedValue={selectedCountry}
              onValueChange={(itemValue) => setSelectedCountry(itemValue)}
              style={styles.countryPicker}
            >
              {countries.map((country) => (
                <Picker.Item
                  key={country.code}
                  label={`${country.flag} ${country.dialCode}`}
                  value={country.code}
                />
              ))}
            </Picker>
          </View>
          <TextInput
            style={styles.phoneInput}
            value={profileData.phone}
            onChangeText={(text) => setProfileData({...profileData, phone: text})}
            placeholder="Phone number"
            keyboardType="phone-pad"
            maxLength={15}
          />
        </View>
      </View>



      <View style={styles.saveButtonContainer}>
        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={isSaving}
        >
          <LinearGradient
            colors={isSaving ? ['#4a5cf9', '#4a5cf9'] : ['#4a5cf9', '#4a5cf9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveButtonGradient}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            )}
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        {showSavedPopup && (
          <Text style={styles.savedText}>Saved!</Text>
        )}
      </View>
    </View>
  );



  const renderSecuritySection = () => (
    <View>
      <View style={styles.securityItem}>
        <View style={styles.securityInfo}>
          <Ionicons name="lock-closed" size={20} color="#4a5cf9" />
          <View style={styles.securityDetails}>
            <Text style={styles.securityName}>Password</Text>
            <Text style={styles.securityDescription}>Change your password</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="pencil" size={14} color="#FFFFFF" style={{marginLeft: -8}} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>


    </View>
  );







  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Profile</Text>
      <View style={styles.mainContentContainer}>
        <View style={styles.centeredContainer}>
          <View style={styles.sectionsContainer}>
            <View style={[
              styles.leftSection,
              !isTablet && styles.sectionMobile
            ]}>
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                {renderGeneralSection()}
              </View>
            </View>
            
            {isTablet && (
              <View style={styles.rightSection}>
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Security & Privacy</Text>
                  {renderSecuritySection()}
                </View>
              </View>
            )}
          </View>
          
          {!isTablet && (
            <View style={[styles.rightSection, styles.sectionMobile]}>
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Security & Privacy</Text>
                {renderSecuritySection()}
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0A0A0A',
  },
  pageTitle: {
    fontSize: 14,
    fontFamily: 'Inter_18pt-Medium',
    color: '#e0e0e0',
    textAlign: 'center',
    marginTop: -20,
    marginBottom: 8,
  },
  mainContentContainer: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    margin: 8,
    padding: 20,
    flex: 1,
    height: '96%',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    height: '100%',
  },
  sectionsContainer: {
    flexDirection: 'row',
    gap: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  sectionsContainerMobile: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  leftSection: {
    flex: 1,
    minWidth: 350,
    maxWidth: 600,
    height: 600,
  },
  sectionMobile: {
    width: '100%',
    maxWidth: 600,
    marginBottom: 16,
    height: 400,
  },
  rightSection: {
    flex: 1,
    minWidth: 350,
    maxWidth: 600,
    height: 600,
  },
  sectionCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    width: '100%',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Inter_18pt-SemiBold',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginBottom: SIZES.spacing.xl,
  },
  headerTitle: {
    fontSize: 40,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
  },
  headerTitleContainer: {
    alignSelf: 'stretch',
    marginHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: SIZES.spacing.xl,
  },
  headerTitleGradient: {
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#333',
    borderBottomWidth: 3,
    borderBottomColor: '#222',
    backgroundColor: '#1A1A1E',
  },
  headerTitleContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDescription: {
    fontSize: 24,
    fontFamily: FONTS.regular,
    color: '#B5B5B5',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 20,
    flexShrink: 1,
  },


  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
    backgroundColor: '#2A2A2E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  tableTitle: {
    fontSize: 14,
    fontFamily: 'Inter_18pt-SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionSpacer: {
    height: 32,
  },
  bottomSpacer: {
    height: 12,
  },

  sectionDescription: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#B5B5B5',
    marginBottom: 32,
    lineHeight: 22,
    opacity: 0.7,
    paddingHorizontal: 40,
    paddingTop: 8,
  },

  configureButton: {
    backgroundColor: '#2A2A2E',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 90,
    marginLeft: 20,
    marginRight: 8,
  },
  configureButtonText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  },

  mainContent: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  contentHeader: {
    padding: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  contentTitle: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
  },
  contentSection: {
    padding: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Inter_18pt-Medium',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: 'Inter_18pt-Regular',
    color: '#FFFFFF',
    backgroundColor: '#0A0A0A',
    marginBottom: 8,
    ...(Platform.OS === 'web' && { outline: 'none' }),
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    backgroundColor: '#0A0A0A',
    marginBottom: 8,
  },
  countryPickerContainer: {
    borderRightWidth: 1,
    borderRightColor: '#333',
    minWidth: 120,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  countryPicker: {
    color: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: 'Inter_18pt-Regular',
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' && { outline: 'none' }),
  },
  saveButtonContainer: {
    paddingHorizontal: 0,
    paddingTop: 20,
    paddingBottom: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  saveButton: {
    borderRadius: 12,
    minWidth: 140,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  disabledInput: {
    backgroundColor: '#2A2A2E',
    color: '#B5B5B5',
    borderColor: '#333',
    opacity: 0.6,
  },
  disabledNote: {
    fontSize: 12,
    color: '#B5B5B5',
    marginTop: 4,
    marginBottom: 4,
    fontStyle: 'italic',
    fontFamily: 'Inter_18pt-Regular',
  },


  securityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  securityDetails: {
    marginLeft: 12,
    flex: 1,
  },
  securityName: {
    fontSize: 13,
    fontFamily: 'Inter_18pt-Medium',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  securityDescription: {
    fontSize: 12,
    fontFamily: 'Inter_18pt-Regular',
    color: '#B5B5B5',
  },
  actionButton: {
    backgroundColor: '#4a5cf9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 8,
    fontFamily: 'Inter_18pt-Medium',
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentDetails: {
    marginLeft: 16,
  },
  paymentName: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#B5B5B5',
  },
  addButton: {
    backgroundColor: '#d9d9d9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#0a0a0a',
  },
  savedText: {
    fontSize: 14,
    fontFamily: 'Inter_18pt-SemiBold',
    color: '#10B981',
    textAlign: 'center',
    marginTop: 8,
    opacity: 1,
    ...(Platform.OS === 'web' && {
      transition: 'opacity 0.3s ease-in-out',
    }),
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },

});

export default ProfileScreen; 