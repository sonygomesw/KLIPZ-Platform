import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Polygon, Circle, Line } from 'react-native-svg';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants';
import { User } from '../types';

const { width, height } = Dimensions.get('window');

// Composant pour l'icône Home Instagram (nouvelle version)
const HomeIcon: React.FC<{ isActive: boolean; size: number }> = ({ isActive, size }) => {
  const color = isActive ? '#f1f1f1' : '#b5b5b5';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      {isActive ? (
        // Version active (remplie) - Instagram filled home
        <Path
          d="M2.25 12.8855V20.7497C2.25 21.8543 3.14543 22.7497 4.25 22.7497H8.25C8.52614 22.7497 8.75 22.5259 8.75 22.2497V17.6822V17.4997C8.75 15.1525 10.6528 13.2497 13 13.2497C15.3472 13.2497 17.25 15.1525 17.25 17.4997V17.6822V22.2497C17.25 22.5259 17.4739 22.7497 17.75 22.7497H21.75C22.8546 22.7497 23.75 21.8543 23.75 20.7497V12.8855C23.75 11.3765 23.0685 9.94815 21.8954 8.99883L16.1454 4.3454C14.3112 2.86095 11.6888 2.86095 9.85455 4.3454L4.10455 8.99883C2.93153 9.94815 2.25 11.3765 2.25 12.8855Z"
          fill={color}
          stroke={color}
          strokeLinecap="round"
          strokeWidth="2.5"
        />
      ) : (
        // Version inactive (outline) - Instagram outline home
        <Path
          d="M2.25 12.8855V20.7497C2.25 21.8543 3.14543 22.7497 4.25 22.7497H9.25C9.52614 22.7497 9.75 22.5258 9.75 22.2497V17.6822V16.4997C9.75 14.7048 11.2051 13.2497 13 13.2497C14.7949 13.2497 16.25 14.7048 16.25 16.4997V17.6822V22.2497C16.25 22.5258 16.4739 22.7497 16.75 22.7497H21.75C22.8546 22.7497 23.75 21.8543 23.75 20.7497V12.8855C23.75 11.3765 23.0685 9.94814 21.8954 8.99882L16.1454 4.34539C14.3112 2.86094 11.6888 2.86094 9.85455 4.34539L4.10455 8.99882C2.93153 9.94814 2.25 11.3765 2.25 12.8855Z"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="2.5"
        />
      )}
    </Svg>
  );
};

// Composant pour l'icône My Missions (Reels Instagram)
const CampaignsIcon: React.FC<{ isActive: boolean; size: number }> = ({ isActive, size }) => {
  const color = isActive ? '#f1f1f1' : '#b5b5b5';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {isActive ? (
        // Version active (remplie) - Reels Instagram rempli
        <>
          <Path
            d="M8 2A6 6 0 002 8v8a6 6 0 006 6h8a6 6 0 006-6V8a6 6 0 00-6-6H8z"
            fill={color}
          />
          <Path
            d="M10 8.5v7l5.5-3.5L10 8.5z"
            fill="#000000"
          />
        </>
      ) : (
        // Version inactive (outline) - Reels Instagram outline
        <>
          <Path
            d="M8 2A6 6 0 002 8v8a6 6 0 006 6h8a6 6 0 006-6V8a6 6 0 00-6-6H8z"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10 8.5v7l5.5-3.5L10 8.5z"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </Svg>
  );
};

// Composant pour l'icône Create Campaign (New Post) Instagram
const CreateCampaignIcon: React.FC<{ isActive: boolean; size: number }> = ({ isActive, size }) => {
  const color = isActive ? '#f1f1f1' : '#b5b5b5';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {isActive ? (
        // Version active (remplie) - Instagram filled new post avec croix intégrée
        <>
          <Path
            d="M2 12v3.45c0 2.849.698 4.005 1.606 4.944.94.909 2.098 1.608 4.946 1.608h6.896c2.848 0 4.006-.7 4.946-1.608C21.302 19.455 22 18.3 22 15.45V8.552c0-2.849-.698-4.006-1.606-4.945C19.454 2.7 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.547 2 5.703 2 8.552Z"
            fill={color}
          />
          <Line
            x1="6.545"
            y1="12.001"
            x2="17.455"
            y2="12.001"
            stroke="#000000"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <Line
            x1="12.003"
            y1="6.545"
            x2="12.003"
            y2="17.455"
            stroke="#000000"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </>
      ) : (
        // Version inactive (outline) - Instagram outline new post
        <>
          <Path
            d="M2 12v3.45c0 2.849.698 4.005 1.606 4.944.94.909 2.098 1.608 4.946 1.608h6.896c2.848 0 4.006-.7 4.946-1.608C21.302 19.455 22 18.3 22 15.45V8.552c0-2.849-.698-4.006-1.606-4.945C19.454 2.7 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.547 2 5.703 2 8.552Z"
            fill="none"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <Line
            x1="6.545"
            y1="12.001"
            x2="17.455"
            y2="12.001"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <Line
            x1="12.003"
            y1="6.545"
            x2="12.003"
            y2="17.455"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </>
      )}
    </Svg>
  );
};

// Composant pour l'icône Profile
const ProfileIcon: React.FC<{ isActive: boolean; size: number }> = ({ isActive, size }) => {
  const color = isActive ? '#f1f1f1' : '#b5b5b5';
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {isActive ? (
        // Version active (remplie)
        <Path
          d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
          fill={color}
        />
      ) : (
        // Version inactive (outline)
        <>
          <Circle
            cx="12"
            cy="8"
            r="4"
            stroke={color}
            strokeWidth="2"
            fill="none"
          />
          <Path
            d="M20 20c0-3.33-5.33-6-8-6s-8 2.67-8 6"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
    </Svg>
  );
};

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
}

const Sidebar: React.FC<{ 
  user: User;
  activeTab: string; 
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
}> = ({ user, activeTab, onTabChange, onSignOut }) => {
  const isStreamer = user.role === 'streamer';
  const isClipper = user.role === 'clipper';

  return (
    <View style={styles.sidebar}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/klipz-logo-sidebar.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeText}>
              {isStreamer ? (user.twitchDisplayName || user.email) : user.email}
            </Text>
            <Image 
              source={require('../../assets/twitch-badge.png')} 
              style={styles.twitchBadge}
            />
          </View>
          <View style={styles.roleBadge}>
            <Ionicons 
              name={isStreamer ? 'videocam' : 'film'} 
              size={12} 
              color="#FFFFFF" 
            />
            <Text style={styles.roleText}>
              {isStreamer ? 'Streamer' : 'Clipper'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.navItems}>
        <View style={styles.navSection}>
          <TouchableOpacity 
            style={[
              styles.navItem, 
              activeTab === 'Dashboard' && styles.navItemActive
            ]} 
            onPress={() => onTabChange('Dashboard')}
          >
            <HomeIcon 
              isActive={activeTab === 'Dashboard'}
              size={45}
            />
            <Text style={[
              styles.navText, 
              activeTab === 'Dashboard' && styles.navTextActive
            ]}>Dashboard</Text>
          </TouchableOpacity>
          
          {isClipper && (
            <TouchableOpacity 
              style={[
                styles.navItem, 
                activeTab === 'AvailableMissions' && styles.navItemActive
              ]} 
              onPress={() => onTabChange('AvailableMissions')}
            >
              <Ionicons 
                name="megaphone-outline" 
                size={45} 
                color={activeTab === 'AvailableMissions' ? '#f1f1f1' : '#b5b5b5'} 
              />
              <Text style={[
                styles.navText, 
                                  activeTab === 'AvailableMissions' && styles.navTextActive
                ]}>Available Missions</Text>
            </TouchableOpacity>
          )}
          
          {isStreamer && (
            <TouchableOpacity 
              style={[
                styles.navItem, 
                activeTab === 'Campaigns' && styles.navItemActive
              ]} 
              onPress={() => onTabChange('Campaigns')}
            >
              <CampaignsIcon 
                isActive={activeTab === 'Campaigns'}
                size={45}
              />
              <Text style={[
                styles.navText, 
                activeTab === 'Campaigns' && styles.navTextActive
              ]}>My Missions</Text>
            </TouchableOpacity>
          )}
          
          {isClipper && (
            <TouchableOpacity 
              style={[
                styles.navItem, 
                activeTab === 'Campaigns' && styles.navItemActive
              ]} 
              onPress={() => onTabChange('Campaigns')}
            >
              <CampaignsIcon 
                isActive={activeTab === 'Campaigns'}
                size={45}
              />
              <Text style={[
                styles.navText, 
                activeTab === 'Campaigns' && styles.navTextActive
              ]}>Missions</Text>
            </TouchableOpacity>
          )}
          

          
          {isClipper && (
            <TouchableOpacity 
              style={[
                styles.navItem, 
                activeTab === 'Earnings' && styles.navItemActive
              ]} 
              onPress={() => onTabChange('Earnings')}
            >
              <Ionicons 
                name="wallet-outline" 
                size={45} 
                color={activeTab === 'Earnings' ? '#f1f1f1' : '#b5b5b5'} 
              />
              <Text style={[
                styles.navText, 
                activeTab === 'Earnings' && styles.navTextActive
              ]}>Earnings</Text>
            </TouchableOpacity>
          )}
          
          {isClipper && (
            <TouchableOpacity 
              style={[
                styles.navItem, 
                activeTab === 'Submissions' && styles.navItemActive
              ]} 
              onPress={() => onTabChange('Submissions')}
            >
              <Ionicons 
                name="videocam-outline" 
                size={45} 
                color={activeTab === 'Submissions' ? '#f1f1f1' : '#b5b5b5'} 
              />
              <Text style={[
                styles.navText, 
                activeTab === 'Submissions' && styles.navTextActive
              ]}>My Clips</Text>
            </TouchableOpacity>
          )}
          

        </View>
        
        <View style={styles.navSection}>
          <Text style={styles.navSectionTitle}>Actions</Text>
          
          {isStreamer && (
    <TouchableOpacity
      style={[
        styles.navItem,
                activeTab === 'CreateCampaign' && styles.navItemActive
      ]}
              onPress={() => onTabChange('CreateCampaign')}
    >
      <CreateCampaignIcon
                isActive={activeTab === 'CreateCampaign'}
                size={45}
              />
              <Text style={[
                styles.navText, 
                activeTab === 'CreateCampaign' && styles.navTextActive
                                ]}>Create Mission</Text>
            </TouchableOpacity>
          )}
          

          
          <TouchableOpacity 
        style={[
              styles.navItem, 
              activeTab === 'Profile' && styles.navItemActive
            ]} 
            onPress={() => onTabChange('Profile')}
          >
            <ProfileIcon 
              isActive={activeTab === 'Profile'}
              size={45}
            />
            <Text style={[
              styles.navText, 
              activeTab === 'Profile' && styles.navTextActive
            ]}>Profile</Text>
    </TouchableOpacity>
          
          {user.role === 'admin' && (
            <TouchableOpacity 
              style={[
                styles.navItem, 
                activeTab === 'AdminDeclarations' && styles.navItemActive
              ]} 
              onPress={() => onTabChange('AdminDeclarations')}
            >
              <Ionicons 
                name="shield-checkmark-outline" 
                size={45} 
                color={activeTab === 'AdminDeclarations' ? '#f1f1f1' : '#b5b5b5'} 
              />
              <Text style={[
                styles.navText, 
                activeTab === 'AdminDeclarations' && styles.navTextActive
              ]}>Admin</Text>
          </TouchableOpacity>
        )}
        </View>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.userInfo}>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userRole}>{user.role}</Text>
        </View>
        
        <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ 
  children, 
  user, 
  activeTab, 
  onTabChange, 
  onSignOut 
}) => {
  const isDesktop = Platform.OS === 'web' && width >= 800; // Réduit le seuil pour garder la sidebar plus longtemps

  return (
    <View style={styles.container}>
      {isDesktop && (
        <Sidebar 
          user={user}
          activeTab={activeTab} 
          onTabChange={onTabChange}
          onSignOut={onSignOut}
        />
      )}
      
      <View style={[styles.mainContent, styles.mainContentFlex, !isDesktop && styles.mainContentMobile]}>
        <View style={styles.header}>
          {!isDesktop && (
    <View style={styles.mobileHeader}>
              <Image 
                source={require('../../assets/klipz-logo-sidebar.png')}
                style={styles.mobileLogoImage}
                resizeMode="contain"
              />
            </View>
      )}
    </View>
        
        <View style={styles.content}>
          {children}
        </View>
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
    minWidth: 950, // Largeur minimum pour éviter que tout disparaisse
  },
  sidebar: {
    width: 500, // Augmente la largeur de la sidebar
    minWidth: 450, // Largeur minimum de la sidebar
    backgroundColor: '#000000',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingVertical: 24,
    paddingHorizontal: 40, // Augmente le padding horizontal
    justifyContent: 'space-between',
    ...SHADOWS.sm,
    flexShrink: 0, // Empêche la sidebar de rétrécir
  },
  logoContainer: {
    marginTop: 40,
    marginBottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 32,
  },
  logoImage: {
    width: 150,
    height: 150,
    borderRadius: 32,
  },
  welcomeContainer: {
    flex: 1,
    marginLeft: SIZES.spacing.lg,
    justifyContent: 'center',
    paddingHorizontal: SIZES.spacing.sm,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
    paddingRight: SIZES.spacing.md,
  },
  welcomeText: {
    fontSize: 33,
    color: COLORS.text,
    fontFamily: FONTS.medium,
    fontWeight: '450',
  },
  twitchBadge: {
    width: 33,
    height: 33,
    marginLeft: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySolid,
    paddingHorizontal: SIZES.spacing.sm,
    paddingVertical: SIZES.spacing.xs,
    borderRadius: 9,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  roleText: {
    fontSize: 25,
    color: '#FFFFFF',
    fontFamily: FONTS.medium,
    marginLeft: 10,
  },
  navItems: {
    flex: 1,
  },
  navSection: {
    marginTop: 10,
    marginBottom: 30,
  },
  navSectionTitle: {
    fontSize: 30,
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
    paddingVertical: 26,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    transition: 'all 0.3s ease',
  },
  navItemActive: {
    backgroundColor: '#363636',
    borderRadius: 27,
  },
  navText: {
    marginLeft: 20,
    fontSize: 35,
    color: '#b5b5b5',
    fontWeight: '350',
    fontFamily: FONTS.medium,
  },
  navTextActive: {
    color: '#f1f1f1',
  },
  footer: {
    marginTop: 20,
  },
  userInfo: {
    marginBottom: 20,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: FONTS.medium,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    textTransform: 'capitalize',
  },
  signOutButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.background,
    width: '100%',
    maxWidth: '100%',
    minWidth: 400, // Largeur minimum pour le contenu principal
    overflow: 'auto', // Permet le scroll si nécessaire
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
  mobileLogoImage: {
    width: 32,
    height: 32,
  },
  header: {
    paddingHorizontal: Platform.OS === 'web' ? 32 : 16,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: Platform.OS === 'web' ? 32 : 16,
    width: '100%',
    maxWidth: '100%',
  },
});

export default ResponsiveLayout;