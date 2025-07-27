import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants';

interface ImageCropperProps {
  visible: boolean;
  imageUri: string;
  onCrop: (croppedImageUri: string) => void;
  onCancel: () => void;
  aspectRatio?: number; // 16/9 = 1.78, 4/3 = 1.33, etc.
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImageCropper: React.FC<ImageCropperProps> = ({
  visible,
  imageUri,
  onCrop,
  onCancel,
  aspectRatio = 16/9
}) => {
  console.log('🔍 ImageCropper - imageUri:', imageUri);
  console.log('🔍 ImageCropper - visible:', visible);
  const [cropArea, setCropArea] = useState({
    x: 50,
    y: 100,
    width: screenWidth - 100,
    height: (screenWidth - 100) / aspectRatio,
  });

  const handleMoveCrop = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 20;
    setCropArea(prev => {
      let newX = prev.x;
      let newY = prev.y;
      
      switch (direction) {
        case 'up':
          newY = Math.max(0, prev.y - step);
          break;
        case 'down':
          newY = Math.min(screenHeight - prev.height - 200, prev.y + step);
          break;
        case 'left':
          newX = Math.max(0, prev.x - step);
          break;
        case 'right':
          newX = Math.min(screenWidth - prev.width, prev.x + step);
          break;
      }
      
      return { ...prev, x: newX, y: newY };
    });
  };

  const handleCrop = () => {
    // For now, we'll just return the original image
    // In a real implementation, you'd use a library like react-native-image-crop-tools
    onCrop(imageUri);
  };



  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={COLORS.white} />
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Crop Image</Text>
          
          <TouchableOpacity onPress={handleCrop} style={styles.headerButton}>
            <Ionicons name="checkmark" size={24} color={COLORS.primary} />
            <Text style={[styles.headerButtonText, { color: COLORS.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Image Container */}
        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            {/* Background image */}
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.backgroundImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imageBackground}>
                <Text style={styles.imagePlaceholder}>No Image Selected</Text>
              </View>
            )}
            
            {/* Overlay with crop area */}
            <View style={styles.overlay}>
              <View style={styles.cropArea} />
            </View>
            
            {/* Crop frame */}
            <View
              style={[
                styles.cropFrame,
                {
                  left: cropArea.x,
                  top: cropArea.y,
                  width: cropArea.width,
                  height: cropArea.height,
                }
              ]}
            >
              {/* Corner handles */}
              <View style={[styles.cornerHandle, styles.topLeft]} />
              <View style={[styles.cornerHandle, styles.topRight]} />
              <View style={[styles.cornerHandle, styles.bottomLeft]} />
              <View style={[styles.cornerHandle, styles.bottomRight]} />
            </View>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => handleMoveCrop('up')}
            >
              <Ionicons name="chevron-up" size={24} color={COLORS.white} />
              <Text style={styles.controlButtonText}>Up</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => handleMoveCrop('down')}
            >
              <Ionicons name="chevron-down" size={24} color={COLORS.white} />
              <Text style={styles.controlButtonText}>Down</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => handleMoveCrop('left')}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.white} />
              <Text style={styles.controlButtonText}>Left</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => handleMoveCrop('right')}
            >
              <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
              <Text style={styles.controlButtonText}>Right</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.helpText}>
            Use buttons to move the crop area • Aspect ratio: 16:9
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  headerButtonText: {
    color: COLORS.white,
    fontSize: 16,
    marginLeft: 5,
    fontFamily: FONTS.medium,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: screenWidth,
    height: screenHeight - 200,
    position: 'relative',
  },
  imageBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2A2A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    color: COLORS.textLight,
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cropArea: {
    position: 'absolute',
    top: 100,
    left: 50,
    right: 50,
    bottom: 100,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  cropFrame: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  cornerHandle: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  topLeft: {
    top: -10,
    left: -10,
  },
  topRight: {
    top: -10,
    right: -10,
  },
  bottomLeft: {
    bottom: -10,
    left: -10,
  },
  bottomRight: {
    bottom: -10,
    right: -10,
  },
  controls: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  controlButton: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    minWidth: 100,
  },
  controlButtonText: {
    color: COLORS.white,
    fontSize: 12,
    marginTop: 5,
    fontFamily: FONTS.medium,
  },
  helpText: {
    color: COLORS.textLight,
    fontSize: 12,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
});

export default ImageCropper; 