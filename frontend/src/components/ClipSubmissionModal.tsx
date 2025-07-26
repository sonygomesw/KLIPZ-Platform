import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';
import { Campaign } from '../types';

interface ClipSubmissionModalProps {
  visible: boolean;
  onClose: () => void;
  campaign: Campaign;
  onSubmit: (clipUrl: string) => void;
}

const ClipSubmissionModal: React.FC<ClipSubmissionModalProps> = ({
  visible,
  onClose,
  campaign,
  onSubmit,
}) => {
  const [clipUrl, setClipUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!clipUrl.trim()) {
      Alert.alert('Error', 'Please enter your TikTok clip URL');
      return;
    }

    if (!clipUrl.includes('tiktok.com')) {
      Alert.alert('Error', 'Please enter a valid TikTok URL');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(clipUrl);
      setClipUrl('');
      onClose();
      Alert.alert('Success', 'Your clip has been submitted successfully!');
    } catch (error) {
      Alert.alert('Error', 'An error occurred during submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)}$`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Soumettre un clip</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Campaign Info */}
          <View style={styles.campaignInfo}>
            <LinearGradient
              colors={['rgba(99, 102, 241, 0.1)', 'rgba(99, 102, 241, 0.05)']}
              style={styles.campaignCard}
            >
              <View style={styles.campaignHeader}>
                <Ionicons name="videocam" size={20} color={COLORS.primarySolid} />
                <Text style={styles.campaignTitle}>{campaign.title}</Text>
              </View>
              <Text style={styles.campaignDescription}>{campaign.description}</Text>
              <View style={styles.campaignStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>pay per 1k view</Text>
                  <Text style={styles.statValue}>{(campaign.cpm * 1000).toFixed(2)}$</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Remaining Budget</Text>
                  <Text style={styles.statValue}>
                    {formatCurrency(campaign.budget - campaign.totalSpent)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Criteria */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Criteria to Follow</Text>
            <View style={styles.criteriaContainer}>
              <View style={styles.criteriaItem}>
                <Ionicons name="time-outline" size={16} color={COLORS.primarySolid} />
                <Text style={styles.criteriaText}>Duration: {campaign.criteria?.duration || 'Not specified'}s max</Text>
              </View>
              <View style={styles.criteriaItem}>
                <Ionicons name="brush-outline" size={16} color={COLORS.lightPurple} />
                <Text style={styles.criteriaText}>Style: {campaign.criteria?.style || 'Not specified'}</Text>
              </View>
              <View style={styles.criteriaItem}>
                <Ionicons name="pricetag-outline" size={16} color={COLORS.accent} />
                <Text style={styles.criteriaText}>
                  Hashtags: {campaign.criteria?.hashtags?.join(', ') || 'Not specified'}
                </Text>
              </View>
            </View>
          </View>

          {/* URL Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>URL de votre clip TikTok</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="logo-tiktok" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="https://www.tiktok.com/@username/video/..."
                value={clipUrl}
                onChangeText={setClipUrl}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <View style={styles.instructionsContainer}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.accent} />
              <Text style={styles.instructionsTitle}>Comment ça marche ?</Text>
            </View>
            <Text style={styles.instructionsText}>
              1. Créez votre clip TikTok en respectant les critères{'\n'}
              2. Publiez-le sur TikTok avec les hashtags demandés{'\n'}
              3. Copiez l'URL de votre vidéo et collez-la ici{'\n'}
              4. Vous serez payé automatiquement selon les vues !
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <View style={[styles.submitGradient, { backgroundColor: '#000000' }]}>
              {isSubmitting ? (
                <Text style={styles.submitText}>Soumission en cours...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.submitText}>Soumettre le clip</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.spacing.lg,
    paddingVertical: SIZES.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: SIZES.spacing.xs,
  },
  title: {
    fontSize: SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  placeholder: {
    width: 32,
  },
  campaignInfo: {
    padding: SIZES.spacing.lg,
  },
  campaignCard: {
    borderRadius: SIZES.radius.lg,
    padding: SIZES.spacing.base,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  campaignTitle: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginLeft: SIZES.spacing.sm,
  },
  campaignDescription: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    marginBottom: SIZES.spacing.base,
  },
  campaignStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  statValue: {
    fontSize: SIZES.base,
    fontFamily: FONTS.bold,
    color: COLORS.primarySolid,
  },
  section: {
    paddingHorizontal: SIZES.spacing.lg,
    marginBottom: SIZES.spacing.lg,
  },
  sectionTitle: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SIZES.spacing.sm,
  },
  criteriaContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.base,
    padding: SIZES.spacing.base,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  criteriaText: {
    fontSize: SIZES.base,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    marginLeft: SIZES.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.base,
    paddingHorizontal: SIZES.spacing.base,
    paddingVertical: SIZES.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    fontSize: SIZES.base,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    marginLeft: SIZES.spacing.sm,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.spacing.sm,
  },
  instructionsTitle: {
    fontSize: SIZES.base,
    fontFamily: FONTS.bold,
    color: COLORS.accent,
    marginLeft: SIZES.spacing.sm,
  },
  instructionsText: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  footer: {
    padding: SIZES.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    borderRadius: SIZES.radius.lg,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.spacing.base,
    paddingHorizontal: SIZES.spacing.lg,
  },
  submitText: {
    color: COLORS.white,
    fontSize: SIZES.base,
    fontFamily: FONTS.medium,
    marginLeft: SIZES.spacing.sm,
  },
});

export default ClipSubmissionModal; 