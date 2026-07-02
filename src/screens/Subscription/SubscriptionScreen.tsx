import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSizes, borderRadius } from '../../theme';

const plans = [
  {
    id: 'free',
    name: 'Free Plan',
    price: '$0',
    period: 'forever',
    color: '#5a7a8a',
    icon: 'leaf-outline' as const,
    desc: 'Great for getting started. No sign-up required.',
    features: [
      'Health education articles',
      'Prevention & wellness guides',
      'Anonymous symptom checker (3×/month)',
      'Doctor directory access',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: '$5.99',
    period: '/month',
    color: colors.accentGreen,
    icon: 'star' as const,
    popular: true,
    desc: 'Everything in Free, plus more access and tools.',
    features: [
      'Unlimited symptom checker',
      'Save favourite clinics & doctors',
      'Personalised health dashboard',
      'Health reminders & wellness tracking',
      'Priority community access',
      'Early access to new features',
    ],
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: '$9.99',
    period: '/month',
    color: colors.accentBlue,
    icon: 'people' as const,
    desc: 'Built for families & power users.',
    features: [
      'Advanced health insights',
      'Priority support',
      'Family health profiles',
      'Multi-device sync',
      'Premium wellness programs',
      'Future telehealth access',
    ],
  },
];

export default function SubscriptionScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState('premium');

  const handleSubscribe = () => {
    const plan = plans.find(p => p.id === selected);
    if (!plan || plan.id === 'free') {
      Alert.alert('Free Plan', 'You are already on the free plan!');
      return;
    }
    Alert.alert(
      'Coming Soon',
      `${plan.name} payments will be available soon. We will notify you when it launches!`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plans & Pricing</Text>
        <Text style={styles.headerSub}>Choose what works for you</Text>
      </View>

      <View style={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>⭐ Upgrade KaliMed</Text>
          <Text style={styles.heroDesc}>Smart features. Flexible choices. Better health for everyone.</Text>
        </View>

        {/* Plans */}
        {plans.map(plan => (
          <TouchableOpacity
            key={plan.id}
            style={[styles.planCard, selected === plan.id && { borderColor: plan.color, borderWidth: 2 }]}
            onPress={() => setSelected(plan.id)}
          >
            {plan.popular && (
              <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                <Text style={styles.popularText}>Best for everyday users</Text>
              </View>
            )}

            <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.planPrice, { color: colors.navBackground }]}>{plan.price}</Text>
              <Text style={styles.planPeriod}>{plan.period}</Text>
            </View>
            <Text style={styles.planDesc}>{plan.desc}</Text>

            <View style={styles.divider} />

            {plan.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark" size={14} color={plan.color} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.planBtn, selected === plan.id
                ? { backgroundColor: plan.color }
                : { backgroundColor: colors.white, borderWidth: 1.5, borderColor: plan.color }
              ]}
              onPress={() => { setSelected(plan.id); handleSubscribe(); }}
            >
              <Text style={[styles.planBtnText, { color: selected === plan.id ? colors.white : plan.color }]}>
                {plan.id === 'free' ? 'Get Started Free' : `Start ${plan.name} — ${plan.price}/mo`}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <Text style={styles.footer}>
          Managed via App Store / Google Play.{'\n'}No account required for free features.
        </Text>
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f5fa',
  },
  header: {
    backgroundColor: colors.navBackground,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  backBtn: {
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: fontSizes.xs,
    color: colors.accentGreenLight,
    fontWeight: '500',
  },
  content: {
    padding: spacing.md,
  },
  hero: {
    backgroundColor: colors.accentGreen,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  heroDesc: {
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  popularBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  popularText: {
    color: colors.white,
    fontSize: fontSizes.xs - 1,
    fontWeight: '700',
  },
  planName: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  planPrice: {
    fontSize: fontSizes.xxxl,
    fontWeight: '800',
    lineHeight: 36,
  },
  planPeriod: {
    fontSize: fontSizes.sm,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  planDesc: {
    fontSize: fontSizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
    alignItems: 'flex-start',
  },
  featureText: {
    fontSize: fontSizes.sm,
    color: colors.text.primary,
    flex: 1,
  },
  planBtn: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  planBtnText: {
    fontWeight: '700',
    fontSize: fontSizes.sm,
  },
  footer: {
    fontSize: fontSizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
  },
});