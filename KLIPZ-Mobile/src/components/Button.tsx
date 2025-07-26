import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';

import { COLORS, SIZES, FONTS, SHADOWS } from '../constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: SIZES.radius.base,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...SHADOWS.base,
    };

    const sizeStyles = {
      sm: {
        paddingHorizontal: SIZES.spacing.base,
        paddingVertical: SIZES.spacing.sm,
        minHeight: 36,
      },
      md: {
        paddingHorizontal: SIZES.spacing.lg,
        paddingVertical: SIZES.spacing.base,
        minHeight: 48,
      },
      lg: {
        paddingHorizontal: SIZES.spacing.xl,
        paddingVertical: SIZES.spacing.lg,
        minHeight: 56,
      },
    };

    const variantStyles = {
      primary: {
        backgroundColor: disabled ? COLORS.textLight : COLORS.primarySolid,
      },
      secondary: {
        backgroundColor: disabled ? COLORS.textLight : COLORS.lightPurple,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: disabled ? COLORS.textLight : COLORS.primarySolid,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontFamily: FONTS.medium,
      textAlign: 'center',
    };

    const sizeTextStyles = {
      sm: { fontSize: SIZES.sm },
      md: { fontSize: SIZES.base },
      lg: { fontSize: SIZES.lg },
    };

    const variantTextStyles = {
      primary: { color: COLORS.white },
      secondary: { color: COLORS.white },
      outline: { color: disabled ? COLORS.textLight : COLORS.primarySolid },
      ghost: { color: disabled ? COLORS.textLight : COLORS.primarySolid },
    };

    return {
      ...baseTextStyle,
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
    };
  };

  if (variant === 'primary' && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[getButtonStyle(), style]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={COLORS.white}
          />
        ) : (
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? COLORS.primarySolid : COLORS.white}
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default Button; 