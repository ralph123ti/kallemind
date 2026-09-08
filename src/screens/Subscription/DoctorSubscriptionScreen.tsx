import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

// Simple checkmark-style bullet icon using Text (no icon library dependency).
// Swap this for react-native-vector-icons / expo-vector-icons if you already use one.
const Bullet = () => <Text style={styles.bulletIcon}>●</Text>;

type Benefit = {
  title: string;
  description: string;
};

const BENEFITS: Benefit[] = [
  {
    title: 'Increased Online Visibility',
    description: 'Your profile appears in more searches and recommended results.',
  },
  {
    title: 'Verified KaliMed Profile',
    description: 'Build trust with a verified badge that shows you are a registered doctor.',
  },
  {
    title: 'Professional Showcase',
    description: 'Display your qualifications, specialties, services, clinic details, and more.',
  },
  {
    title: 'Users Call You',
    description: 'Users can call you directly from your profile with one tap.',
  },
  {
    title: 'Profile Insights',
    description: 'See how users find you and interact with your profile.',
  },
  {
    title: 'Featured Placement',
    description: 'Stand out with priority placement in relevant categories.',
  },
  {
    title: 'Display Your Availability',
    description: 'Show consultation days and times so users know when to call you.',
  },
  {
    title: 'Website & Social Links',
    description: 'Add your website and social media to connect and grow your practice.',
  },
  {
    title: 'Priority Support',
    description: 'Get faster assistance from our dedicated support team.',
  },
  {
    title: 'Practice Growth',
    description: 'Strengthen your general presence and grow your practice.',
  },
];

type Props = {
  navigation?: any;
  onSubscribe?: () => void;
};

export default function DoctorSubscriptionScreen({ navigation, onSubscribe }: Props) {
  const handleSubscribe = () => {
    if (onSubscribe) {
      onSubscribe();
    } else if (navigation) {
      // Adjust the route name to match whatever your payment/checkout screen is called.
      navigation.navigate('DoctorSubscriptionCheckout');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Text style={styles.title}>Paid Doctor Profile Subscription</Text>
        <Text style={styles.subtitle}>
          Increase your online visibility with a verified KaliMed profile.
        </Text>
        <Text style={styles.description}>
          Help users discover your practice more easily, showcase your professional
          information, and strengthen your digital presence.
        </Text>

        {/* Price card */}
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>$20</Text>
            <View>
              <Text style={styles.priceLabel}>PER MONTH</Text>
              <Text style={styles.priceSubLabel}>BILLED MONTHLY</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.verifiedRow}>
            <Text style={styles.verifiedIcon}>🛡️</Text>
            <View>
              <Text style={styles.verifiedTitle}>100% VERIFIED PROFESSIONAL PROFILE</Text>
              <Text style={styles.verifiedSubtitle}>Every doctor. No free version.</Text>
            </View>
          </View>
        </View>

        {/* Benefits */}
        <Text style={styles.sectionHeading}>What You Get With Your Paid Doctor Profile</Text>
        <View style={styles.benefitsGrid}>
          {BENEFITS.map((benefit) => (
            <View style={styles.benefitCard} key={benefit.title}>
              <View style={styles.benefitIconWrap}>
                <Bullet />
              </View>
              <View style={styles.benefitTextWrap}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Callout */}
        <View style={styles.callout}>
          <Text style={styles.calloutIcon}>🛡️</Text>
          <Text style={styles.calloutText}>
            This is more than a listing — it's your professional presence platform.{'\n'}
            Showcase. Connect. Grow.
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.ctaButton} onPress={handleSubscribe} activeOpacity={0.85}>
          <Text style={styles.ctaButtonText}>Get Started Today</Text>
          <Text style={styles.ctaButtonSubtext}>Activate your paid doctor profile now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const TEAL = '#0F4C4C';
const TEAL_DARK = '#0A3535';
const GOLD = '#D4A537';
const CREAM = '#FBF6EA';
const TEXT_DARK = '#1C2B2B';
const TEXT_MUTED = '#5B6B6B';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TEAL,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: TEXT_MUTED,
    lineHeight: 20,
    marginBottom: 20,
  },
  priceCard: {
    backgroundColor: TEAL,
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 12,
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  priceSubLabel: {
    fontSize: 11,
    color: '#CFE3E3',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: 14,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  verifiedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedSubtitle: {
    fontSize: 11,
    color: '#CFE3E3',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: TEAL_DARK,
    marginBottom: 14,
  },
  benefitsGrid: {
    marginBottom: 20,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  benefitIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bulletIcon: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  benefitTextWrap: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    lineHeight: 18,
  },
  callout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CREAM,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EADFC2',
    padding: 16,
    marginBottom: 24,
  },
  calloutIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  calloutText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
    lineHeight: 19,
  },
  ctaButton: {
    backgroundColor: GOLD,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: TEAL_DARK,
  },
  ctaButtonSubtext: {
    fontSize: 12,
    color: TEAL_DARK,
    marginTop: 2,
  },
});
