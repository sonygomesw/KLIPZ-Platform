import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants';
import { Campaign } from '../types';

const { width, height } = Dimensions.get('window');

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    streamerName: 'KaiCenat',
    streamerAvatar: 'https://via.placeholder.com/50x50/6366F1/FFFFFF?text=K',
    streamerFollowers: 18400000,
    title: 'Gaming & Entertainment',
    description: 'Les meilleurs moments de mes streams et mes réactions les plus drôles',
    cpm: 0.03,
    budget: 2500,
    totalSpent: 1552,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    streamerId: 'streamer1',
    platform: 'twitch',
    category: 'gaming',
    requirements: 'Minimum 10K views per clip',
    tags: ['gaming', 'entertainment', 'reactions']
  },
  {
    id: '2',
    streamerName: 'Waime',
    streamerAvatar: 'https://via.placeholder.com/50x50/FF6B35/FFFFFF?text=W',
    streamerFollowers: 2500000,
    title: 'Gaming & Humour',
    description: 'Salut, moi c\'est Waime. Sur ma chaîne, je partage des moments de gaming et de divertissement.',
    cpm: 0.05,
    budget: 1500,
    totalSpent: 850,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    streamerId: 'streamer2',
    platform: 'youtube',
    category: 'gaming',
    requirements: 'Minimum 10K views per clip',
    tags: ['gaming', 'humour', 'streaming']
  },
  {
    id: '3',
    streamerName: 'QUI MISE SUR MOI ?',
    streamerAvatar: 'https://via.placeholder.com/50x50/9146FF/FFFFFF?text=Q',
    streamerFollowers: 1800000,
    title: '5 jurés, 20 000€ à gagner',
    description: 'ÉPISODE 1 - DAWALA, ADJINAYA, et nos invités spéciaux',
    cpm: 0.04,
    budget: 2000,
    totalSpent: 1200,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    streamerId: 'streamer3',
    platform: 'youtube',
    category: 'entertainment',
    requirements: 'Minimum 10K views per clip',
    tags: ['entertainment', 'reality', 'competition']
  },
  {
    id: '4',
    streamerName: 'Joyca',
    streamerAvatar: 'https://via.placeholder.com/50x50/1DA1F2/FFFFFF?text=J',
    streamerFollowers: 3200000,
    title: 'ON REND FOU DES INCONNUS',
    description: 'FILS DE CENSORED - Les meilleures réactions téléphoniques',
    cpm: 0.06,
    budget: 3000,
    totalSpent: 2100,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    streamerId: 'streamer4',
    platform: 'youtube',
    category: 'entertainment',
    requirements: 'Minimum 200K views per clip',
    tags: ['entertainment', 'pranks', 'reactions']
  },
  {
    id: '5',
    streamerName: 'SQUIDUU',
    streamerAvatar: 'https://via.placeholder.com/50x50/00D4AA/FFFFFF?text=S',
    streamerFollowers: 1500000,
    title: 'Gaming & Humour',
    description: 'Les meilleurs moments de mes streams et mes réactions les plus drôles',
    cpm: 0.035,
    budget: 1200,
    totalSpent: 750,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    streamerId: 'streamer5',
    platform: 'twitch',
    category: 'gaming',
    requirements: 'Minimum 10K views per clip',
    tags: ['gaming', 'humour', 'streaming']
  }
];

const LandingCampaignCard: React.FC<{ campaign: Campaign }> = ({ campaign }) => {
  const handleCampaignClick = () => {
    console.log('Campaign clicked:', campaign.streamerName);
    // Navigate to campaign detail page
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '$0.00';
    return `${amount.toFixed(2)}$`;
  };

  const formatFollowers = (followers: number | undefined) => {
    if (followers === undefined || followers === null) return '0';
    if (followers >= 1000000) {
      return `${(followers / 1000000).toFixed(1)}M`;
    } else if (followers >= 1000) {
      return `${(followers / 1000).toFixed(1)}K`;
    }
    return followers.toString();
  };

  const getProgressPercentage = () => {
    if (!campaign.budget || campaign.budget === 0) return 0;
    if (!campaign.totalSpent) return 0;
    return Math.min((campaign.totalSpent / campaign.budget) * 100, 100);
  };

  const formatCpm = (cpm: number | undefined) => {
    if (cpm === undefined || cpm === null) return '$0.00';
    return `${cpm.toFixed(2)}$US / 1K`;
  };

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={handleCampaignClick}>
      <LinearGradient
        colors={['#FF6B35', '#9146FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Image
              source={{
                uri: campaign.streamerAvatar || 'https://via.placeholder.com/40x40/6366F1/FFFFFF?text=S'
              }}
              style={styles.avatar}
            />
            <View style={styles.streamerInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.streamerName}>{campaign.streamerName}</Text>
                <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" style={styles.verifiedIcon} />
              </View>
              <Text style={styles.followersText}>
                {formatFollowers(campaign.streamerFollowers)} followers
              </Text>
            </View>
          </View>

          <View style={styles.mainContent}>
            <View style={styles.platformIcon}>
              <View style={styles.tiktokIcon}>
                <Ionicons name="logo-tiktok" size={24} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.priceContainer}>
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>{formatCpm(campaign.cpm)}</Text>
              </View>
            </View>

            <View style={styles.platformIcon}>
              <View style={styles.twitchIcon}>
                <Ionicons name="logo-twitch" size={24} color="#FFFFFF" />
              </View>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${getProgressPercentage()}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {formatCurrency(campaign.totalSpent)} / {formatCurrency(campaign.budget)} versés
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const DashboardContent: React.FC<{ userType: string }> = ({ userType }) => {
  if (userType === 'clipper') {
    return (
      <View style={styles.dashboardContainer}>
        <View style={styles.dashboardGrid}>
          <View style={styles.dashboardCard}>
            <Ionicons name="wallet-outline" size={32} color="#6366F1" />
            <Text style={styles.dashboardCardTitle}>Earnings</Text>
            <Text style={styles.dashboardCardValue}>$1,247.50</Text>
            <Text style={styles.dashboardCardSubtitle}>This month</Text>
          </View>
          
          <View style={styles.dashboardCard}>
            <Ionicons name="videocam-outline" size={32} color="#10B981" />
            <Text style={styles.dashboardCardTitle}>Clips</Text>
            <Text style={styles.dashboardCardValue}>156</Text>
            <Text style={styles.dashboardCardSubtitle}>Total created</Text>
          </View>
          
          <View style={styles.dashboardCard}>
            <Ionicons name="eye-outline" size={32} color="#F59E0B" />
            <Text style={styles.dashboardCardTitle}>Views</Text>
            <Text style={styles.dashboardCardValue}>2.4M</Text>
            <Text style={styles.dashboardCardSubtitle}>Total views</Text>
          </View>
          
          <View style={styles.dashboardCard}>
            <Ionicons name="trending-up-outline" size={32} color="#EF4444" />
            <Text style={styles.dashboardCardTitle}>Engagement</Text>
            <Text style={styles.dashboardCardValue}>8.7%</Text>
            <Text style={styles.dashboardCardSubtitle}>Avg. rate</Text>
          </View>
          
          <View style={styles.dashboardCard}>
            <Ionicons name="people-outline" size={32} color="#8B5CF6" />
            <Text style={styles.dashboardCardTitle}>Missions</Text>
            <Text style={styles.dashboardCardValue}>12</Text>
            <Text style={styles.dashboardCardSubtitle}>Active</Text>
          </View>
          
          <View style={styles.dashboardCard}>
            <Ionicons name="time-outline" size={32} color="#06B6D4" />
            <Text style={styles.dashboardCardTitle}>Hours</Text>
            <Text style={styles.dashboardCardValue}>47</Text>
            <Text style={styles.dashboardCardSubtitle}>This month</Text>
          </View>
        </View>
      </View>
    );
  } else {
    return (
      <View style={styles.dashboardContainer}>
        <View style={styles.dashboardGrid}>
          <View style={styles.dashboardCard}>
            <Ionicons name="wallet-outline" size={32} color="#6366F1" />
            <Text style={styles.dashboardCardTitle}>Revenue</Text>
            <Text style={styles.dashboardCardValue}>$8,420.30</Text>
            <Text style={styles.dashboardCardSubtitle}>This month</Text>
          </View>
          
          <View style={styles.dashboardCard}>
            <Ionicons name="videocam-outline" size={32} color="#10B981" />
            <Text style={styles.dashboardCardTitle}>Views Collected</Text>
            <Text style={styles.dashboardCardValue}>15.2M</Text>
            <Text style={styles.dashboardCardSubtitle}>Total views</Text>
          </View>
          
          <View style={styles.dashboardCard}>
            <Ionicons name="clipboard-outline" size={32} color="#F59E0B" />
            <Text style={styles.dashboardCardTitle}>Clips Made</Text>
            <Text style={styles.dashboardCardValue}>1,847</Text>
            <Text style={styles.dashboardCardSubtitle}>By clippers</Text>
          </View>
          
          <View style={styles.dashboardCard}>
            <Ionicons name="people-outline" size={32} color="#EF4444" />
            <Text style={styles.dashboardCardTitle}>Clippers Used</Text>
            <Text style={styles.dashboardCardValue}>89</Text>
            <Text style={styles.dashboardCardSubtitle}>Active clippers</Text>
          </View>
          
          <View style={styles.dashboardCard}>
            <Ionicons name="megaphone-outline" size={32} color="#8B5CF6" />
            <Text style={styles.dashboardCardTitle}>Missions</Text>
            <Text style={styles.dashboardCardValue}>5</Text>
            <Text style={styles.dashboardCardSubtitle}>Active</Text>
          </View>
          
          <View style={styles.dashboardCard}>
            <Ionicons name="trending-up-outline" size={32} color="#06B6D4" />
            <Text style={styles.dashboardCardTitle}>Growth</Text>
            <Text style={styles.dashboardCardValue}>+23%</Text>
            <Text style={styles.dashboardCardSubtitle}>This month</Text>
          </View>
        </View>
      </View>
    );
  }
};

const CampaignsContent: React.FC<{ userType: string }> = ({ userType }) => {
  return (
    <View style={styles.pageContainer}>
    </View>
  );
};

const EarningsContent: React.FC<{ userType: string }> = ({ userType }) => {
  return (
    <View style={styles.pageContainer}>
    </View>
  );
};

const SubmissionsContent: React.FC<{ userType: string }> = ({ userType }) => {
  return (
    <View style={styles.pageContainer}>
    </View>
  );
};

const CreateCampaignContent: React.FC<{ userType: string }> = ({ userType }) => {
  return (
    <View style={styles.pageContainer}>
    </View>
  );
};

const StatsContent: React.FC<{ userType: string }> = ({ userType }) => {
  return (
    <View style={styles.pageContainer}>
    </View>
  );
};

const ProfileContent: React.FC<{ userType: string }> = ({ userType }) => {
  return (
    <View style={styles.pageContainer}>
    </View>
  );
};

const Sidebar: React.FC<{ onTabChange: (tab: string) => void; activeTab: string; onSignIn: () => void }> = ({ onTabChange, activeTab, onSignIn }) => {

  const handleDashboardClick = () => {
    console.log('Dashboard clicked');
    onTabChange('dashboard');
    // Navigation to Dashboard page
  };

  const handleCampaignsClick = () => {
    console.log('Campaigns clicked');
    onTabChange('campaigns');
    // Navigation vers la page Campaigns
  };

  const handleEarningsClick = () => {
    console.log('Earnings clicked');
    onTabChange('earnings');
    // Navigation to Earnings page
  };

  const handleSubmissionsClick = () => {
    console.log('Submissions clicked');
    onTabChange('submissions');
    // Navigation vers la page Submissions
  };

  const handleCreateCampaignClick = () => {
    console.log('Create Campaign clicked');
    onTabChange('create-campaign');
    // Navigation vers la page Create Campaign
  };

  const handleStatsClick = () => {
    console.log('Stats clicked');
    onTabChange('stats');
    // Navigation vers la page Stats
  };

  const handleProfileClick = () => {
    console.log('Profile clicked');
    onTabChange('profile');
    // Navigate to Profile page
  };

  const handleKaiCenatCampaignClick = () => {
    console.log('KaiCenat Campaign clicked');
    // Navigation vers KaiCenat Campaign
  };

  const handleWaimeCampaignClick = () => {
    console.log('Waime Campaign clicked');
    // Navigation vers Waime Campaign
  };

  const handleJoycaCampaignClick = () => {
    console.log('Joyca Campaign clicked');
    // Navigation vers Joyca Campaign
  };

  const handleNinjaCampaignClick = () => {
    console.log('Ninja Campaign clicked');
    // Navigation vers Ninja Campaign
  };

  const handleNewCampaignClick = () => {
    console.log('New Campaign clicked');
    // Navigate to create new campaign
  };

  const handleMenuClick = () => {
    console.log('Menu clicked');
    // Ouvrir le menu
  };

  return (
    <View style={styles.sidebar}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>KLIPZ</Text>
        </View>
      </View>
      
      <View style={styles.navItems}>
        <View style={styles.navSection}>
          <TouchableOpacity 
            style={[
              styles.navItem, 
              activeTab === 'dashboard' && styles.navItemActive
            ]} 
            onPress={handleDashboardClick}
          >
            <Ionicons 
              name="home-outline" 
              size={40} 
              color={activeTab === 'dashboard' ? '#000000' : '#6a6a6a'} 
            />
            <Text style={[
              styles.navText, 
              activeTab === 'dashboard' && styles.navTextActive
            ]}>Dashboard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.navItem, 
              activeTab === 'campaigns' && styles.navItemActive
            ]} 
            onPress={handleCampaignsClick}
          >
            <Ionicons 
              name="megaphone-outline" 
              size={40} 
              color={activeTab === 'campaigns' ? '#000000' : '#6a6a6a'} 
            />
            <Text style={[
              styles.navText, 
              activeTab === 'campaigns' && styles.navTextActive
                            ]}>Missions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.navItem, 
              activeTab === 'earnings' && styles.navItemActive
            ]} 
            onPress={handleEarningsClick}
          >
            <Ionicons 
              name="wallet-outline" 
              size={40} 
              color={activeTab === 'earnings' ? '#000000' : '#6a6a6a'} 
            />
            <Text style={[
              styles.navText, 
              activeTab === 'earnings' && styles.navTextActive
            ]}>Earnings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.navItem, 
              activeTab === 'submissions' && styles.navItemActive
            ]} 
            onPress={handleSubmissionsClick}
          >
            <Ionicons 
              name="videocam-outline" 
              size={40} 
              color={activeTab === 'submissions' ? '#000000' : '#6a6a6a'} 
            />
            <Text style={[
              styles.navText, 
              activeTab === 'submissions' && styles.navTextActive
            ]}>Submissions</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.navSection}>
          <Text style={styles.navSectionTitle}>Actions</Text>
          <TouchableOpacity 
            style={[
              styles.navItem, 
              activeTab === 'create-campaign' && styles.navItemActive
            ]} 
            onPress={handleCreateCampaignClick}
          >
            <Ionicons 
              name="add-circle-outline" 
              size={40} 
              color={activeTab === 'create-campaign' ? '#000000' : '#6a6a6a'} 
            />
            <Text style={[
              styles.navText, 
              activeTab === 'create-campaign' && styles.navTextActive
            ]}>Create Campaign</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.navItem, 
              activeTab === 'stats' && styles.navItemActive
            ]} 
            onPress={handleStatsClick}
          >
            <Ionicons 
              name="analytics-outline" 
              size={40} 
              color={activeTab === 'stats' ? '#000000' : '#6a6a6a'} 
            />
            <Text style={[
              styles.navText, 
              activeTab === 'stats' && styles.navTextActive
            ]}>Stats</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.navItem, 
              activeTab === 'profile' && styles.navItemActive
            ]} 
            onPress={handleProfileClick}
          >
            <Ionicons 
              name="person-outline" 
              size={40} 
              color={activeTab === 'profile' ? '#000000' : '#6a6a6a'} 
            />
            <Text style={[
              styles.navText, 
              activeTab === 'profile' && styles.navTextActive
            ]}>Profile</Text>
          </TouchableOpacity>
        </View>
        

      </View>
      
      <View style={styles.footer}>        
        <View style={styles.authButtons}>
          <TouchableOpacity style={styles.signInButton} onPress={onSignIn}>
            <Text style={styles.signInText}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signUpButton} onPress={() => console.log('Sign up clicked')}>
            <Text style={styles.signUpText}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const LandingScreen: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => {
  const isDesktop = Platform.OS === 'web' && width >= 1200;
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [userType, setUserType] = React.useState('clipper'); // 'clipper' or 'streamer'

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleUserTypeChange = (type: string) => {
    setUserType(type);
  };
  
  return (
    <View style={styles.container}>
      {isDesktop && <Sidebar onTabChange={handleTabChange} activeTab={activeTab} onSignIn={onSignIn} />}
      
      <View style={[styles.mainContent, styles.mainContentFlex, !isDesktop && styles.mainContentMobile]}>
        <View style={styles.header}>
          {!isDesktop && (
            <View style={styles.mobileHeader}>
              <View style={styles.mobileLogo}>
                <Text style={styles.mobileLogoText}>KLIPZ</Text>
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.userTypeContainer}>
          <View style={styles.userTypeToggle}>
            <TouchableOpacity 
              style={[
                styles.userTypeButton, 
                userType === 'streamer' && styles.userTypeButtonActive
              ]}
              onPress={() => handleUserTypeChange('streamer')}
            >
              <Text style={[
                styles.userTypeText,
                userType === 'streamer' && styles.userTypeTextActive
              ]}>Streamer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.userTypeButton, 
                userType === 'clipper' && styles.userTypeButtonActive
              ]}
              onPress={() => handleUserTypeChange('clipper')}
            >
              <Text style={[
                styles.userTypeText,
                userType === 'clipper' && styles.userTypeTextActive
              ]}>Clipper</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
          {activeTab === 'dashboard' && (
            <DashboardContent userType={userType} />
          )}
          {activeTab === 'campaigns' && (
            <CampaignsContent userType={userType} />
          )}
          {activeTab === 'earnings' && (
            <EarningsContent userType={userType} />
          )}
          {activeTab === 'submissions' && (
            <SubmissionsContent userType={userType} />
          )}
          {activeTab === 'create-campaign' && (
            <CreateCampaignContent userType={userType} />
          )}
          {activeTab === 'stats' && (
            <StatsContent userType={userType} />
          )}
          {activeTab === 'profile' && (
            <ProfileContent userType={userType} />
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    height: '100vh',
    overflow: 'hidden',
  },
  sidebar: {
    width: 500,
    backgroundColor: COLORS.background,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingVertical: 24,
    paddingHorizontal: 40,
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  logoContainer: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'flex-start',
  },
  logoSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontFamily: FONTS.regular,
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.secondary,
    // Hexagon shape using clipPath (web) or custom shape
    ...(Platform.OS === 'web' && {
      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
    }),
  },
  logoText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  navItems: {
    flex: 1,
  },
  navSection: {
    marginTop: 10,
    marginBottom: 30,
  },
  navSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONTS.medium,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    transition: 'all 0.3s ease',
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  navItemActive: {
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
  },
  navText: {
    marginLeft: 20,
    fontSize: 37,
    color: '#6a6a6a',
    fontWeight: '350',
    fontFamily: FONTS.medium,
  },
  navTextActive: {
    color: '#000000',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightPurple,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  searchPlaceholder: {
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  whopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    transition: 'all 0.3s ease',
  },
  whopItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  whopBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whopBadgeRed: {
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whopBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  whopLogo: {
    width: 20,
    height: 20,
    backgroundColor: '#000000',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  whopLogoText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
  },
  authButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  footerText: {
    marginLeft: 25,
    fontSize: 35,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
    width: '100%',
    maxWidth: '100%',
  },
  mainContentFlex: {
    flex: 1,
  },
  mainContentMobile: {
    paddingHorizontal: 16,
    width: '100%',
  },
  mobileHeader: {
    flex: 1,
    alignItems: 'flex-start',
  },
  mobileLogo: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  mobileLogoText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  header: {
    paddingHorizontal: Platform.OS === 'web' ? 32 : 16,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    width: '100%',
    maxWidth: '100%',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  userTypeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
    zIndex: 1000,
    width: '100%',
    maxWidth: '100%',
  },
  userTypeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 8,
    alignSelf: 'center',
    minWidth: 400,
  },
  userTypeToggleContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userTypeButton: {
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 16,
    flex: 1,
  },
  userTypeButtonActive: {
    backgroundColor: '#000000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userTypeText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: FONTS.medium,
  },
  userTypeTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  signInButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: COLORS.primarySolid,
    borderRadius: 12,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.primarySolid,
  },
  signInText: {
    color: COLORS.secondary,
    fontSize: 24,
    fontWeight: '600',
    fontFamily: FONTS.bold,
  },
  signUpButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primarySolid,
  },
  signUpText: {
    color: COLORS.primarySolid,
    fontSize: 24,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  content: {
    flex: 1,
    paddingHorizontal: Platform.OS === 'web' ? 32 : 16,
    paddingVertical: 32,
    width: '100%',
    maxWidth: '100%',
  },
  contentContainer: {
    flexGrow: 1,
    width: '100%',
  },
  pageContainer: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
    width: '100%',
    maxWidth: '100%',
  },
  pageTitle: {
    fontSize: Platform.OS === 'web' ? 36 : 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 24,
    marginTop: 20,
    fontFamily: FONTS.bold,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  pageSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
    fontFamily: FONTS.regular,
  },
  dashboardContainer: {
    flex: 1,
    paddingVertical: 20,
    width: '100%',
    maxWidth: '100%',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: Platform.OS === 'web' 
      ? width >= 1400 ? 'repeat(4, 1fr)' 
      : width >= 1200 ? 'repeat(3, 1fr)' 
      : width >= 900 ? 'repeat(2, 1fr)' 
      : 'repeat(1, 1fr)'
      : 'repeat(2, 1fr)',
    gap: 24,
    marginTop: 24,
    width: '100%',
    maxWidth: '100%',
  },
  dashboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  dashboardCardTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
    marginBottom: 8,
    fontFamily: FONTS.medium,
  },
  dashboardCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: FONTS.bold,
  },
  dashboardCardSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 60,
    paddingTop: 20,
  },
  mainTitle: {
    fontSize: Platform.OS === 'web' ? 48 : 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    lineHeight: Platform.OS === 'web' ? 56 : 40,
    textAlign: 'center',
    fontFamily: FONTS.bold,
    maxWidth: 800,
  },
  subtitle: {
    fontSize: Platform.OS === 'web' ? 20 : 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: Platform.OS === 'web' ? 28 : 24,
    fontFamily: FONTS.regular,
    maxWidth: 600,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 600,
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: Platform.OS === 'web' ? 32 : 24,
    fontWeight: 'bold',
    color: COLORS.primarySolid,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontFamily: FONTS.regular,
  },
  sectionHeader: {
    marginBottom: 40,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: Platform.OS === 'web' ? 36 : 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  sectionDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontFamily: FONTS.regular,
    maxWidth: 600,
    alignSelf: 'center',
  },
  campaignsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 24,
    marginBottom: 80,
    width: '100%',
    maxWidth: '100%',
  },
  cardContainer: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 280 : 150,
    maxWidth: Platform.OS === 'web' ? 400 : 200,
    marginBottom: 24,
  },
  gradientBorder: {
    borderRadius: 18,
    padding: 3,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'center',
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  streamerInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  streamerName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#000000',
    marginRight: 6,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  followersText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: FONTS.regular,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  platformIcon: {
    alignItems: 'center',
  },
  tiktokIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  twitchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9146FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceContainer: {
    alignItems: 'center',
    flex: 1,
  },
  priceBadge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    minWidth: 120,
    ...SHADOWS.sm,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  progressSection: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#000000',
    fontFamily: FONTS.bold,
  },
  ctaSection: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    backgroundColor: COLORS.lightPurple,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  ctaTitle: {
    fontSize: Platform.OS === 'web' ? 32 : 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: FONTS.bold,
  },
  ctaDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: FONTS.regular,
    maxWidth: 500,
  },
  ctaButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: COLORS.primarySolid,
    borderRadius: 12,
    ...SHADOWS.base,
    borderWidth: 1,
    borderColor: COLORS.primarySolid,
  },
  ctaButtonText: {
    color: COLORS.secondary,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: FONTS.bold,
  },
});

export default LandingScreen; 