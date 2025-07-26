import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants';
import { User, Campaign } from '../types';
import campaignService from '../services/campaignService';

interface AvailableMissionsScreenProps {
  user: User;
  navigation?: any;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSignOut?: () => void;
  onMissionSelect?: (mission: Campaign) => void;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  streamerName: string;
  streamerAvatar?: string;
  reward: number;
  minViews: number;
  status: 'active' | 'completed' | 'expired';
  createdAt: string;
  deadline?: string;
}

const AvailableMissionsScreen: React.FC<AvailableMissionsScreenProps> = ({ 
  user, 
  navigation,
  onMissionSelect
}) => {
  const [missions, setAvailableMissions] = useState<Campaign[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [numColumns, setNumColumns] = useState(3);

  useEffect(() => {
    loadAvailableMissions();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = Dimensions.get('window').width;
      let newColumns = 3;
      if (width < 1600) {
        newColumns = 1;
      } else if (width < 2200) {
        newColumns = 2;
      } else {
        newColumns = 3;
      }
      if (newColumns !== numColumns) {
        setNumColumns(newColumns);
      }
    };
    handleResize();
    const subscription = Dimensions.addEventListener('change', handleResize);
    return () => subscription?.remove();
  }, [numColumns]);

  const loadAvailableMissions = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading available missions...');
      
      // Retrieve all active campaigns from database
      const campaigns = await campaignService.getCampaigns();
      console.log('🔍 Available Missions retrieved:', campaigns.length);
      
      // Add test data to see the design
      const mockCampaigns: Campaign[] = [
        {
          id: 'mock-1',
          streamerId: 'KaiCenat',
          streamerName: 'KaiCenat',
          streamerAvatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/bf6a04cf-3f44-4986-8eed-5c36bfad542b-profile_image-300x300.png',
          streamerFollowers: 18800000,
          title: 'Epic moment clip',
          description: 'Create a clip of a particularly epic moment from my stream',
          imageUrl: 'https://images2.minutemediacdn.com/image/upload/c_crop,w_1582,h_889,x_0,y_0/c_fill,w_720,ar_16:9,f_auto,q_auto,g_auto/images/voltaxMediaLibrary/mmsport/esports_illustrated/01jdbws64a94v3b70kff.jpg',
          criteria: { hashtags: ['#epic', '#gaming'], style: 'dramatic', duration: 30, minViews: 10000 },
          budget: 50000,
          cpm: 30,
          fanPageCpm: null,
          status: 'active',
          createdAt: new Date('2024-01-15'),
          totalViews: 50000000,
          totalSpent: 15000,
        },
        {
          id: 'mock-2',
          streamerId: '2xRaKai',
          streamerName: '2xRaKai',
          streamerAvatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/b5d43658-37ed-4481-907d-3b6939bd0825-profile_image-300x300.png',
          streamerFollowers: 1600000,
          title: 'Best stream fail',
          description: 'Capture the best fail from the session',
          imageUrl: 'https://static-cdn.jtvnw.net/twitch-clips-thumbnails-prod/PricklyThirstyDootWOOP-CZE0vqAc6zCQVh1N/bfecfd63-8b78-471e-b9d8-6672bc12ed79/preview.jpg',
          criteria: { hashtags: ['#fail', '#funny'], style: 'humorous', duration: 20, minViews: 8000 },
          budget: 10000,
          cpm: 20,
          fanPageCpm: null,
          status: 'active',
          createdAt: new Date('2024-01-16'),
          totalViews: 10000000,
          totalSpent: 2000,
        },
        {
          id: 'mock-3',
          streamerId: 'Duke',
          streamerName: 'Duke',
          streamerAvatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/18255aea-40af-4381-9054-47b6c358e1a7-profile_image-300x300.png',
          streamerFollowers: 3200000,
          title: 'Funny moment with chat',
          description: 'A funny interaction moment with the chat',
          imageUrl: 'https://static-cdn.jtvnw.net/twitch-clips-thumbnails-prod/WrongFlaccidCroissantSeemsGood-SX6sefN5wiEw4SDF/dd72cf89-1152-4cca-beef-b74cff85d0be/preview.jpg',
          criteria: { hashtags: ['#chat', '#funny'], style: 'interactive', duration: 25, minViews: 12000 },
          budget: 30000,
          cpm: 25,
          fanPageCpm: null,
          status: 'active',
          createdAt: new Date('2024-01-17'),
          totalViews: 20000000,
          totalSpent: 5000,
        },
        {
          id: 'mock-4',
          streamerId: 'Anyme023',
          streamerName: 'Anyme023',
          streamerAvatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/17ef7a09-3473-4ff8-85ca-e6648d392116-profile_image-300x300.png',
          streamerFollowers: 1900000,
          title: 'My screen time is scary',
          description: 'Create a clip of my scariest moments',
          imageUrl: 'https://worldofgeek.fr/wp-content/uploads/2025/07/anyme-stream-1200x594.png',
          criteria: { hashtags: ['#scary', '#gaming'], style: 'thrilling', duration: 35, minViews: 15000 },
          budget: 600,
          cpm: 35,
          fanPageCpm: null,
          status: 'active',
          createdAt: new Date('2024-01-18'),
          totalViews: 0,
          totalSpent: 0,
        },
        {
          id: 'mock-5',
          streamerId: 'Squeezie',
          streamerName: 'Squeezie',
          streamerAvatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/1939615e-a34d-4fab-a035-8c3d8ffae278-profile_image-300x300.png',
          streamerFollowers: 5400000,
          title: 'ÉPISODE 1: DAWALA, ADJINAYA',
          description: 'The best moments from episode 1 with our guests',
          imageUrl: 'https://img.nrj.fr/HbiLITTGW-dmBAbVxnVDEchx-Kc=/0x415/smart/medias%2F2025%2F06%2Fyhf-o22uzs7cqgcvm-wbar-th-7s9b05nh8g1bt7jjk_683ec91347e9e.jpg',
          criteria: { hashtags: ['#qmsm', '#episode1'], style: 'show', duration: 40, minViews: 20000 },
          budget: 800,
          cpm: 40,
          fanPageCpm: null,
          status: 'active',
          createdAt: new Date('2024-01-19'),
          totalViews: 0,
          totalSpent: 0,
        },
        {
          id: 'mock-6',
          streamerId: 'DDG',
          streamerName: 'DDG',
          streamerAvatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/01d55c0b-9cfc-4a3d-a622-1bc2b3300f5e-profile_image-300x300.png',
          streamerFollowers: 1900000,
          title: 'WE DRIVE STRANGERS CRAZY ON THE PHONE',
          description: 'The best moments from our phone calls',
          imageUrl: 'https://picsum.photos/400/300?random=6',
          criteria: { hashtags: ['#phone', '#prank'], style: 'prank', duration: 30, minViews: 18000 },
          budget: 450000,
          cpm: 28,
          fanPageCpm: null,
          status: 'active',
          createdAt: new Date('2024-01-20'),
          totalViews: 0,
          totalSpent: 0,
        },
        {
          id: 'mock-7',
          streamerId: 'Fanum',
          streamerName: 'Fanum',
          streamerAvatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/730415ce-12c3-455f-8218-dfff65238c5b-profile_image-300x300.png',
          streamerFollowers: 3300000,
          title: 'j\'ai la plus grande CHAINE ASMR',
          description: 'The most relaxing moments from my ASMR sessions',
          imageUrl: 'https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/90b722af12ee1af91de6_fanum_324308694140_1752456104//thumb/thumb0-276x155.jpg',
          criteria: { hashtags: ['#asmr', '#relax'], style: 'calm', duration: 45, minViews: 10000 },
          budget: 35000,
          cpm: 22,
          fanPageCpm: null,
          status: 'active',
          createdAt: new Date('2024-01-21'),
          totalViews: 0,
          totalSpent: 0,
        },
        {
          id: 'mock-8',
          streamerId: 'JLTOMY',
          streamerName: 'JLTOMY',
          streamerAvatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/aa2bc80a-e317-494a-a94d-7492889e4f66-profile_image-300x300.png',
          streamerFollowers: 1300000,
          title: 'Unlikely victory',
          description: 'Capture my most unlikely victories',
          imageUrl: 'https://static-cdn.jtvnw.net/cf_vods/d1m7jfoe9zdc1j/f3f30729440b5ab1318c_jltomy_329577544317_1753126344//thumb/thumb0-276x155.jpg',
          criteria: { hashtags: ['#victory', '#gaming'], style: 'epic', duration: 25, minViews: 25000 },
          budget: 700,
          cpm: 45,
          fanPageCpm: null,
          status: 'active',
          createdAt: new Date('2024-01-22'),
          totalViews: 0,
          totalSpent: 0,
        },
        {
          id: 'mock-9',
          streamerId: 'mock-streamer-9',
          streamerName: 'ComedyKing',
          streamerAvatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/comedyking-profile_image-9i0j1k2l-300x300.png',
          streamerFollowers: 110000,
          title: 'Killer jokes',
          description: 'My best jokes and comebacks',
          imageUrl: 'https://picsum.photos/400/300?random=9',
          criteria: { hashtags: ['#comedy', '#funny'], style: 'humorous', duration: 20, minViews: 12000 },
          budget: 400,
          cpm: 26,
          fanPageCpm: null,
          status: 'active',
          createdAt: new Date('2024-01-23'),
          totalViews: 0,
          totalSpent: 0,
        },
        {
          id: 'mock-10',
          streamerId: 'mock-streamer-10',
          streamerName: 'TechGuru',
          streamerAvatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/techguru-profile_image-0j1k2l3m-300x300.png',
          streamerFollowers: 85000,
          title: 'Crazy product review',
          description: 'My wildest tech product reviews',
          imageUrl: 'https://picsum.photos/400/300?random=10',
          criteria: { hashtags: ['#tech', '#review'], style: 'review', duration: 35, minViews: 15000 },
          budget: 500,
          cpm: 32,
          fanPageCpm: null,
          status: 'active',
          createdAt: new Date('2024-01-24'),
          totalViews: 0,
          totalSpent: 0,
        },
        {
          id: 'mock-11',
          streamerId: 'mock-streamer-11',
          streamerName: 'MusicMaker',
          streamerAvatar: 'https://static-cdn.jtvnw.net/jtv_user_pictures/musicmaker-profile_image-1k2l3m4n-300x300.png',
          streamerFollowers: 95000,
          title: 'Live music creation',
          description: 'My best music creation moments',
          imageUrl: 'https://picsum.photos/400/300?random=11',
          criteria: { hashtags: ['#music', '#creation'], style: 'creative', duration: 50, minViews: 8000 },
          budget: 300,
          cpm: 18,
          fanPageCpm: null,
          status: 'active',
          createdAt: new Date('2024-01-25'),
          totalViews: 0,
          totalSpent: 0,
        },
      ];
      
      // Combine real campaigns with test data
      const allCampaigns = [...campaigns, ...mockCampaigns];
      console.log('🔍 Total missions (real + test):', allCampaigns.length);
      
      setAvailableMissions(allCampaigns);
    } catch (error) {
      console.error('Error loading missions:', error);
      Alert.alert('Error', 'Unable to load available missions');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAvailableMissions();
    setRefreshing(false);
  };

  const handleAcceptMission = (campaignId: string) => {
    Alert.alert(
      'Mission acceptée',
      'You have accepted this mission. You can now create clips for this campaign.',
      [{ text: 'OK' }]
    );
  };

  const handleOpenMissionDetails = (campaign: Campaign) => {
    if (onMissionSelect) {
      onMissionSelect(campaign);
    } else {
      navigation?.navigate('MissionDetail', { campaign });
    }
  };

  const handleCloseMissionDetails = () => {
    // No-op, as modal is removed
  };

  const handleSubmitClip = () => {
    Alert.alert(
      'Soumettre un clip',
      'Fonctionnalité de soumission de clip à implémenter',
      [{ text: 'OK' }]
    );
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const getCardWidth = () => {
    if (numColumns === 1) return '100%'; // 1 colonne : pleine largeur
    if (numColumns === 2) return '48%'; // 2 colonnes : 48% pour laisser de l'espace
    return '31%'; // 3 colonnes : 31% pour laisser de l'espace
  };

  const getNameMaxWidth = () => {
    if (numColumns === 1) return 600;
    if (numColumns === 2) return 300;
    return 180;
  };

  const getCardPaddingHorizontal = () => {
    if (numColumns === 1) return 32;
    if (numColumns === 2) return 28;
    return 24;
  };

  const getCardMaxWidth = () => {
    if (numColumns === 1) return 600;
    return 'none';
  };

  const renderMissionCard = (campaign: Campaign) => (
    <TouchableOpacity 
      key={campaign.id} 
      style={[
        styles.missionCard,
        {
          width: getCardWidth(),
          ...(typeof getCardMaxWidth() === 'number' ? { maxWidth: getCardMaxWidth() } : {}),
          paddingHorizontal: getCardPaddingHorizontal(),
          alignSelf: numColumns === 1 ? 'center' : 'stretch',
        }
      ]}
      onPress={() => {
        handleOpenMissionDetails(campaign);
      }}
      activeOpacity={0.8}
    >
      {/* Header with avatar à gauche, nom+badge+followers au centre, prix bleu à droite aligné avec l'avatar */}
      <View style={styles.cardHeaderTwitchLike}>
        {/* Avatar on the left */}
        {campaign.streamerAvatar ? (
          <Image 
            source={{ uri: campaign.streamerAvatar }} 
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={20} color={COLORS.primarySolid} />
          </View>
        )}
        {/* Block nom+badge+followers au centre */}
        <View style={styles.centerNameFollowersBlockk}>
          <View style={styles.nameAndBadgeContainerRefactored}>
            <Text
              style={[styles.streamerName, { maxWidth: getNameMaxWidth() }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {campaign.streamerName}
            </Text>
            <Image 
              source={require('../../assets/twitch-badge.png')} 
              style={styles.twitchBadge}
            />
          </View>
          <Text style={styles.streamerFollowersRefactored}>
            {campaign.streamerFollowers ? `${(campaign.streamerFollowers / 1000000).toFixed(1)}M followers` : 'Followers'}
          </Text>
        </View>
        {/* Price gradient bleu moderne à droite, aligné avec l'avatar */}
        <LinearGradient
          colors={['#4a5cf9', '#3c82f6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.priceContainerRefactored}
        >
          <Text style={[styles.priceText, { color: '#FFFFFF' }]}>${(campaign.cpm / 10).toFixed(2)} / 1K</Text>
        </LinearGradient>
      </View>

      {/* Mission thumbnail */}
      <View style={styles.thumbnailContainer}>
        <View style={styles.thumbnail}>
          {campaign.imageUrl ? (
            <Image 
              source={{ uri: campaign.imageUrl }} 
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Ionicons name="videocam" size={40} color="#999" />
              <Text style={styles.thumbnailText}>youtu.be</Text>
            </View>
          )}
        </View>
      </View>

      {/* Budget et progression */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.budgetText}>
            ${(campaign.totalSpent || 0).toFixed(2)} of ${campaign.budget.toFixed(2)}
          </Text>
          <Text style={styles.progressPercentage}>
            {Math.round((campaign.totalSpent || 0) / campaign.budget * 100)}%
          </Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressBar, { width: `${Math.min((campaign.totalSpent || 0) / campaign.budget * 100, 100)}%` }]} />
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Min view / video</Text>
            <Text style={styles.statValue}>{formatViews(campaign.minViewsPerVideo || 10000)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Views</Text>
            <Text style={styles.statValue}>{formatViews(campaign.totalViews || 0)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.participateButton}
            onPress={(e) => {
              e.stopPropagation();
              handleOpenMissionDetails(campaign);
            }}
          >
            <LinearGradient
              colors={['#ffffff', '#ffffff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.participateGradient}
            >
              <View style={styles.participateButtonContent}>
                <Image 
                  source={require('../../assets/twitch-logo.jpg')} 
                  style={styles.twitchLogoButton}
                />
                <Text style={[styles.participateText, { color: '#363636' }]}>Add a clip</Text>
                <Ionicons name="add" size={45} color="#363636" style={{ marginLeft: 10 }} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="refresh" size={40} color={COLORS.primarySolid} />
        <Text style={styles.loadingText}>Loading missions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <LinearGradient
              colors={['#ffffff', '#ffffff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.titleGradient}
            >
                             <View style={styles.titleContent}>
                 <Text style={styles.title}>Find missions. Clip. Earn.</Text>
                 <Text style={styles.description}>Post Twitch clips on TikTok and earn money for the views you make.</Text>
               </View>
            </LinearGradient>
          </View>
        </View>

        {missions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={80} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No missions available</Text>
            <Text style={styles.emptyText}>
              There are currently no active campaigns. Streamers haven't created missions yet.
            </Text>
          </View>
        ) : (
          <View style={[
            styles.missionsList,
            {
              justifyContent: numColumns === 1 ? 'center' : 'space-between',
              gap: numColumns === 1 ? 20 : 16,
            }
          ]}>
            {missions.map(renderMissionCard)}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.spacing.xl,
    paddingBottom: 50,
  },
  header: {
    marginBottom: SIZES.spacing.xl,
  },
  title: {
    fontSize: 40,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#363636',
    textAlign: 'center',
    lineHeight: 36,
  },
  titleContainer: {
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
  titleGradient: {
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderBottomWidth: 3,
    borderBottomColor: '#d0d0d0',
  },
  titleContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 24,
    fontFamily: FONTS.regular,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 20,
    flexShrink: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 24,
    color: '#6b7280',
    fontFamily: FONTS.medium,
    marginTop: SIZES.spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: 32,
    color: '#111827',
    fontFamily: FONTS.bold,
    marginTop: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.sm,
  },
  emptyText: {
    fontSize: 22,
    color: '#6b7280',
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: SIZES.spacing.xl,
  },
  missionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 16,
    minWidth: 0,
  },
  missionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 28,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 450,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    transform: [{ translateY: -2 }],
    overflow: 'hidden',
  },
  cardHeader: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  streamerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
    overflow: 'hidden',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 100,
    marginRight: 20,
    flexShrink: 0,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
    overflow: 'hidden',
  },
  streamerTextContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  nameAndBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  streamerName: {
    fontSize: 30,
    color: '#000',
    fontFamily: FONTS.bold,
    maxWidth: 300,
    overflow: 'hidden',
    flexShrink: 1,
  },
  streamerFollowers: {
    fontSize: 24,
    color: '#6b7280',
    fontFamily: FONTS.regular,
  },
  twitchBadge: {
    width: 24,
    height: 24,
    marginLeft: 8,
  },
  priceContainer: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    minWidth: 80,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontFamily: FONTS.bold,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 0, // empêche le rétrécissement du texte
  },
  thumbnailContainer: {
    marginBottom: 16,
  },
  thumbnail: {
    width: '100%',
    height: 250,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  thumbnailText: {
    fontSize: 18,
    color: '#6b7280',
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  missionTitle: {
    fontSize: 26,
    color: '#111827',
    fontFamily: FONTS.bold,
    marginBottom: 12,
    lineHeight: 32,
  },
  missionDescription: {
    fontSize: 20,
    color: '#6b7280',
    fontFamily: FONTS.regular,
    lineHeight: 26,
    marginBottom: 20,
  },
  paymentSection: {
    marginTop: 'auto',
  },
  paymentTitle: {
    fontSize: 28,
    color: '#111827',
    fontFamily: FONTS.bold,
    marginBottom: 14,
  },
  paymentDetails: {
    gap: 10,
  },
  paymentAmount: {
    fontSize: 26,
    color: '#374151',
    fontFamily: FONTS.medium,
  },
  paymentRequirement: {
    fontSize: 22,
    color: '#6b7280',
    fontFamily: FONTS.regular,
    lineHeight: 28,
  },
  progressSection: {
    marginTop: 10,
    marginBottom: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetText: {
    fontSize: 26,
    fontFamily: FONTS.medium,
    fontWeight: 'bold',
    color: '#374151',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBackground: {
    flex: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 10,
  },
  progressPercentage: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 26,
    fontFamily: FONTS.medium,
    fontWeight: 'semibold',
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    fontWeight: 'bold',
    color: '#374151',
  },
  participateButton: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderRadius: 30,
    overflow: 'hidden',
  },
  participateGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderBottomWidth: 3,
    borderBottomColor: '#d0d0d0',
  },
  participateText: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  participateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  twitchLogoButton: {
    width: 70,
    height: 70,
    marginRight: 8,
    resizeMode: 'contain',
  },
  cardHeaderRefactored: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streamerColumn: {
    flex: 1,
    marginLeft: 20,
  },
  nameAndBadgeContainerRefactored: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  priceContainerRefactored: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignSelf: 'center',
    minWidth: 130,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streamerFollowersRefactored: {
    fontSize: 24,
    color: '#6b7280',
    fontFamily: FONTS.regular,
    alignSelf: 'flex-start',
  },
  cardHeaderKaiLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  centerNameBadge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightPriceFollowers: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 130,
  },
  cardHeaderTwitchLike: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  centerNameFollowersBlockk: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: 16,
    minWidth: 0,
  },
  rowNameAndPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 0,
    gap: 32, // beaucoup plus d'espace pour éviter tout contact
  },
});

export default AvailableMissionsScreen; 