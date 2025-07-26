import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, Platform } from 'react-native';
import { COLORS } from '../constants';
import { User } from '../types';
import ResponsiveLayout from '../components/ResponsiveLayout';

// Import screens
import AuthScreen from '../screens/AuthScreen';
import LandingScreen from '../screens/LandingScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CampaignsListScreen from '../screens/CampaignsListScreen';

import EarningsScreen from '../screens/EarningsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminDeclarationsScreen from '../screens/AdminDeclarationsScreen';

import CreateCampaignScreen from '../screens/CreateCampaignScreen';
import SubmissionsScreen from '../screens/SubmissionsScreen';
import CampaignDetailScreen from '../screens/CampaignDetailScreen';
import PaymentScreen from '../screens/PaymentScreen';

import authService, { AuthUser } from '../services/authService';
import { supabase } from '../config/supabase';
import { UserProvider } from '../contexts/UserContext';

const Stack = createStackNavigator();

interface ResponsiveMainProps {
  user: User;
  onLogout: () => void;
}

const ResponsiveMain: React.FC<ResponsiveMainProps> = ({ user, onLogout }) => {
  const [currentRoute, setCurrentRoute] = useState('Dashboard');

  const renderScreen = () => {
    switch (currentRoute) {
      case 'Dashboard':
        return <DashboardScreen user={user} activeTab={currentRoute} onTabChange={setCurrentRoute} onSignOut={onLogout} />;
      case 'Campaigns':
        return <CampaignsListScreen user={user} activeTab={currentRoute} onTabChange={setCurrentRoute} onSignOut={onLogout} />;

      case 'Earnings':
        return <EarningsScreen user={user} activeTab={currentRoute} onTabChange={setCurrentRoute} onSignOut={onLogout} />;
      case 'AdminDeclarations':
        return <AdminDeclarationsScreen />;
      
      case 'CreateCampaign':
        return <CreateCampaignScreen user={user} activeTab={currentRoute} onTabChange={setCurrentRoute} onSignOut={onLogout} />;
      case 'Submissions':
        return <SubmissionsScreen user={user} activeTab={currentRoute} onTabChange={setCurrentRoute} onSignOut={onLogout} />;
      case 'Profile':
        return <ProfileScreen user={user} activeTab={currentRoute} onTabChange={setCurrentRoute} onSignOut={onLogout} />;
      default:
        return <DashboardScreen user={user} activeTab={currentRoute} onTabChange={setCurrentRoute} onSignOut={onLogout} />;
    }
  };

  return (
    <ResponsiveLayout
      currentRoute={currentRoute}
      onNavigate={setCurrentRoute}
      userRole={user.role}
    >
      {renderScreen()}
    </ResponsiveLayout>
  );
};

const ResponsiveNavigator: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (session?.user) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Error lors de la récupération du profil:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.log('Pas d\'utilisateur connecté au démarrage');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (authenticatedUser: AuthUser) => {
    console.log('🔵 handleAuthSuccess appelé avec utilisateur:', authenticatedUser);
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
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
      }}>
        <ActivityIndicator size="large" color={COLORS.primarySolid} />
      </View>
    );
  }

  if (!user) {
    return (
      <UserProvider initialRole="streamer">
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Landing">
              {(props) => <LandingScreen {...props} onSignIn={() => {
                // Navigate to Auth screen
                props.navigation.navigate('Auth');
              }} />}
            </Stack.Screen>
            <Stack.Screen name="Auth">
              {(props) => <AuthScreen {...props} onAuthSuccess={handleAuthSuccess} />}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </UserProvider>
    );
  }

  return (
    <UserProvider initialRole={user.role}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main">
            {(props) => <ResponsiveMain {...props} user={user} onLogout={handleLogout} />}
          </Stack.Screen>
          {/* Modal screens that overlay the main layout */}
          <Stack.Screen 
            name="CampaignDetail" 
            options={{ 
              presentation: Platform.OS === 'web' ? 'modal' : 'card',
              headerShown: true,
              headerTitle: 'Campaign Details'
            }}
          >
            {(props) => <CampaignDetailScreen {...props} user={user} />}
          </Stack.Screen>
          <Stack.Screen 
            name="Payment" 
            options={{ 
              presentation: Platform.OS === 'web' ? 'modal' : 'card',
              headerShown: true,
              headerTitle: 'Payment'
            }}
          >
            {(props) => <PaymentScreen {...props} user={user} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
};

export default ResponsiveNavigator;