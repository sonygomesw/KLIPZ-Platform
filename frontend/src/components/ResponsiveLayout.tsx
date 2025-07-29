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
      </View>
      
      <View style={styles.navItems}>
        <TouchableOpacity 
          style={[
            styles.navItem, 
            activeTab === 'Dashboard' && styles.navItemActive
          ]} 
          onPress={() => onTabChange('Dashboard')}
        >
                      <HomeIcon 
              isActive={activeTab === 'Dashboard'}
              size={25}
            />
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
              size={30} 
              color={activeTab === 'AvailableMissions' ? '#f1f1f1' : '#b5b5b5'} 
            />
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
              size={25}
            />
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
              size={25}
            />
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
              size={25} 
              color={activeTab === 'Earnings' ? '#f1f1f1' : '#b5b5b5'} 
            />
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
              size={25} 
              color={activeTab === 'Submissions' ? '#f1f1f1' : '#b5b5b5'} 
            />
          </TouchableOpacity>
        )}
        
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
              size={25}
            />
          </TouchableOpacity>
        )}
        
        {isStreamer && (
          <TouchableOpacity 
            style={[
              styles.navItem, 
              activeTab === 'Payment' && styles.navItemActive
            ]} 
            onPress={() => onTabChange('Payment')}
          >
            <Ionicons 
              name={activeTab === 'Payment' ? "wallet" : "wallet-outline"} 
              size={25} 
              color={activeTab === 'Payment' ? '#f1f1f1' : '#b5b5b5'} 
            />
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
            size={25}
          />
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
              size={25} 
              color={activeTab === 'AdminDeclarations' ? '#f1f1f1' : '#b5b5b5'} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
          <Ionicons 
            name="log-out-outline" 
            size={25} 
            color="#b5b5b5" 
          />
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
  const isDesktop = Platform.OS === 'web' && width >= 600; // Seuil réduit pour que la navbar apparaisse plus facilement

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
    backgroundColor: '#0A0A0A',
    height: '100vh',
    overflow: 'hidden',
    minWidth: 950,
  },
  sidebar: {
    width: 80,
    minWidth: 80,
    backgroundColor: '#0A0A0A',
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    flexShrink: 0,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: -15,
    borderRadius: 12,
  },
  logoImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  welcomeContainer: {
    display: 'none',
  },
  welcomeContent: {
    display: 'none',
  },
  welcomeText: {
    display: 'none',
  },
  twitchBadge: {
    display: 'none',
  },
  roleBadge: {
    display: 'none',
  },
  roleText: {
    display: 'none',
  },
  navItems: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navSectionTitle: {
    display: 'none',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 15,
    width: 50,
    height: 50,
  },
  navItemActive: {
    backgroundColor: '#181818',
    borderRadius: 12,
    width: 65,
  },
  navText: {
    display: 'none',
  },
  navTextActive: {
    display: 'none',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  userInfo: {
    display: 'none',
  },
  userEmail: {
    display: 'none',
  },
  userRole: {
    display: 'none',
  },
  signOutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  signOutText: {
    display: 'none',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    width: '100%',
    maxWidth: '100%',
    minWidth: 400,
    overflow: 'scroll',
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