import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants';
import { User } from '../types';
import AuthScreen from '../screens/AuthScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CampaignsListScreen from '../screens/CampaignsListScreen';
import CampaignDetailScreen from '../screens/CampaignDetailScreen';
import CreateCampaignScreen from '../screens/CreateCampaignScreen';
import SubmissionsScreen from '../screens/SubmissionsScreen';
import EarningsScreen from '../screens/EarningsScreen';
import PaymentScreen from '../screens/PaymentScreen';

import ProfileScreen from '../screens/ProfileScreen';
import BoostsScreen from '../screens/BoostsScreen';

import AdminDeclarationsScreen from '../screens/AdminDeclarationsScreen';
import AvailableMissionsScreen from '../screens/AvailableMissionsScreen';
import MissionDetailScreen from '../screens/MissionDetailScreen';
import ResponsiveLayout from '../components/ResponsiveLayout';
import authService, { AuthUser } from '../services/authService';
import { UserProvider } from '../contexts/UserContext';

// Écran temporaire pour les pages non encore configurées
const TempScreen: React.FC<{ title: string }> = ({ title }) => (
  <View style={styles.tempContainer}>
    <Text style={styles.tempText}>{title}</Text>
    <Text style={styles.tempSubtext}>This feature will be available soon</Text>
  </View>
);

const styles = StyleSheet.create({
  tempContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  tempText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.text,
  },
  tempSubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SIZES.spacing.lg,
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
  },
});

interface MainAppProps {
  user: User;
  onLogout: () => void;
}

const MainApp: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [selectedMission, setSelectedMission] = useState<any>(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'Campaigns':
        return <CampaignsListScreen user={user} activeTab={activeTab} onTabChange={setActiveTab} onSignOut={onLogout} />;
      case 'CreateCampaign':
        return <CreateCampaignScreen user={user} activeTab={activeTab} onTabChange={setActiveTab} onSignOut={onLogout} />;
      case 'CampaignDetail':
        return <CampaignDetailScreen user={user} activeTab={activeTab} onTabChange={setActiveTab} onSignOut={onLogout} />;

      case 'Submissions':
        return <SubmissionsScreen user={user} activeTab={activeTab} onTabChange={setActiveTab} onSignOut={onLogout} />;
      case 'Earnings':
        return <EarningsScreen user={user} activeTab={activeTab} onTabChange={setActiveTab} onSignOut={onLogout} />;
      case 'Payment':
        return <PaymentScreen user={user} activeTab={activeTab} onTabChange={setActiveTab} onSignOut={onLogout} />;

      case 'Boosts':
        return <BoostsScreen user={user} activeTab={activeTab} onTabChange={setActiveTab} onSignOut={onLogout} />;
      case 'AvailableMissions':
        return <AvailableMissionsScreen user={user} activeTab={activeTab} onTabChange={setActiveTab} onSignOut={onLogout} onMissionSelect={(mission) => { setSelectedMission(mission); setActiveTab('MissionDetail'); }} />;
      case 'MissionDetail':
        return <MissionDetailScreen user={user} activeTab={activeTab} onTabChange={setActiveTab} onSignOut={onLogout} selectedMission={selectedMission} />;
      case 'Profile':
        return <ProfileScreen user={user} activeTab={activeTab} onTabChange={setActiveTab} onSignOut={onLogout} />;
      case 'AdminDeclarations':
        return <AdminDeclarationsScreen />;
      default:
        return <DashboardScreen user={user} activeTab={activeTab} onTabChange={setActiveTab} onSignOut={onLogout} />;
    }
  };

  return (
    <ResponsiveLayout
      user={user}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSignOut={onLogout}
        >
      {renderContent()}
    </ResponsiveLayout>
  );
};

const AppNavigator: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
      setUser(currentUser);
      }
    } catch (error) {
      console.error('Error lors de la vérification de l\'état d\'authentification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (authenticatedUser: AuthUser) => {
    setUser(authenticatedUser);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error lors de la déconnexion:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primarySolid} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <UserProvider>
      <MainApp user={user} onLogout={handleLogout} />
    </UserProvider>
  );
};

export default AppNavigator; 