/**
 * CardPaymentWebView.tsx
 *
 * Requires: react-native-webview
 *   npx expo install react-native-webview
 *
 * Unlike Stripe's native Apple Pay/Google Pay button, this opens Paynow's
 * hosted checkout page inside your app via a WebView modal. The user enters
 * their Visa/Mastercard details there (Paynow may also show Apple Pay/Google
 * Pay buttons on that page, depending on their account configuration — this
 * is controlled by Paynow, not by this component).
 */

import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { initiateCardPayment, pollPaymentStatus } from '../api/paymentService';

interface Props {
  amount: number;             // smallest currency unit, e.g. cents
  description?: string;
  onSuccess: (reference: string) => void;
  onError?: (message: string) => void;
}

// Paynow's return page URL you set server-side — used to detect completion
const RETURN_URL_MATCH = 'your-app.example.com/payment-return';

export default function CardPaymentWebView({ amount, description, onSuccess, onError }: Props) {
  const [visible, setVisible] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startPayment = async () => {
    setLoading(true);
    try {
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const result = await initiateCardPayment(amount, idempotencyKey, description);

      if (!result.success || !result.redirectUrl) {
        onError?.(result.message ?? 'Could not start card payment');
        return;
      }

      setReference(result.reference);
      setCheckoutUrl(result.redirectUrl);
      setVisible(true);
    } catch (err: any) {
      onError?.(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Called whenever the WebView navigates — used to detect Paynow's return URL
  const handleNavigationChange = async (navState: { url: string }) => {
    if (navState.url.includes(RETURN_URL_MATCH) && reference) {
      setVisible(false);
      setLoading(true);
      try {
        const result = await pollPaymentStatus(reference, { timeoutMs: 15000, intervalMs: 2000 });
        if (result.success) {
          onSuccess(result.reference);
        } else {
          onError?.(result.message ?? 'Payment was not completed');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={startPayment} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Pay with Card</Text>
        )}
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide">
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setVisible(false)}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
        {checkoutUrl && (
          <WebView
            source={{ uri: checkoutUrl }}
            onNavigationStateChange={handleNavigationChange}
            startInLoadingState
            renderLoading={() => (
              <ActivityIndicator style={StyleSheet.absoluteFill} size="large" />
            )}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginVertical: 8 },
  button: {
    backgroundColor: '#111',
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalHeader: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeText: { fontSize: 16, color: '#007AFF' },
});
