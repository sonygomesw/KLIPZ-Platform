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

  const [profileData, setProfileData] = useState({
    name: user.displayName || (user.role === 'streamer' && user.twitchDisplayName ? user.twitchDisplayName : user.email.split('@')[0]),
    username: user.username || user.email.split('@')[0],
    email: user.email,
    phone: user.phone || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('US');

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
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
    { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39' },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪', dialCode: '+32' },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31' },
    { code: 'AU', name: 'Australie', flag: '🇦🇺', dialCode: '+61' },
    { code: 'JP', name: 'Japon', flag: '🇯🇵', dialCode: '+81' },
    { code: 'KR', name: 'Corée du Sud', flag: '🇰🇷', dialCode: '+82' },
    { code: 'BR', name: 'Brésil', flag: '🇧🇷', dialCode: '+55' },
    { code: 'MX', name: 'Mexique', flag: '🇲🇽', dialCode: '+52' },
    { code: 'AR', name: 'Argentine', flag: '🇦🇷', dialCode: '+54' },
    { code: 'CL', name: 'Chili', flag: '🇨🇱', dialCode: '+56' },
    { code: 'CO', name: 'Colombie', flag: '🇨🇴', dialCode: '+57' },
    { code: 'PE', name: 'Pérou', flag: '🇵🇪', dialCode: '+51' },
    { code: 'VE', name: 'Venezuela', flag: '🇻🇪', dialCode: '+58' },
    { code: 'UY', name: 'Uruguay', flag: '🇺🇾', dialCode: '+598' },
    { code: 'PY', name: 'Paraguay', flag: '🇵🇾', dialCode: '+595' },
    { code: 'BO', name: 'Bolivie', flag: '🇧🇴', dialCode: '+591' },
    { code: 'EC', name: 'Équateur', flag: '🇪🇨', dialCode: '+593' },
    { code: 'GY', name: 'Guyane', flag: '🇬🇾', dialCode: '+592' },
    { code: 'SR', name: 'Suriname', flag: '🇸🇷', dialCode: '+597' },
    { code: 'GF', name: 'Guyane française', flag: '🇬🇫', dialCode: '+594' },
    { code: 'MC', name: 'Monaco', flag: '🇲🇨', dialCode: '+377' },
    { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', dialCode: '+352' },
    { code: 'AT', name: 'Autriche', flag: '🇦🇹', dialCode: '+43' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351' },
    { code: 'GR', name: 'Grèce', flag: '🇬🇷', dialCode: '+30' },
    { code: 'SE', name: 'Suède', flag: '🇸🇪', dialCode: '+46' },
    { code: 'NO', name: 'Norvège', flag: '🇳🇴', dialCode: '+47' },
    { code: 'DK', name: 'Danemark', flag: '🇩🇰', dialCode: '+45' },
    { code: 'FI', name: 'Finlande', flag: '🇫🇮', dialCode: '+358' },
    { code: 'PL', name: 'Pologne', flag: '🇵🇱', dialCode: '+48' },
    { code: 'CZ', name: 'République tchèque', flag: '🇨🇿', dialCode: '+420' },
    { code: 'HU', name: 'Hongrie', flag: '🇭🇺', dialCode: '+36' },
    { code: 'RO', name: 'Roumanie', flag: '🇷🇴', dialCode: '+40' },
    { code: 'BG', name: 'Bulgarie', flag: '🇧🇬', dialCode: '+359' },
    { code: 'HR', name: 'Croatie', flag: '🇭🇷', dialCode: '+385' },
    { code: 'SI', name: 'Slovénie', flag: '🇸🇮', dialCode: '+386' },
    { code: 'SK', name: 'Slovaquie', flag: '🇸🇰', dialCode: '+421' },
    { code: 'LT', name: 'Lituanie', flag: '🇱🇹', dialCode: '+370' },
    { code: 'LV', name: 'Lettonie', flag: '🇱🇻', dialCode: '+371' },
    { code: 'EE', name: 'Estonie', flag: '🇪🇪', dialCode: '+372' },
    { code: 'IE', name: 'Irlande', flag: '🇮🇪', dialCode: '+353' },
    { code: 'IS', name: 'Islande', flag: '🇮🇸', dialCode: '+354' },
    { code: 'MT', name: 'Malte', flag: '🇲🇹', dialCode: '+356' },
    { code: 'CY', name: 'Chypre', flag: '🇨🇾', dialCode: '+357' },
    { code: 'TR', name: 'Turquie', flag: '🇹🇷', dialCode: '+90' },
    { code: 'RU', name: 'Russie', flag: '🇷🇺', dialCode: '+7' },
    { code: 'UA', name: 'Ukraine', flag: '🇺🇦', dialCode: '+380' },
    { code: 'BY', name: 'Biélorussie', flag: '🇧🇾', dialCode: '+375' },
    { code: 'MD', name: 'Moldavie', flag: '🇲🇩', dialCode: '+373' },
    { code: 'GE', name: 'Géorgie', flag: '🇬🇪', dialCode: '+995' },
    { code: 'AM', name: 'Arménie', flag: '🇦🇲', dialCode: '+374' },
    { code: 'AZ', name: 'Azerbaïdjan', flag: '🇦🇿', dialCode: '+994' },
    { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', dialCode: '+7' },
    { code: 'UZ', name: 'Ouzbékistan', flag: '🇺🇿', dialCode: '+998' },
    { code: 'KG', name: 'Kirghizistan', flag: '🇰🇬', dialCode: '+996' },
    { code: 'TJ', name: 'Tadjikistan', flag: '🇹🇯', dialCode: '+992' },
    { code: 'TM', name: 'Turkménistan', flag: '🇹🇲', dialCode: '+993' },
    { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', dialCode: '+93' },
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92' },
    { code: 'IN', name: 'Inde', flag: '🇮🇳', dialCode: '+91' },
    { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', dialCode: '+880' },
    { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', dialCode: '+94' },
    { code: 'NP', name: 'Népal', flag: '🇳🇵', dialCode: '+977' },
    { code: 'BT', name: 'Bhoutan', flag: '🇧🇹', dialCode: '+975' },
    { code: 'MV', name: 'Maldives', flag: '🇲🇻', dialCode: '+960' },
    { code: 'MM', name: 'Myanmar', flag: '🇲🇲', dialCode: '+95' },
    { code: 'TH', name: 'Thaïlande', flag: '🇹🇭', dialCode: '+66' },
    { code: 'LA', name: 'Laos', flag: '🇱🇦', dialCode: '+856' },
    { code: 'KH', name: 'Cambodge', flag: '🇰🇭', dialCode: '+855' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84' },
    { code: 'MY', name: 'Malaisie', flag: '🇲🇾', dialCode: '+60' },
    { code: 'SG', name: 'Singapour', flag: '🇸🇬', dialCode: '+65' },
    { code: 'ID', name: 'Indonésie', flag: '🇮🇩', dialCode: '+62' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63' },
    { code: 'TW', name: 'Taïwan', flag: '🇹🇼', dialCode: '+886' },
    { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', dialCode: '+852' },
    { code: 'MO', name: 'Macao', flag: '🇲🇴', dialCode: '+853' },
    { code: 'CN', name: 'Chine', flag: '🇨🇳', dialCode: '+86' },
    { code: 'MN', name: 'Mongolie', flag: '🇲🇳', dialCode: '+976' },
    { code: 'KP', name: 'Corée du Nord', flag: '🇰🇵', dialCode: '+850' },
    { code: 'NZ', name: 'Nouvelle-Zélande', flag: '🇳🇿', dialCode: '+64' },
    { code: 'FJ', name: 'Fidji', flag: '🇫🇯', dialCode: '+679' },
    { code: 'PG', name: 'Papouasie-Nouvelle-Guinée', flag: '🇵🇬', dialCode: '+675' },
    { code: 'SB', name: 'Îles Salomon', flag: '🇸🇧', dialCode: '+677' },
    { code: 'VU', name: 'Vanuatu', flag: '🇻🇺', dialCode: '+678' },
    { code: 'NC', name: 'Nouvelle-Calédonie', flag: '🇳🇨', dialCode: '+687' },
    { code: 'PF', name: 'Polynésie française', flag: '🇵🇫', dialCode: '+689' },
    { code: 'WF', name: 'Wallis-et-Futuna', flag: '🇼🇫', dialCode: '+681' },
    { code: 'TO', name: 'Tonga', flag: '🇹🇴', dialCode: '+676' },
    { code: 'WS', name: 'Samoa', flag: '🇼🇸', dialCode: '+685' },
    { code: 'KI', name: 'Kiribati', flag: '🇰🇮', dialCode: '+686' },
    { code: 'TV', name: 'Tuvalu', flag: '🇹🇻', dialCode: '+688' },
    { code: 'NR', name: 'Nauru', flag: '🇳🇷', dialCode: '+674' },
    { code: 'PW', name: 'Palaos', flag: '🇵🇼', dialCode: '+680' },
    { code: 'MH', name: 'Îles Marshall', flag: '🇲🇭', dialCode: '+692' },
    { code: 'FM', name: 'Micronésie', flag: '🇫🇲', dialCode: '+691' },
    { code: 'GU', name: 'Guam', flag: '🇬🇺', dialCode: '+1' },
    { code: 'MP', name: 'Îles Mariannes du Nord', flag: '🇲🇵', dialCode: '+1' },
    { code: 'AS', name: 'Samoa américaines', flag: '🇦🇸', dialCode: '+1' },
    { code: 'PR', name: 'Porto Rico', flag: '🇵🇷', dialCode: '+1' },
    { code: 'VI', name: 'Îles Vierges américaines', flag: '🇻🇮', dialCode: '+1' },
    { code: 'DO', name: 'République dominicaine', flag: '🇩🇴', dialCode: '+1' },
    { code: 'JM', name: 'Jamaïque', flag: '🇯🇲', dialCode: '+1' },
    { code: 'HT', name: 'Haïti', flag: '🇭🇹', dialCode: '+509' },
    { code: 'CU', name: 'Cuba', flag: '🇨🇺', dialCode: '+53' },
    { code: 'BB', name: 'Barbade', flag: '🇧🇧', dialCode: '+1' },
    { code: 'TT', name: 'Trinité-et-Tobago', flag: '🇹🇹', dialCode: '+1' },
    { code: 'GD', name: 'Grenade', flag: '🇬🇩', dialCode: '+1' },
    { code: 'LC', name: 'Sainte-Lucie', flag: '🇱🇨', dialCode: '+1' },
    { code: 'VC', name: 'Saint-Vincent-et-les-Grenadines', flag: '🇻🇨', dialCode: '+1' },
    { code: 'AG', name: 'Antigua-et-Barbuda', flag: '🇦🇬', dialCode: '+1' },
    { code: 'KN', name: 'Saint-Kitts-et-Nevis', flag: '🇰🇳', dialCode: '+1' },
    { code: 'DM', name: 'Dominique', flag: '🇩🇲', dialCode: '+1' },
    { code: 'BZ', name: 'Belize', flag: '🇧🇿', dialCode: '+501' },
    { code: 'GT', name: 'Guatemala', flag: '🇬🇹', dialCode: '+502' },
    { code: 'SV', name: 'El Salvador', flag: '🇸🇻', dialCode: '+503' },
    { code: 'HN', name: 'Honduras', flag: '🇭🇳', dialCode: '+504' },
    { code: 'NI', name: 'Nicaragua', flag: '🇳🇮', dialCode: '+505' },
    { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', dialCode: '+506' },
    { code: 'PA', name: 'Panama', flag: '🇵🇦', dialCode: '+507' },
    { code: 'MA', name: 'Maroc', flag: '🇲🇦', dialCode: '+212' },
    { code: 'DZ', name: 'Algérie', flag: '🇩🇿', dialCode: '+213' },
    { code: 'TN', name: 'Tunisie', flag: '🇹🇳', dialCode: '+216' },
    { code: 'LY', name: 'Libye', flag: '🇱🇾', dialCode: '+218' },
    { code: 'EG', name: 'Égypte', flag: '🇪🇬', dialCode: '+20' },
    { code: 'SD', name: 'Soudan', flag: '🇸🇩', dialCode: '+249' },
    { code: 'SS', name: 'Soudan du Sud', flag: '🇸🇸', dialCode: '+211' },
    { code: 'ET', name: 'Éthiopie', flag: '🇪🇹', dialCode: '+251' },
    { code: 'ER', name: 'Érythrée', flag: '🇪🇷', dialCode: '+291' },
    { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', dialCode: '+253' },
    { code: 'SO', name: 'Somalie', flag: '🇸🇴', dialCode: '+252' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254' },
    { code: 'TZ', name: 'Tanzanie', flag: '🇹🇿', dialCode: '+255' },
    { code: 'UG', name: 'Ouganda', flag: '🇺🇬', dialCode: '+256' },
    { code: 'RW', name: 'Rwanda', flag: '🇷🇼', dialCode: '+250' },
    { code: 'BI', name: 'Burundi', flag: '🇧🇮', dialCode: '+257' },
    { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', dialCode: '+258' },
    { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', dialCode: '+263' },
    { code: 'ZM', name: 'Zambie', flag: '🇿🇲', dialCode: '+260' },
    { code: 'MW', name: 'Malawi', flag: '🇲🇼', dialCode: '+265' },
    { code: 'SZ', name: 'Eswatini', flag: '🇸🇿', dialCode: '+268' },
    { code: 'LS', name: 'Lesotho', flag: '🇱🇸', dialCode: '+266' },
    { code: 'BW', name: 'Botswana', flag: '🇧🇼', dialCode: '+267' },
    { code: 'NA', name: 'Namibie', flag: '🇳🇦', dialCode: '+264' },
    { code: 'ZA', name: 'Afrique du Sud', flag: '🇿🇦', dialCode: '+27' },
    { code: 'MG', name: 'Madagascar', flag: '🇲🇬', dialCode: '+261' },
    { code: 'MU', name: 'Maurice', flag: '🇲🇺', dialCode: '+230' },
    { code: 'SC', name: 'Seychelles', flag: '🇸🇨', dialCode: '+248' },
    { code: 'KM', name: 'Comores', flag: '🇰🇲', dialCode: '+269' },
    { code: 'YT', name: 'Mayotte', flag: '🇾🇹', dialCode: '+262' },
    { code: 'RE', name: 'La Réunion', flag: '🇷🇪', dialCode: '+262' },
    { code: 'ST', name: 'Sao Tomé-et-Principe', flag: '🇸🇹', dialCode: '+239' },
    { code: 'CV', name: 'Cap-Vert', flag: '🇨🇻', dialCode: '+238' },
    { code: 'GW', name: 'Guinée-Bissau', flag: '🇬🇼', dialCode: '+245' },
    { code: 'GN', name: 'Guinée', flag: '🇬🇳', dialCode: '+224' },
    { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱', dialCode: '+232' },
    { code: 'LR', name: 'Libéria', flag: '🇱🇷', dialCode: '+231' },
    { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', dialCode: '+225' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233' },
    { code: 'TG', name: 'Togo', flag: '🇹🇬', dialCode: '+228' },
    { code: 'BJ', name: 'Bénin', flag: '🇧🇯', dialCode: '+229' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234' },
    { code: 'CM', name: 'Cameroun', flag: '🇨🇲', dialCode: '+237' },
    { code: 'TD', name: 'Tchad', flag: '🇹🇩', dialCode: '+235' },
    { code: 'CF', name: 'République centrafricaine', flag: '🇨🇫', dialCode: '+236' },
    { code: 'GQ', name: 'Guinée équatoriale', flag: '🇬🇶', dialCode: '+240' },
    { code: 'GA', name: 'Gabon', flag: '🇬🇦', dialCode: '+241' },
    { code: 'CG', name: 'République du Congo', flag: '🇨🇬', dialCode: '+242' },
    { code: 'CD', name: 'République démocratique du Congo', flag: '🇨🇩', dialCode: '+243' },
    { code: 'AO', name: 'Angola', flag: '🇦🇴', dialCode: '+244' },
    { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', dialCode: '+263' },
    { code: 'NA', name: 'Namibie', flag: '🇳🇦', dialCode: '+264' },
    { code: 'BW', name: 'Botswana', flag: '🇧🇼', dialCode: '+267' },
    { code: 'LS', name: 'Lesotho', flag: '🇱🇸', dialCode: '+266' },
    { code: 'SZ', name: 'Eswatini', flag: '🇸🇿', dialCode: '+268' },
    { code: 'MW', name: 'Malawi', flag: '🇲🇼', dialCode: '+265' },
    { code: 'ZM', name: 'Zambie', flag: '🇿🇲', dialCode: '+260' },
    { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', dialCode: '+263' },
    { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', dialCode: '+258' },
    { code: 'BI', name: 'Burundi', flag: '🇧🇮', dialCode: '+257' },
    { code: 'RW', name: 'Rwanda', flag: '🇷🇼', dialCode: '+250' },
    { code: 'UG', name: 'Ouganda', flag: '🇺🇬', dialCode: '+256' },
    { code: 'TZ', name: 'Tanzanie', flag: '🇹🇿', dialCode: '+255' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254' },
    { code: 'SO', name: 'Somalie', flag: '🇸🇴', dialCode: '+252' },
    { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', dialCode: '+253' },
    { code: 'ER', name: 'Érythrée', flag: '🇪🇷', dialCode: '+291' },
    { code: 'ET', name: 'Éthiopie', flag: '🇪🇹', dialCode: '+251' },
    { code: 'SS', name: 'Soudan du Sud', flag: '🇸🇸', dialCode: '+211' },
    { code: 'SD', name: 'Soudan', flag: '🇸🇩', dialCode: '+249' },
    { code: 'EG', name: 'Égypte', flag: '🇪🇬', dialCode: '+20' },
    { code: 'LY', name: 'Libye', flag: '🇱🇾', dialCode: '+218' },
    { code: 'TN', name: 'Tunisie', flag: '🇹🇳', dialCode: '+216' },
    { code: 'DZ', name: 'Algérie', flag: '🇩🇿', dialCode: '+213' },
    { code: 'MA', name: 'Maroc', flag: '🇲🇦', dialCode: '+212' },
    { code: 'PA', name: 'Panama', flag: '🇵🇦', dialCode: '+507' },
    { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', dialCode: '+506' },
    { code: 'NI', name: 'Nicaragua', flag: '🇳🇮', dialCode: '+505' },
    { code: 'HN', name: 'Honduras', flag: '🇭🇳', dialCode: '+504' },
    { code: 'SV', name: 'El Salvador', flag: '🇸🇻', dialCode: '+503' },
    { code: 'GT', name: 'Guatemala', flag: '🇬🇹', dialCode: '+502' },
    { code: 'BZ', name: 'Belize', flag: '🇧🇿', dialCode: '+501' },
    { code: 'DM', name: 'Dominique', flag: '🇩🇲', dialCode: '+1' },
    { code: 'KN', name: 'Saint-Kitts-et-Nevis', flag: '🇰🇳', dialCode: '+1' },
    { code: 'AG', name: 'Antigua-et-Barbuda', flag: '🇦🇬', dialCode: '+1' },
    { code: 'VC', name: 'Saint-Vincent-et-les-Grenadines', flag: '🇻🇨', dialCode: '+1' },
    { code: 'LC', name: 'Sainte-Lucie', flag: '🇱🇨', dialCode: '+1' },
    { code: 'GD', name: 'Grenade', flag: '🇬🇩', dialCode: '+1' },
    { code: 'TT', name: 'Trinité-et-Tobago', flag: '🇹🇹', dialCode: '+1' },
    { code: 'BB', name: 'Barbade', flag: '🇧🇧', dialCode: '+1' },
    { code: 'CU', name: 'Cuba', flag: '🇨🇺', dialCode: '+53' },
    { code: 'HT', name: 'Haïti', flag: '🇭🇹', dialCode: '+509' },
    { code: 'JM', name: 'Jamaïque', flag: '🇯🇲', dialCode: '+1' },
    { code: 'DO', name: 'République dominicaine', flag: '🇩🇴', dialCode: '+1' },
    { code: 'VI', name: 'Îles Vierges américaines', flag: '🇻🇮', dialCode: '+1' },
    { code: 'PR', name: 'Porto Rico', flag: '🇵🇷', dialCode: '+1' },
    { code: 'AS', name: 'Samoa américaines', flag: '🇦🇸', dialCode: '+1' },
    { code: 'MP', name: 'Îles Mariannes du Nord', flag: '🇲🇵', dialCode: '+1' },
    { code: 'GU', name: 'Guam', flag: '🇬🇺', dialCode: '+1' },
    { code: 'FM', name: 'Micronésie', flag: '🇫🇲', dialCode: '+691' },
    { code: 'MH', name: 'Îles Marshall', flag: '🇲🇭', dialCode: '+692' },
    { code: 'PW', name: 'Palaos', flag: '🇵🇼', dialCode: '+680' },
    { code: 'NR', name: 'Nauru', flag: '🇳🇷', dialCode: '+674' },
    { code: 'TV', name: 'Tuvalu', flag: '🇹🇻', dialCode: '+688' },
    { code: 'KI', name: 'Kiribati', flag: '🇰🇮', dialCode: '+686' },
    { code: 'WS', name: 'Samoa', flag: '🇼🇸', dialCode: '+685' },
    { code: 'TO', name: 'Tonga', flag: '🇹🇴', dialCode: '+676' },
    { code: 'WF', name: 'Wallis-et-Futuna', flag: '🇼🇫', dialCode: '+681' },
    { code: 'PF', name: 'Polynésie française', flag: '🇵🇫', dialCode: '+689' },
    { code: 'NC', name: 'Nouvelle-Calédonie', flag: '🇳🇨', dialCode: '+687' },
    { code: 'VU', name: 'Vanuatu', flag: '🇻🇺', dialCode: '+678' },
    { code: 'SB', name: 'Îles Salomon', flag: '🇸🇧', dialCode: '+677' },
    { code: 'PG', name: 'Papouasie-Nouvelle-Guinée', flag: '🇵🇬', dialCode: '+675' },
    { code: 'FJ', name: 'Fidji', flag: '🇫🇯', dialCode: '+679' },
    { code: 'NZ', name: 'Nouvelle-Zélande', flag: '🇳🇿', dialCode: '+64' },
    { code: 'KP', name: 'Corée du Nord', flag: '🇰🇵', dialCode: '+850' },
    { code: 'MN', name: 'Mongolie', flag: '🇲🇳', dialCode: '+976' },
    { code: 'CN', name: 'Chine', flag: '🇨🇳', dialCode: '+86' },
    { code: 'MO', name: 'Macao', flag: '🇲🇴', dialCode: '+853' },
    { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', dialCode: '+852' },
    { code: 'TW', name: 'Taïwan', flag: '🇹🇼', dialCode: '+886' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63' },
    { code: 'ID', name: 'Indonésie', flag: '🇮🇩', dialCode: '+62' },
    { code: 'SG', name: 'Singapour', flag: '🇸🇬', dialCode: '+65' },
    { code: 'MY', name: 'Malaisie', flag: '🇲🇾', dialCode: '+60' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84' },
    { code: 'KH', name: 'Cambodge', flag: '🇰🇭', dialCode: '+855' },
    { code: 'LA', name: 'Laos', flag: '🇱🇦', dialCode: '+856' },
    { code: 'TH', name: 'Thaïlande', flag: '🇹🇭', dialCode: '+66' },
    { code: 'MM', name: 'Myanmar', flag: '🇲🇲', dialCode: '+95' },
    { code: 'MV', name: 'Maldives', flag: '🇲🇻', dialCode: '+960' },
    { code: 'BT', name: 'Bhoutan', flag: '🇧🇹', dialCode: '+975' },
    { code: 'NP', name: 'Népal', flag: '🇳🇵', dialCode: '+977' },
    { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', dialCode: '+94' },
    { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', dialCode: '+880' },
    { code: 'IN', name: 'Inde', flag: '🇮🇳', dialCode: '+91' },
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92' },
    { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', dialCode: '+93' },
    { code: 'TM', name: 'Turkménistan', flag: '🇹🇲', dialCode: '+993' },
    { code: 'TJ', name: 'Tadjikistan', flag: '🇹🇯', dialCode: '+992' },
    { code: 'KG', name: 'Kirghizistan', flag: '🇰🇬', dialCode: '+996' },
    { code: 'UZ', name: 'Ouzbékistan', flag: '🇺🇿', dialCode: '+998' },
    { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', dialCode: '+7' },
    { code: 'AZ', name: 'Azerbaïdjan', flag: '🇦🇿', dialCode: '+994' },
    { code: 'AM', name: 'Arménie', flag: '🇦🇲', dialCode: '+374' },
    { code: 'GE', name: 'Géorgie', flag: '🇬🇪', dialCode: '+995' },
    { code: 'MD', name: 'Moldavie', flag: '🇲🇩', dialCode: '+373' },
    { code: 'BY', name: 'Biélorussie', flag: '🇧🇾', dialCode: '+375' },
    { code: 'UA', name: 'Ukraine', flag: '🇺🇦', dialCode: '+380' },
    { code: 'RU', name: 'Russie', flag: '🇷🇺', dialCode: '+7' },
    { code: 'CY', name: 'Chypre', flag: '🇨🇾', dialCode: '+357' },
    { code: 'MT', name: 'Malte', flag: '🇲🇹', dialCode: '+356' },
    { code: 'IS', name: 'Islande', flag: '🇮🇸', dialCode: '+354' },
    { code: 'IE', name: 'Irlande', flag: '🇮🇪', dialCode: '+353' },
    { code: 'EE', name: 'Estonie', flag: '🇪🇪', dialCode: '+372' },
    { code: 'LV', name: 'Lettonie', flag: '🇱🇻', dialCode: '+371' },
    { code: 'LT', name: 'Lituanie', flag: '🇱🇹', dialCode: '+370' },
    { code: 'SK', name: 'Slovaquie', flag: '🇸🇰', dialCode: '+421' },
    { code: 'SI', name: 'Slovénie', flag: '🇸🇮', dialCode: '+386' },
    { code: 'HR', name: 'Croatie', flag: '🇭🇷', dialCode: '+385' },
    { code: 'BG', name: 'Bulgarie', flag: '🇧🇬', dialCode: '+359' },
    { code: 'RO', name: 'Roumanie', flag: '🇷🇴', dialCode: '+40' },
    { code: 'HU', name: 'Hongrie', flag: '🇭🇺', dialCode: '+36' },
    { code: 'CZ', name: 'République tchèque', flag: '🇨🇿', dialCode: '+420' },
    { code: 'PL', name: 'Pologne', flag: '🇵🇱', dialCode: '+48' },
    { code: 'FI', name: 'Finlande', flag: '🇫🇮', dialCode: '+358' },
    { code: 'DK', name: 'Danemark', flag: '🇩🇰', dialCode: '+45' },
    { code: 'NO', name: 'Norvège', flag: '🇳🇴', dialCode: '+47' },
    { code: 'SE', name: 'Suède', flag: '🇸🇪', dialCode: '+46' },
    { code: 'GR', name: 'Grèce', flag: '🇬🇷', dialCode: '+30' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351' },
    { code: 'AT', name: 'Autriche', flag: '🇦🇹', dialCode: '+43' },
    { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', dialCode: '+352' },
    { code: 'MC', name: 'Monaco', flag: '🇲🇨', dialCode: '+377' },
    { code: 'GF', name: 'Guyane française', flag: '🇬🇫', dialCode: '+594' },
    { code: 'SR', name: 'Suriname', flag: '🇸🇷', dialCode: '+597' },
    { code: 'GY', name: 'Guyane', flag: '🇬🇾', dialCode: '+592' },
    { code: 'EC', name: 'Équateur', flag: '🇪🇨', dialCode: '+593' },
    { code: 'BO', name: 'Bolivie', flag: '🇧🇴', dialCode: '+591' },
    { code: 'PY', name: 'Paraguay', flag: '🇵🇾', dialCode: '+595' },
    { code: 'UY', name: 'Uruguay', flag: '🇺🇾', dialCode: '+598' },
    { code: 'VE', name: 'Venezuela', flag: '🇻🇪', dialCode: '+58' },
    { code: 'PE', name: 'Pérou', flag: '🇵🇪', dialCode: '+51' },
    { code: 'CO', name: 'Colombie', flag: '🇨🇴', dialCode: '+57' },
    { code: 'CL', name: 'Chili', flag: '🇨🇱', dialCode: '+56' },
    { code: 'AR', name: 'Argentine', flag: '🇦🇷', dialCode: '+54' },
    { code: 'MX', name: 'Mexique', flag: '🇲🇽', dialCode: '+52' },
    { code: 'BR', name: 'Brésil', flag: '🇧🇷', dialCode: '+55' },
    { code: 'KR', name: 'Corée du Sud', flag: '🇰🇷', dialCode: '+82' },
    { code: 'JP', name: 'Japon', flag: '🇯🇵', dialCode: '+81' },
    { code: 'AU', name: 'Australie', flag: '🇦🇺', dialCode: '+61' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31' },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41' },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪', dialCode: '+32' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
    { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
    { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
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
        Alert.alert('Success', 'Profile updated successfully!');
        // Reload user data if needed
        // You could add a callback to refresh the data
      } else {
        Alert.alert('Error', result.error || 'Unable to update profile');
      }
    } catch (error) {
      console.error('Error during save:', error);
      Alert.alert('Error', 'An error occurred during save');
    } finally {
      setIsSaving(false);
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
            style={[styles.textInput, styles.phoneInput]}
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
              <Ionicons name="checkmark" size={24} color="#FFFFFF" />
            )}
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );



  const renderSecuritySection = () => (
    <View>
      <View style={styles.securityItem}>
        <View style={styles.securityInfo}>
          <Ionicons name="lock-closed" size={30} color="#4a5cf9" />
          <View style={styles.securityDetails}>
            <Text style={styles.securityName}>Password</Text>
            <Text style={styles.securityDescription}>Change your password</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="pencil" size={24} color="#FFFFFF" style={{marginLeft: -8}} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>


    </View>
  );







  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <LinearGradient
              colors={['#ffffff', '#ffffff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.headerTitleGradient}
            >
              <View style={styles.headerTitleContent}>
                <Text style={styles.headerTitle}>Profile</Text>
                <Text style={styles.headerDescription}>Manage your account settings and personal information.</Text>
              </View>
            </LinearGradient>
          </View>
        </View>
        
        <View style={styles.mainCard}>
          <View style={styles.tableHeader}>
            <View style={styles.titleContainer}>
              <View style={styles.titleWithIcon}>
                <Text style={styles.tableTitle}>Personal Information</Text>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="person" size={24} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </View>
          {renderGeneralSection()}
        </View>
        
        <View style={styles.sectionSpacer} />
        
        <View style={styles.mainCard}>
          <View style={styles.tableHeader}>
            <View style={styles.titleContainer}>
              <View style={styles.titleWithIcon}>
                <Text style={styles.tableTitle}>Security & Privacy</Text>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </View>
          {renderSecuritySection()}
        </View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.spacing.xl,
    paddingBottom: 50,
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
  mainCard: {
    backgroundColor: '#1A1A1E',
    marginBottom: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
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
    fontSize: 28,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionSpacer: {
    height: 24,
    backgroundColor: COLORS.card,
  },
  bottomSpacer: {
    height: 24,
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
    marginBottom: 24,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  inputLabel: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 20,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#1A1A1E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 12,
    backgroundColor: '#1A1A1E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  countryPickerContainer: {
    borderRightWidth: 1,
    borderRightColor: '#333',
    minWidth: 120,
  },
  countryPicker: {
    color: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  phoneInput: {
    flex: 1,
    marginLeft: 0,
  },
  saveButtonContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
    marginTop: 8,
  },
  saveButton: {
    borderRadius: 12,
    shadowColor: '#E65100',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 24,
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
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#B5B5B5',
    marginTop: 6,
    fontStyle: 'italic',
    paddingHorizontal: 4,
    opacity: 0.6,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    marginBottom: 8,
    marginLeft: 20,
  },

  securityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  securityDetails: {
    marginLeft: 16,
    flex: 1,
  },
  securityName: {
    fontSize: 28,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  securityDescription: {
    fontSize: 20,
    fontFamily: FONTS.regular,
    color: '#B5B5B5',
  },
  actionButton: {
    backgroundColor: '#4a5cf9',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 8,
    shadowColor: '#4a5cf9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 24,
    fontFamily: FONTS.medium,
    fontWeight: '600',
    color: '#FFFFFF',
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
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: '#FFFFFF',
  },

});

export default ProfileScreen; 