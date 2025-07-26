import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { stripeAdapter, StripeWebAdapter } from '../services/stripeWebService';
import { COLORS } from '../constants';

interface StripeCardInputProps {
  onCardChange?: (isValid: boolean, cardData?: any) => void;
  style?: any;
}

const StripeCardInput: React.FC<StripeCardInputProps> = ({ onCardChange, style }) => {
  const cardElementRef = useRef<HTMLDivElement>(null);
  const [cardElement, setCardElement] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && cardElementRef.current) {
      initializeCardElement();
    }
  }, []);

  const initializeCardElement = async () => {
    try {
      if (stripeAdapter instanceof StripeWebAdapter) {
        const element = await stripeAdapter.createCardElement();
        element.mount(cardElementRef.current);
        
        element.on('change', (event: any) => {
          if (event.error) {
            setError(event.error.message);
            onCardChange?.(false);
          } else {
            setError(null);
            onCardChange?.(event.complete, { element });
          }
        });

        setCardElement(element);
      }
    } catch (err) {
      console.error('Error initializing card element:', err);
      setError('Error lors de l\'initialisation du formulaire de paiement');
    }
  };

  if (Platform.OS !== 'web') {
    // Sur mobile, utiliser le composant natif Stripe
    return (
      <View style={[styles.container, style]}>
        <Text>Composant Stripe natif (à implémenter)</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>Card Information</Text>
      <div
        ref={cardElementRef}
        style={{
          padding: '12px',
          border: `1px solid ${COLORS.border}`,
          borderRadius: '8px',
          backgroundColor: COLORS.surface,
          minHeight: '40px',
        }}
      />
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  error: {
    fontSize: 12,
    color: COLORS.error || '#FF6B6B',
    marginTop: 4,
  },
});

export default StripeCardInput;