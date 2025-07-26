import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';
import { Campaign } from '../types';

interface CampaignCardProps {
  campaign: Campaign;
  onPress: () => void;
  showActions?: boolean;
  userRole?: 'streamer' | 'clipper';
}

const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onPress,
  showActions = false,
  userRole = 'streamer',
}) => {
  console.log('🔵 CampaignCard - Données reçues:', {
    id: campaign.id,
    streamerName: campaign.streamerName,
    streamerAvatar: campaign.streamerAvatar,
    streamerFollowers: campaign.streamerFollowers
  });
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
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      {/* Conteneur externe avec dégradé */}
      <LinearGradient
        colors={['#FF6B35', '#9146FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        {/* Conteneur interne blanc */}
        <View style={styles.card}>
          {/* Header with profil streamer */}
          <View style={styles.header}>
            <Image
              source={{
                uri: campaign.streamerAvatar || 'https://via.placeholder.com/40x40/6366F1/FFFFFF?text=S'
              }}
              style={styles.avatar}
              onError={(error) => {
                console.log('❌ Error loading streamer image:', error.nativeEvent.error);
                console.log('❌ URL tentée:', campaign.streamerAvatar);
              }}
              onLoad={() => {
                console.log('✅ Streamer image loaded successfully:', campaign.streamerAvatar);
              }}
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
            
            {/* Button Participate pour les clippers */}
            {userRole === 'clipper' && (
              <TouchableOpacity style={styles.participateButton} onPress={onPress}>
                <Text style={styles.participateText}>Participate</Text>
              </TouchableOpacity>
            )}

          </View>

          {/* Section principale avec icônes et prix central */}
          <View style={styles.mainContent}>
            {/* Icône TikTok */}
            <View style={styles.platformIcon}>
              <View style={styles.tiktokIcon}>
                <Ionicons name="logo-tiktok" size={24} color="#FFFFFF" />
              </View>
            </View>

            {/* Price central */}
            <View style={styles.priceContainer}>
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>{formatCpm(campaign.cpm)}</Text>
              </View>
            </View>

            {/* Icône Twitch */}
            <View style={styles.platformIcon}>
              <View style={styles.twitchIcon}>
                <Ionicons name="logo-twitch" size={24} color="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* Image de campagne (si disponible) */}
          {campaign.imageUrl && (
            <View style={styles.campaignImageContainer}>
              <Image
                source={{ uri: campaign.imageUrl }}
                style={styles.campaignImage}
                resizeMode="cover"
                onError={(error) => {
                  console.log('❌ Error loading campaign image:', error.nativeEvent.error);
                }}
              />
            </View>
          )}

          {/* Section progression du budget (comme KaiCenat) */}
          <View style={styles.budgetProgressSection}>
            <Text style={styles.budgetProgressAmount}>
              ${campaign.totalSpent?.toLocaleString() || '0'} of ${campaign.budget?.toLocaleString() || '0'}
            </Text>
            <View style={styles.budgetProgressBar}>
              <View 
                style={[
                  styles.budgetProgressFill, 
                  { width: `${getProgressPercentage()}%` }
                ]} 
              />
            </View>
            <Text style={styles.budgetProgressPercentage}>
              {Math.round(getProgressPercentage())}%
            </Text>
          </View>

          {/* Section statistiques */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Min view / video</Text>
              <Text style={styles.statValue}>
                {campaign.criteria?.minViews ? 
                  `${(campaign.criteria.minViews / 1000).toFixed(1)}K` : 
                  '10.0K'
                }
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Views</Text>
              <Text style={styles.statValue}>
                {campaign.totalViews >= 1000000 ? 
                  `${(campaign.totalViews / 1000000).toFixed(1)}M` :
                  campaign.totalViews >= 1000 ?
                  `${(campaign.totalViews / 1000).toFixed(1)}K` :
                  campaign.totalViews.toString()
                }
              </Text>
            </View>
            {userRole === 'clipper' && (
              <View style={styles.statItem}>
                <TouchableOpacity style={styles.addClipButton} onPress={onPress}>
                  <Ionicons name="logo-twitch" size={20} color="#9146FF" />
                  <Text style={styles.addClipText}>Add a clip</Text>
                  <Ionicons name="add" size={20} color="#9146FF" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Section progression originale supprimée car remplacée par les sections ci-dessus */}
          
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  gradientBorder: {
    borderRadius: 18,
    padding: 3, // Bordure plus épaisse
    // Effet de bordure dégradée avec les couleurs rouge-orangé vers violet
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
    marginLeft: 5,
  },
  followersText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: FONTS.regular,
    marginTop: 2,
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
  participateButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#1DA1F2', // Bleu comme les boutons de filtre actifs
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  participateText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
  },
  budgetProgressSection: {
    alignItems: 'center',
    marginTop: 15,
  },
  budgetProgressAmount: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: '#000000',
    marginBottom: 8,
  },
  budgetProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  budgetProgressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 3,
  },
  budgetProgressPercentage: {
    fontSize: 14,
    color: '#000000',
    fontFamily: FONTS.bold,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#000000',
  },
  addClipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginTop: 10,
    ...SHADOWS.sm,
  },
  addClipText: {
    color: '#9146FF',
    fontSize: 14,
    fontFamily: FONTS.bold,
    marginHorizontal: 8,
  },
  campaignImageContainer: {
    width: '100%',
    height: 150, // Adjust height as needed
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 15,
    ...SHADOWS.sm,
  },
  campaignImage: {
    width: '100%',
    height: '100%',
  },
});

export default CampaignCard; 