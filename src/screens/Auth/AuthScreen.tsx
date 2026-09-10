import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, fontSizes, borderRadius } from '../../theme';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Enter both email and password.');
      return;
    }
    setSubmitting(true);
    const { error } =
      mode === 'signIn'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
    setSubmitting(false);

    if (error) {
      Alert.alert('Error', error);
    } else if (mode === 'signUp') {
      Alert.alert('Check your email', 'Confirm your address to finish signing up.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mode === 'signIn' ? 'Welcome back' : 'Create your account'}</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
        placeholderTextColor={colors.text.muted}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
        placeholderTextColor={colors.text.muted}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>{mode === 'signIn' ? 'Sign In' : 'Sign Up'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
        <Text style={styles.switchText}>
          {mode === 'signIn' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: '#f0f5fa' },
  title: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.navBackground, marginBottom: spacing.lg, textAlign: 'center' },
  label: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.text.secondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, fontSize: fontSizes.sm, borderWidth: 1, borderColor: colors.border, color: colors.text.primary },
  button: { backgroundColor: colors.accentGreen, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: fontSizes.md },
  switchText: { color: colors.accentGreen, textAlign: 'center', marginTop: spacing.lg, fontSize: fontSizes.sm, fontWeight: '600' },
});
