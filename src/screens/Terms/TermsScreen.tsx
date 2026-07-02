import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSizes, borderRadius } from '../../theme';

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: 'By downloading, installing, or using the KalleMind application, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the app.',
  },
  {
    title: '2. What KalleMind Is',
    content: 'KalleMind is a health information platform designed to provide general health education, wellness guidance, and tools to help users prepare for medical consultations. KalleMind is NOT a medical service, clinic, or healthcare provider.',
  },
  {
    title: '3. No Medical Advice',
    content: 'All content on KalleMind — including articles, symptom checker results, and doctor prep sheets — is for general educational purposes only. Nothing in this app constitutes medical advice, diagnosis, or treatment. Always consult a qualified and licensed healthcare professional for any medical concerns.',
  },
  {
    title: '4. Symptom Checker Disclaimer',
    content: 'The AI-powered Symptom Checker provides urgency triage guidance only. Results are not a medical diagnosis. The urgency levels (Red, Yellow, Green) are informational indicators to help you decide whether to seek care urgently. They do not replace a doctor\'s evaluation. KalleMind is not responsible for any health decisions made based on Symptom Checker results.',
  },
  {
    title: '5. User Responsibilities',
    content: 'You agree to:\n• Always seek professional medical help in emergencies\n• Not rely solely on KalleMind for health decisions\n• Provide accurate information when using app features\n• Use the app only for lawful purposes\n• Not misuse or attempt to reverse-engineer the app',
  },
  {
    title: '6. Doctor Directory',
    content: 'KalleMind does not employ, endorse, verify, or take responsibility for any healthcare professional listed in the Doctor Directory. Information about doctors is provided for convenience only. Users contact doctors entirely at their own discretion and risk. Always verify a doctor\'s credentials independently.',
  },
  {
    title: '7. Privacy & Data',
    content: 'KalleMind collects minimal data necessary to provide the service. We do not sell your personal health data to third parties. Symptom checker sessions may be processed by AI services to generate responses. By using the app, you consent to this processing. We store only what is necessary and protect your data in accordance with applicable privacy laws.',
  },
  {
    title: '8. Subscription & Payments',
    content: 'KalleMind offers Free, Premium ($5.99/mo), and Pro ($9.99/mo) plans. Subscriptions are billed monthly and can be cancelled at any time. Cancellation takes effect at the end of the current billing period. Refunds are issued at our discretion in cases of technical failure. All payments are processed securely through Stripe.',
  },
  {
    title: '9. Limitation of Liability',
    content: 'KalleMind and its developers shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of the app. This includes but is not limited to health outcomes, reliance on app content, or inability to access the service. You use KalleMind entirely at your own risk.',
  },
  {
    title: '10. Changes to Terms',
    content: 'KalleMind reserves the right to update these Terms and Conditions at any time. Continued use of the app after changes constitutes your acceptance of the updated terms. We will notify users of significant changes through the app.',
  },
  {
    title: '11. Contact Us',
    content: 'If you have any questions about these Terms and Conditions, please contact us at kallemind@gmail.com. We aim to respond within 48 hours.',
  },
];

export default function TermsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <Text style={styles.headerSub}>Last updated: July 2026</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Intro */}
        <View style={styles.introBanner}>
          <Ionicons name="shield-checkmark" size={24} color={colors.accentGreen} />
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitle}>Please read carefully</Text>
            <Text style={styles.introDesc}>
              These terms govern your use of KalleMind. By using the app you agree to all terms below.
            </Text>
          </View>
        </View>

        {/* Sections */}
        {sections.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        {/* Contact Button */}
        <TouchableOpacity
          style={styles.contactBtn}
          onPress={() => Linking.openURL('mailto:kallemind@gmail.com?subject=Terms & Conditions Query')}
        >
          <Ionicons name="mail-outline" size={18} color={colors.white} />
          <Text style={styles.contactBtnText}>Contact Us — kallemind@gmail.com</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>KalleMind v1.0.0 · Your Health. Connected.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f5fa' },
  header: { backgroundColor: colors.navBackground, padding: spacing.lg },
  backBtn: { marginBottom: spacing.sm },
  headerTitle: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.white, marginBottom: 2 },
  headerSub: { fontSize: fontSizes.xs, color: colors.accentGreenLight, fontWeight: '500' },
  introBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: '#e1f5ee',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    margin: spacing.md,
    borderWidth: 1,
    borderColor: colors.accentGreen + '44',
  },
  introTitle: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.navBackground, marginBottom: 2 },
  introDesc: { fontSize: fontSizes.xs, color: colors.text.secondary, lineHeight: 18 },
  section: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.navBackground,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    fontSize: fontSizes.sm,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentGreen,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  contactBtnText: { color: colors.white, fontSize: fontSizes.sm, fontWeight: '700' },
  footer: { color: colors.text.secondary, fontSize: fontSizes.xs, textAlign: 'center', marginBottom: spacing.xl },
});