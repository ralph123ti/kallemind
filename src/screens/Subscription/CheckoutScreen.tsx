/**
 * CheckoutScreen.tsx
 *
 * Lives in src/screens/Subscription/. Shows Card (via Paynow WebView)
 * and EcoCash as the two payment options, tab-style toggle.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import CardPaymentWebView from '../../components/CardPaymentWebView';
import EcoCashPayment from '../../components/EcoCashPayment';

type Tab = 'card' | 'ecocash';

export default function CheckoutScreen() {
  const [tab, setTab] = useState<Tab>('card');

  // Example: $9.99 subscription. Adjust to your real amount.
  const amountUsdCents = 999;

  const handleSuccess = (reference: string) => {
    console.log('Payment succeeded:', reference);
    Alert.alert('Payment successful', 'Thank you!');
  };

  const handleError = (msg: string) => {
    console.warn('Payment failed:', msg);
    Alert.alert('Payment failed', msg);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Choose a payment method</Text>

      <View style={styles.tabRow}>
        <Text
          style={[styles.tab, tab === 'card' && styles.tabActive]}
          onPress={() => setTab('card')}
        >
          Card
        </Text>
        <Text
          style={[styles.tab, tab === 'ecocash' && styles.tabActive]}
          onPress={() => setTab('ecocash')}
        >
          EcoCash
        </Text>
      </View>

      {tab === 'card' ? (
        <CardPaymentWebView
          amount={amountUsdCents}
          description="Kalimed subscription"
          onSuccess={handleSuccess}
          onError={handleError}
        />
      ) : (
        <EcoCashPayment
          amount={amountUsdCents}
          currency="usd"
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  tabRow: { flexDirection: 'row', marginBottom: 20 },
  tab: {
    marginRight: 24,
    paddingBottom: 8,
    fontSize: 15,
    color: '#999',
  },
  tabActive: {
    color: '#111',
    fontWeight: '600',
    borderBottomWidth: 2,
    borderBottomColor: '#111',
  },
});
