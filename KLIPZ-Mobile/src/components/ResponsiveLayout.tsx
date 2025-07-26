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
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants';
import { User } from '../types';

const { width, height } = Dimensions.get('window');

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
        <View style={styles.logo}>
          <Text style={styles.logoText}>KLIPZ</Text>
        </View>
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
            <Ionicons 
              name="home-outline" 
              size={40} 
              color={activeTab === 'Dashboard' ? '#000000' : '#6a6a6a'} 
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
                size={40} 
                color={activeTab === 'AvailableMissions' ? '#000000' : '#6a6a6a'} 
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
              <Ionicons 
                name="megaphone-outline" 
                size={40} 
                color={activeTab === 'Campaigns' ? '#000000' : '#6a6a6a'} 
              />
              <Text style={[
                styles.navText, 
                activeTab === 'Campaigns' && styles.navTextActive
              ]}>My Campaigns</Text>
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
                size={40} 
                color={activeTab === 'Earnings' ? '#000000' : '#6a6a6a'} 
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
                size={40} 
                color={activeTab === 'Submissions' ? '#000000' : '#6a6a6a'} 
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
      <Ionicons
                name="add-circle-outline" 
                size={40} 
                color={activeTab === 'CreateCampaign' ? '#000000' : '#6a6a6a'} 
              />
              <Text style={[
                styles.navText, 
                activeTab === 'CreateCampaign' && styles.navTextActive
              ]}>Create Campaign</Text>
            </TouchableOpacity>
          )}
          

          
          <TouchableOpacity 
        style={[
              styles.navItem, 
              activeTab === 'Profile' && styles.navItemActive
            ]} 
            onPress={() => onTabChange('Profile')}
          >
            <Ionicons 
              name="person-outline" 
              size={40} 
              color={activeTab === 'Profile' ? '#000000' : '#6a6a6a'} 
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
                size={40} 
                color={activeTab === 'AdminDeclarations' ? '#000000' : '#6a6a6a'} 
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
              <View style={styles.mobileLogo}>
                <Text style={styles.mobileLogoText}>KLIPZ</Text>
              </View>
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
    backgroundColor: COLORS.background,
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
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  logoText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: 'bold',
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
    fontSize: 30,
    color: COLORS.text,
    fontFamily: FONTS.medium,
    fontWeight: '450',
  },
  twitchBadge: {
    width: 16,
    height: 16,
    marginLeft: SIZES.spacing.md,
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