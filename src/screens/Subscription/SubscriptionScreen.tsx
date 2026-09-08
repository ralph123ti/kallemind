import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSizes, borderRadius } from '../../theme';
import { useSubscription } from './useSubscription';
import { useTranslation } from 'react-i18next';

// -----------------------------------------------------------------------
// Patient SKU placeholders — swap for your real App Store Connect /
// Google Play Console product IDs once they're created.
// -----------------------------------------------------------------------
const PLAN_SKUS: Record<string, string> = {
  premium: 'com.yourapp.premium.monthly',
  pro: 'com.yourapp.pro.monthly',
};

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

// Compliance/info cards shown below the plans. Keeping these as short,
// scannable blocks (rather than one big wall of text) matches how the
// pricing cards above are already presented, and mirrors what Apple/Google
// reviewers specifically look for: clear auto-renewal disclosure, a way to
// manage/cancel, and confirmation that no card data is stored by the app.
const infoSections = [
  {
    icon: 'card-outline' as const,
    title: 'Billing & Payments',
    body: 'Payments are securely processed by the Apple App Store or Google Play Store. We do not collect or store any payment card information. Subscriptions are managed entirely through your Apple ID or Google Play account.',
  },
  {
    icon: 'refresh-outline' as const,
    title: 'Auto-Renewal',
    body: 'Subscriptions automatically renew unless canceled at least 24 hours before the renewal date. You can manage or cancel your subscription anytime in your device settings.',
  },
  {
    icon: 'settings-outline' as const,
    title: 'Managing Your Subscription',
    body: Platform.OS === 'ios'
      ? 'iOS: Settings → Apple ID → Subscriptions.'
      : 'Android: Google Play Store → Payments & Subscriptions.',
  },
  {
    icon: 'earth-outline' as const,
    title: 'Pricing Transparency',
    body: 'All prices are clearly displayed in your local currency before purchase. Pricing may vary by region.',
  },
  {
    icon: 'medkit-outline' as const,
    title: 'Important Notice',
    body: 'KalleMind provides general health education only. It does not provide medical diagnosis, treatment recommendations, or emergency medical advice. Always consult a qualified healthcare professional for medical concerns.',
  },
];

export default function SubscriptionScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [selected, setSelected] = React.useState('premium');

  const { purchasing, buy, completePurchase, restore, initError } = useSubscription({
    skus: Object.values(PLAN_SKUS),
    onPurchaseUpdate: async (purchase) => {
      // -----------------------------------------------------------------
      // TODO (backend): send purchase.transactionReceipt (iOS) or
      // purchase.purchaseToken (Android) to your verify-purchase endpoint
      // here. Only call completePurchase once the backend confirms the
      // receipt is valid. For now this completes immediately so you can
      // test the flow before the backend route exists.
      //
      // const verified = await verifyPurchaseOnBackend(purchase);
      // if (verified) await completePurchase(purchase);
      // -----------------------------------------------------------------
      await completePurchase(purchase);
      Alert.alert('Success', 'Your subscription is active!');
    },
    onPurchaseError: (error) => {
      Alert.alert('Purchase Error', error.message);
    },
  });

  const handleSubscribe = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    if (plan.id === 'free') {
      Alert.alert('Free Plan', 'You are already on the free plan!');
      return;
    }

    const sku = PLAN_SKUS[planId];
    try {
      await buy(sku);
    } catch (err: any) {
      Alert.alert('Unable to Start Purchase', err?.message ?? 'Please try again.');
    }
  };

  const handleRestore = async () => {
    try {
      const purchases = await restore();
      const activeSkus = Object.values(PLAN_SKUS);
      const found = purchases.find((p) => activeSkus.includes(p.productId));
      if (found) {
        Alert.alert('Restored', 'Your subscription has been restored.');
      } else {
        Alert.alert('Nothing to Restore', 'No active subscription was found for this account.');
      }
    } catch (err: any) {
      Alert.alert('Restore Failed', err?.message ?? 'Please try again.');
    }
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
          <Text style={styles.heroTitle}>⭐ Upgrade KalleMind</Text>
          <Text style={styles.heroDesc}>
            Access trusted health education content anytime, anywhere. Free and premium tiers, designed to help you understand health and wellness topics simply.
          </Text>
        </View>

        {initError && (
          <Text style={styles.errorText}>Store connection issue: {initError}</Text>
        )}

        {/* Plans */}
        {plans.map(plan => (
          <TouchableOpacity
            key={plan.id}
            activeOpacity={0.8}
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
              onPress={() => { setSelected(plan.id); handleSubscribe(plan.id); }}
              disabled={purchasing}
            >
              {purchasing && selected === plan.id ? (
                <ActivityIndicator color={selected === plan.id ? colors.white : plan.color} />
              ) : (
                <Text style={[styles.planBtnText, { color: selected === plan.id ? colors.white : plan.color }]}>
                  {plan.id === 'free' ? 'Get Started Free' : `Start ${plan.name} — ${plan.price}/mo`}
                </Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore}>
          <Text style={styles.restoreBtnText}>Restore Purchases</Text>
        </TouchableOpacity>

        {/* Compliance / billing info */}
        <Text style={styles.sectionLabel}>Subscription Details</Text>
        <View style={styles.infoContainer}>
          {infoSections.map((section, i) => (
            <View
              key={i}
              style={[styles.infoItem, i < infoSections.length - 1 && styles.infoItemBorder]}
            >
              <Ionicons name={section.icon} size={18} color={colors.accentGreen} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>{section.title}</Text>
                <Text style={styles.infoBody}>{section.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.mission}>
          We believe health education should be simple, accessible, and available globally. Premium subscriptions help us continue improving content and expanding access worldwide.
        </Text>

        <Text style={styles.footer}>
          {t('common.save')}
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
  errorText: {
    fontSize: fontSizes.xs,
    color: '#c0392b',
    marginBottom: spacing.md,
    textAlign: 'center',
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
  restoreBtn: {
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  restoreBtnText: {
    color: colors.accentGreen,
    fontWeight: '600',
    fontSize: fontSizes.xs,
  },
  sectionLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.accentGreen,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  infoContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  infoItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.navBackground,
    marginBottom: 2,
  },
  infoBody: {
    fontSize: fontSizes.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  mission: {
    fontSize: fontSizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  footer: {
    fontSize: fontSizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
  },
});
