import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';
import Button from '../components/Button';
import InsufficientBalanceModal from '../components/InsufficientBalanceModal';
import ImageCropper from '../components/ImageCropper';
import campaignService, { CreateCampaignData } from '../services/campaignService';
import { AuthUser } from '../services/authService';

interface CreateCampaignScreenProps {
  user: AuthUser;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSignOut?: () => void;
}

const CreateCampaignScreen: React.FC<CreateCampaignScreenProps> = ({ 
  user, 
  activeTab = 'CreateCampaign',
  onTabChange = () => {},
  onSignOut = () => {}
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState('');
  const [style, setStyle] = useState('');
  const [duration, setDuration] = useState('60');
  const [budget, setBudget] = useState('');
  const [cpm, setCpm] = useState('0.3');
  const [minViews, setMinViews] = useState('10000');
  const [twitchLink, setTwitchLink] = useState('');
  const [tiktokRequirements, setTiktokRequirements] = useState('');
  const [enableFanPage, setEnableFanPage] = useState(false);
  const [fanPageCpm, setFanPageCpm] = useState('0.5');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState(false);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [tempImageUri, setTempImageUri] = useState<string | null>(null);

  const handleCreateCampaign = async () => {
    console.log('🔵 Début création campagne...');
    console.log('🔵 Données du formulaire:', { title, description, budget, cpm, minViews, twitchLink, selectedImage, imageUrl });
    
    // Field validation
    if (!title.trim()) {
      console.log('❌ Titre manquant');
      Alert.alert('Error', 'Title is required');
      return;
    }
    if (!description.trim()) {
      console.log('❌ Description manquante');
      Alert.alert('Error', 'Description is required');
      return;
    }
    if (!budget.trim() || isNaN(Number(budget)) || Number(budget) <= 0) {
      console.log('❌ Budget invalide');
      Alert.alert('Error', 'Budget must be a positive number');
      return;
    }
    if (!cpm.trim() || isNaN(Number(cpm)) || Number(cpm) <= 0) {
      console.log('❌ CPM invalide');
      Alert.alert('Error', 'CPM must be a positive number');
      return;
    }
    if (!duration.trim() || isNaN(Number(duration)) || Number(duration) <= 0) {
      console.log('❌ Durée invalide');
      Alert.alert('Error', 'Duration must be a positive number');
      return;
    }
    if (!minViews.trim() || isNaN(Number(minViews)) || Number(minViews) <= 0) {
      console.log('❌ Vues minimum invalides');
      Alert.alert('Error', 'Minimum views per video must be a positive number');
      return;
    }
    if (enableFanPage && (!fanPageCpm.trim() || isNaN(Number(fanPageCpm)) || Number(fanPageCpm) <= 0)) {
      console.log('❌ CPM fan page invalide');
      Alert.alert('Error', 'Pay per 1k view fan page must be a positive number');
      return;
    }
    if (!twitchLink.trim()) {
      console.log('❌ Lien Twitch manquant');
      Alert.alert('Error', 'Twitch rediffusion link is required');
      return;
    }
    if (!selectedImage && !imageUrl.trim()) {
      console.log('❌ Image manquante');
      Alert.alert('Error', 'Campaign preview image is required');
      return;
    }

    console.log('✅ Toutes les validations passées');

    // Check available balance
    console.log('🔍 Vérification du solde - user.balance:', user.balance, 'budget:', Number(budget));
    if (user.balance < Number(budget)) {
      console.log('❌ Solde insuffisant:', user.balance, '<', Number(budget));
      setShowInsufficientBalanceModal(true);
      return;
    }

    console.log('✅ Solde suffisant');

    setIsLoading(true);
    try {
      console.log('🔵 Préparation des données de campagne...');
      
      const campaignData: CreateCampaignData = {
        title: title.trim(),
        description: description.trim(),
        imageUrl: selectedImage || imageUrl.trim() || undefined,
        criteria: {
          hashtags: [], // On utilise les requirements TikTok à la place
          style: tiktokRequirements.trim(),
          duration: Number(duration),
          minViews: Number(minViews),
        },
        budget: Number(budget),
        cpm: Number(cpm),
        fanPageCpm: enableFanPage ? Number(fanPageCpm) : null,
      };

      console.log('🔵 Données de campagne préparées:', campaignData);
      console.log('🔵 Appel du service de création...');

      const campaign = await campaignService.createCampaign(user.id, campaignData);
      
      console.log('✅ Campagne créée avec succès:', campaign);
      
      Alert.alert(
        'Success',
        'Your campaign has been created successfully!',
        [
          { text: 'OK', onPress: () => onTabChange('Dashboard') },
        ]
      );
    } catch (error: any) {
      console.error('❌ Error creating campaign:', error);
      console.error('❌ Message d\'erreur:', error.message);
      Alert.alert('Error', error.message || 'Failed to create campaign');
    } finally {
      console.log('🔵 Fin de la création de campagne');
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: string) => {
    const num = Number(amount);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const calculateEstimatedReach = () => {
    const budgetNum = Number(budget);
    const cpmNum = Number(cpm);
    if (isNaN(budgetNum) || isNaN(cpmNum) || cpmNum === 0) return 0;
    return Math.round((budgetNum / cpmNum) * 1000);
  };

  const pickImage = async () => {
    console.log('🔍 pickImage - Début de la fonction');
    
    try {
      // Test simple d'abord
      console.log('🔍 pickImage - Test de base...');
      
      // Demander permission
      console.log('🔍 pickImage - Demande de permission...');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('🔍 pickImage - Permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        console.log('❌ pickImage - Permission refusée');
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      // Lancer le sélecteur d'image sans recadrage automatique
      console.log('🔍 pickImage - Lancement du sélecteur d\'image...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Retour à l'ancienne API
        allowsEditing: false, // On désactive le recadrage automatique
        quality: 0.8,
      });

      console.log('🔍 pickImage - Résultat du sélecteur:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('✅ pickImage - Image sélectionnée:', result.assets[0].uri);
        // Pour le test, on met directement l'image sans recadrage
        setSelectedImage(result.assets[0].uri);
        setImageUrl('');
        console.log('✅ pickImage - Image définie directement');
      } else {
        console.log('❌ pickImage - Aucune image sélectionnée ou annulé');
      }
    } catch (error) {
      console.error('❌ pickImage - Erreur:', error);
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const handleImageCrop = (croppedImageUri: string) => {
    setSelectedImage(croppedImageUri);
    setImageUrl(''); // Clear URL si une image est sélectionnée
    setShowImageCropper(false);
    setTempImageUri(null);
  };

  const handleImageCropCancel = () => {
    setShowImageCropper(false);
    setTempImageUri(null);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImageUrl('');
  };

  return (
    <View style={styles.rootContainer}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Page Title Header */}
          <View style={styles.pageTitleContainer}>
            <View style={styles.pageTitleContent}>
                      <Text style={styles.pageTitle}>Create Mission</Text>
        <Text style={styles.pageSubtitle}>Set up your mission and start attracting talented clippers</Text>
            </View>
          </View>

          <View style={styles.mainContent}>
            {/* Left Side - Form */}
            <View style={styles.leftSide}>
              <View style={styles.setupCard}>
                <View style={styles.setupHeader}>
                  <Text style={styles.setupTitle}>New mission setup</Text>
                  <View style={styles.helpIcon}>
                    <Ionicons name="help-circle-outline" size={24} color={COLORS.textSecondary} />
                  </View>
                </View>

                {/* Title Input */}
                <View style={styles.modernInputGroup}>
                  <Text style={styles.modernLabel}>Title *</Text>
                  <TextInput
                    style={styles.modernInput}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="KLIPZ Mission"
                    placeholderTextColor={COLORS.textLight}
                    maxLength={100}
                  />
                </View>

                                 {/* Description */}
                 <View style={styles.modernInputGroup}>
                   <Text style={styles.modernLabel}>Description *</Text>
                   <TextInput
                     style={[styles.modernInput, styles.textArea]}
                     value={description}
                     onChangeText={setDescription}
                     placeholder="Describe what kind of clips you want..."
                     placeholderTextColor={COLORS.textLight}
                     multiline
                     numberOfLines={4}
                     maxLength={500}
                   />
                 </View>

                                 {/* Budget and Min Views Row */}
                 <View style={styles.doubleRow}>
                   <View style={styles.doubleRowItem}>
                     <Text style={styles.modernLabel}>Total budget *</Text>
                     <View style={styles.budgetContainer}>
                       <TextInput
                         style={styles.budgetInput}
                         value={budget}
                         onChangeText={setBudget}
                         placeholder="10000"
                         placeholderTextColor={COLORS.textLight}
                         keyboardType="numeric"
                       />
                       <TouchableOpacity style={styles.currencySelector}>
                         <Text style={styles.currencyText}>USD</Text>
                         <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
                       </TouchableOpacity>
                     </View>
                   </View>
                   <View style={styles.doubleRowItem}>
                     <Text style={styles.modernLabel}>Minimum views per TikTok video *</Text>
                     <TextInput
                       style={styles.modernInput}
                       value={minViews}
                       onChangeText={setMinViews}
                       placeholder="10000"
                       placeholderTextColor={COLORS.textLight}
                       keyboardType="numeric"
                     />
                   </View>
                 </View>

                {/* Funding Notice */}
                <View style={styles.fundingNotice}>
                  <Ionicons name="information-circle" size={20} color="#4F46E5" />
                  <Text style={styles.fundingText}>
                    You will be prompted to top up ${budget || '10,000'}.00 in the next step
                  </Text>
                </View>

                {/* Reward Rate Section */}
                <View style={styles.rewardSection}>
                  <Text style={styles.modernLabel}>Payout rate *</Text>
                  <View style={styles.rewardRateContainer}>
                    <View style={styles.rateInputGroup}>
                      <Text style={styles.rateLabel}>Pay</Text>
                      <View style={styles.rateInputContainer}>
                        <Text style={styles.dollarSign}>$</Text>
                        <TextInput
                          style={styles.rateInput}
                          value={cpm}
                          onChangeText={setCpm}
                          placeholder="1"
                          placeholderTextColor={COLORS.textLight}
                          keyboardType="numeric"
                        />
                      </View>
                      <Text style={styles.perText}>per</Text>
                      <View style={styles.viewsContainer}>
                        <Text style={styles.viewsNumber}>1,000</Text>
                        <Text style={styles.viewsText}>Views</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Min and Max Payout */}
                <View style={styles.doubleRow}>
                  <View style={styles.doubleRowItem}>
                    <Text style={styles.modernLabel}>Min payout</Text>
                    <View style={styles.payoutContainer}>
                      <Text style={styles.dollarSign}>$</Text>
                      <TextInput
                        style={styles.payoutInput}
                        placeholder="0"
                        placeholderTextColor={COLORS.textLight}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <View style={styles.doubleRowItem}>
                    <Text style={styles.modernLabel}>Max payout</Text>
                    <View style={styles.payoutContainer}>
                      <Text style={styles.dollarSign}>$</Text>
                      <TextInput
                        style={styles.payoutInput}
                        placeholder="0"
                        placeholderTextColor={COLORS.textLight}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>

                                                  <Text style={styles.autoApproveText}>
                   All submissions will be auto-approved after 48 hours if still pending.
                 </Text>
               </View>
             </View>

                         {/* Right Side - Twitch Link & Image Upload */}
             <View style={styles.rightSide}>
               <View style={styles.previewCard}>
                 <Text style={styles.previewTitle}>Mission Setup</Text>
                 
                 {/* Twitch Rediffusion Link */}
                 <View style={styles.modernInputGroup}>
                   <Text style={styles.modernLabel}>Twitch Rediffusion Link *</Text>
                   <TextInput
                     style={styles.modernInput}
                     value={twitchLink}
                     onChangeText={setTwitchLink}
                     placeholder="https://www.twitch.tv/videos/..."
                     placeholderTextColor={COLORS.textLight}
                     autoCapitalize="none"
                     autoCorrect={false}
                     keyboardType="url"
                   />
                 </View>

                 {/* Mission Image Upload */}
                 <View style={styles.modernInputGroup}>
                   <Text style={styles.modernLabel}>Mission Preview Image *</Text>
                   <Text style={styles.uploadDescription}>
                     Upload an image that will be displayed as the mission preview
                   </Text>
                   
                   {!selectedImage ? (
                     <TouchableOpacity 
                       style={styles.imageUploadButton} 
                       onPress={() => {
                         console.log('🔍 Bouton Upload Image cliqué');
                         pickImage();
                       }}
                     >
                       <Ionicons name="cloud-upload-outline" size={32} color="#4F46E5" />
                       <Text style={styles.imageUploadText}>Upload Image</Text>
                       <Text style={styles.imageUploadSubtext}>Click to select and crop an image</Text>
                     </TouchableOpacity>
                   ) : (
                     <View style={styles.selectedImageContainer}>
                       <Image
                         source={{ uri: selectedImage }}
                         style={styles.selectedImage}
                         resizeMode="cover"
                       />
                       <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                         <Ionicons name="close" size={20} color={COLORS.error} />
                       </TouchableOpacity>
                       <TouchableOpacity 
                         style={styles.cropImageButton} 
                         onPress={() => {
                           setTempImageUri(selectedImage);
                           setShowImageCropper(true);
                         }}
                       >
                         <Ionicons name="crop" size={16} color={COLORS.white} />
                       </TouchableOpacity>
                     </View>
                   )}
                 </View>

                 {/* TikTok Clips Requirements */}
                 <View style={styles.modernInputGroup}>
                   <Text style={styles.modernLabel}>TikTok clips requirements *</Text>
                   <TextInput
                     style={[styles.modernInput, styles.textArea]}
                     placeholder="Describe the specific requirements for TikTok clips..."
                     placeholderTextColor={COLORS.textLight}
                     multiline
                     numberOfLines={4}
                     maxLength={500}
                   />
                 </View>
               </View>
             </View>
           </View>
           
           {/* Create Button - Inside scroll, after content */}
           <View style={styles.createButtonContainer}>
<<<<<<< HEAD
             <TouchableOpacity 
               style={styles.createButton} 
               onPress={() => {
                 console.log('🔵 Bouton Create Campaign cliqué');
                 handleCreateCampaign();
               }}
             >
               <Text style={styles.createButtonText}>Create Campaign</Text>
             </TouchableOpacity>
=======
                     <TouchableOpacity style={styles.createButton} onPress={handleCreateCampaign}>
          <Text style={styles.createButtonText}>Create Mission</Text>
        </TouchableOpacity>
>>>>>>> feature/frontend-design
           </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Insufficient Balance Modal */}
      <InsufficientBalanceModal
        visible={showInsufficientBalanceModal}
        currentBalance={user.balance}
        requiredAmount={Number(budget) || 0}
        onClose={() => setShowInsufficientBalanceModal(false)}
        onAddFunds={() => {
          setShowInsufficientBalanceModal(false);
          onTabChange('Payment');
        }}
      />

      {/* Image Cropper Modal */}
      <ImageCropper
        visible={showImageCropper}
        imageUri={tempImageUri || ''}
        onCrop={handleImageCrop}
        onCancel={handleImageCropCancel}
        aspectRatio={16/9}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0A0A0B',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0B',
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#0A0A0B',
    width: '100%',
  },
  pageTitleContainer: {
    backgroundColor: '#1A1A1E',
    marginHorizontal: 16,
    marginVertical: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2E',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  pageTitleContent: {
    paddingHorizontal: 32,
    paddingVertical: 28,
    alignItems: 'center',
  },
  pageTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  pageSubtitle: {
    color: '#8B8B8D',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
  },
  mainContent: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 24,
    backgroundColor: '#0A0A0B',
    width: '100%',
    flex: 1,
    minHeight: 0,
  },
  leftSide: {
    flex: 1,
    maxWidth: '55%',
    minHeight: 0,
  },
  rightSide: {
    flex: 1,
    maxWidth: '45%',
    minHeight: 0,
  },
  setupCard: {
    backgroundColor: '#1A1A1E',
    borderRadius: 24,
    padding: 48,
    borderWidth: 1,
    borderColor: '#2A2A2E',
    flex: 1,
    minHeight: 0,
  },
  setupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  setupTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '600',
  },
  helpIcon: {
    padding: 4,
  },
  modernInputGroup: {
    marginBottom: 32,
  },
  modernLabel: {
    color: '#E5E5E7',
    fontSize: 22,
    fontWeight: '500',
    marginBottom: 12,
  },
  modernInput: {
    backgroundColor: '#2A2A2E',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    fontSize: 20,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 20,
  },
  doubleRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 32,
  },
  doubleRowItem: {
    flex: 1,
  },
  modernDropdown: {
    backgroundColor: '#2A2A2E',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  dropdownText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetInput: {
    backgroundColor: '#2A2A2E',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    fontSize: 20,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3A3A3E',
    flex: 1,
    marginRight: 12,
  },
  currencySelector: {
    backgroundColor: '#2A2A2E',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A3A3E',
    minWidth: 100,
  },
  currencyText: {
    color: '#FFFFFF',
    fontSize: 20,
    marginRight: 4,
  },
  fundingNotice: {
    backgroundColor: '#1E1F47',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  fundingText: {
    color: '#A5B4FC',
    fontSize: 20,
    marginLeft: 12,
    flex: 1,
  },
  rewardSection: {
    marginBottom: 28,
  },
  rewardRateContainer: {
    backgroundColor: '#2A2A2E',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  rateInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rateLabel: {
    color: '#E5E5E7',
    fontSize: 20,
    fontWeight: '500',
  },
  rateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1E',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  dollarSign: {
    color: '#E5E5E7',
    fontSize: 20,
    marginRight: 6,
  },
  rateInput: {
    color: '#FFFFFF',
    fontSize: 20,
    minWidth: 50,
  },
  perText: {
    color: '#E5E5E7',
    fontSize: 20,
    fontWeight: '500',
  },
  viewsContainer: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewsText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
  },
  viewsNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  payoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#3A3A3E',
  },
  payoutInput: {
    color: '#FFFFFF',
    fontSize: 20,
    flex: 1,
  },
  createButtonContainer: {
    backgroundColor: '#0A0A0B',
    paddingVertical: 50,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 72,
    alignItems: 'center',
    minWidth: 320,
    shadowColor: '#4F4506E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '600',
  },
  autoApproveText: {
    color: '#8B8B8D',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  previewCard: {
    backgroundColor: '#1A1A1E',
    borderRadius: 24,
    padding: 48,
    borderWidth: 1,
    borderColor: '#2A2A2E',
    flex: 1,
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 32,
  },
  uploadSection: {
    marginBottom: 28,
  },
  uploadRecommendation: {
    color: '#8B8B8D',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: '#4F46E5',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  uploadDescription: {
    color: '#8B8B8D',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  imageUploadButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#4F46E5',
    borderStyle: 'dashed',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 120,
  },
  imageUploadText: {
    color: '#4F46E5',
    fontSize: 18,
    fontWeight: '600',
  },
  imageUploadSubtext: {
    color: '#8B8B8D',
    fontSize: 14,
  },
  selectedImageContainer: {
    position: 'relative',
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#1A1A1E',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropImageButton: {
    position: 'absolute',
    top: 8,
    right: 48,
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewStats: {
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    color: '#8B8B8D',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  statPercentage: {
    color: '#8B8B8D',
    fontSize: 14,
  },
  progressBarContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2A2A2E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  rewardDisplay: {
    backgroundColor: '#2A2A2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardBadge: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardAmount: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  rewardUnit: {
    color: '#FFFFFF',
    fontSize: 18,
    marginLeft: 2,
    fontWeight: '600',
  },
  contentDetails: {
    alignItems: 'center',
  },
  contentType: {
    color: '#8B8B8D',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  contentValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
  },
  categoryDetails: {
    alignItems: 'center',
  },
  categoryType: {
    color: '#8B8B8D',
    fontSize: 18,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  categoryValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
  },
  payoutLimits: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  limitItem: {
    alignItems: 'center',
  },
  limitLabel: {
    color: '#8B8B8D',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  limitValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  platformsSection: {
    alignItems: 'center',
  },
  platformsLabel: {
    color: '#8B8B8D',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  platformsValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CreateCampaignScreen; 