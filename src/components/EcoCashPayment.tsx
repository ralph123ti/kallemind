/**
 * EcoCashPayment.tsx
 *
 * User enters their EcoCash-registered phone number, taps Pay,
 * gets a USSD prompt on their phone, and this screen polls your
 * backend until they confirm (or it times out).
 *
 * No native SDK needed here — this is pure REST calls to your backend.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { initiateEcoCashPayment, pollEcoCashStatus } from '../services/paymentService';

interface Props {
  amount: number;       // smallest currency unit
  currency: string;     // e.g. 'usd' or 'zwl'
  onSuccess: (reference: string) => void;
  onError?: (message: string) => void;
}

const ZIM_PHONE_REGEX = /^(0|\+263)7[7-8][0-9]{7}$/; // matches EcoCash (077/078) numbers

export default function EcoCashPayment({ amount, currency, onSuccess, onError }: Props) {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'awaiting_confirmation' | 'polling'>('idle');

  const isValidPhone = ZIM_PHONE_REGEX.test(phone.trim());

  const handlePay = async () => {
    if (!isValidPhone) {
      Alert.alert('Invalid number', 'Enter a valid EcoCash number, e.g. 0771234567');
      return;
    }

    setStatus('awaiting_confirmation');
    try {
      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const initiation = await initiateEcoCashPayment({
        amount,
        currency,
        method: 'ecocash',
        ecocashPhoneNumber: phone.trim(),
        idempotencyKey,
        description: 'Kalimed payment',
      });

      if (initiation.status === 'failed') {
        onError?.(initiation.message ?? 'EcoCash payment failed to start');
        setStatus('idle');
        return;
      }

      setStatus('polling');
      const result = await pollEcoCashStatus(initiation.reference);

      if (result.success) {
        onSuccess(result.reference);
      } else {
        onError?.(result.message ?? 'Payment was not confirmed');
      }
    } catch (err: any) {
      onError?.(err.message ?? 'Something went wrong');
    } finally {
      setStatus('idle');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>EcoCash number</Text>
      <TextInput
        style={styles.input}
        placeholder="077XXXXXXX"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        editable={status === 'idle'}
      />

      {status === 'awaiting_confirmation' && (
        <Text style={styles.hint}>Sending prompt to your phone…</Text>
      )}
      {status === 'polling' && (
        <Text style={styles.hint}>
          Check your phone and enter your EcoCash PIN to confirm.
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, (!isValidPhone || status !== 'idle') && styles.buttonDisabled]}
        onPress={handlePay}
        disabled={!isValidPhone || status !== 'idle'}
      >
        {status !== 'idle' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Pay with EcoCash</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginVertical: 8 },
  label: { fontSize: 13, color: '#555', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  hint: { fontSize: 13, color: '#e07b00', marginBottom: 12 },
  button: {
    backgroundColor: '#e6002e', // EcoCash red
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
