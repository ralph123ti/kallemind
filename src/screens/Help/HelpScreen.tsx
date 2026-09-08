import React, { useState } from 'react';
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

const faqs = [
  {
    q: 'Is KalleMind a medical app?',
    a: 'No. KalleMind is a health information platform. It provides general health education and tools to help you prepare for doctor visits. It is not a medical service and does not provide diagnoses or treatment.',
  },
  {
    q: 'How does the Symptom Checker work?',
    a: 'The Symptom Checker uses AI to analyze your symptoms and provide an urgency level (Red, Yellow, or Green). This helps you decide whether to seek emergency care, see a doctor soon, or monitor at home. It does not diagnose any condition.',
  },
  {
    q: 'Is my health data private?',
    a: 'Yes. KalleMind does not store or sell your personal health data. Symptom checker sessions are processed in real time and are not saved to any database without your consent.',
  },
  {
    q: 'How do I upgrade to Premium?',
    a: 'Go to the Profile tab and tap "Upgrade to Premium", or tap the green upgrade banner on the Home screen. You can choose between Premium ($5.99/mo) and Pro ($9.99/mo) plans.',
  },
  {
    q: 'Why are articles different in different countries?',
    a: 'KalleMind detects your location and shows health articles relevant to your country or region. This ensures the content is meaningful and applicable to your local health environment.',
  },
  {
    q: 'How do I add a doctor to the directory?',
    a: 'Doctors can apply to be listed by contacting us at kallemind@gmail.com. We verify all healthcare professionals before listing them on the platform.',
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Yes. You can cancel your subscription at any time from the Subscription & Billing section in your Profile. Cancellation takes effect at the end of your current billing period.',
  },
  {
    q: 'The app is not working properly. What do I do?',
    a: 'Try closing and reopening the app. If the issue persists, contact us at kallemind@gmail.com with a description of the problem and we will assist you within 48 hours.',
  },
];

const contactOptions = [
  {
    icon: 'mail-outline' as const,
    label: 'Email Support',
    value: 'kallemind@gmail.com',
    action: () => Linking.openURL('mailto:kallemind@gmail.com?subject=Help & Support'),
    color: colors.accentBlue,
  },
  {
    icon: 'logo-whatsapp' as const,
    label: 'WhatsApp Support',
    value: 'Chat with us on WhatsApp',
    action: () => Linking.openURL('https://wa.me/263783421343?text=Hello KalleMind Support'),
    color: '#25D366',
  },
  {
    icon: 'globe-outline' as const,
    label: 'Visit Website',
    value: 'kallemind.com',
    action: () => Linking.openURL('https://kallemind.com'),
    color: colors.accentGreen,
  },
];

export default function HelpScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <Text style={styles.headerSub}>We're here to help you</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIconBox}>
            <Ionicons name="headset" size={32} color={colors.accentGreen} />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroDesc}>
            Browse the FAQs below or contact our support team directly. We respond within 48 hours.
          </Text>
        </View>

        {/* Contact Options */}
        <Text style={styles.sectionLabel}>Contact Us</Text>
        {contactOptions.map((option, i) => (
          <TouchableOpacity key={i} style={styles.contactCard} onPress={option.action}>
            <View style={[styles.contactIconBox, { backgroundColor: option.color + '22' }]}>
              <Ionicons name={option.icon} size={22} color={option.color} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>{option.label}</Text>
              <Text style={styles.contactValue}>{option.value}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
          </TouchableOpacity>
        ))}

        {/* Response Time */}
        <View style={styles.responseBox}>
          <Ionicons name="time-outline" size={18} color={colors.warning} />
          <Text style={styles.responseText}>
            Average response time: <Text style={{ fontWeight: '700', color: colors.navBackground }}>within 48 hours</Text>
          </Text>
        </View>

        {/* FAQs */}
        <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>
        {faqs.map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={styles.faqCard}
            onPress={() => setOpenFaq(openFaq === i ? null : i)}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              <Ionicons
                name={openFaq === i ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.text.secondary}
              />
            </View>
            {openFaq === i && (
              <Text style={styles.faqAnswer}>{faq.a}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Still need help */}
        <View style={styles.stillNeedHelp}>
          <Text style={styles.stillNeedHelpTitle}>Still need help?</Text>
          <Text style={styles.stillNeedHelpDesc}>
            Can't find what you're looking for? Send us an email and we'll get back to you as soon as possible.
          </Text>
          <TouchableOpacity
            style={styles.emailBtn}
            onPress={() => Linking.openURL('mailto:kallemind@gmail.com?subject=Support Request')}
          >
            <Ionicons name="mail" size={18} color={colors.white} />
            <Text style={styles.emailBtnText}>Send us an Email</Text>
          </TouchableOpacity>
        </View>

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
  heroBanner: { alignItems: 'center', padding: spacing.lg, paddingTop: spacing.xl },
  heroIconBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#e1f5ee', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  heroTitle: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.navBackground, marginBottom: spacing.xs },
  heroDesc: { fontSize: fontSizes.sm, color: colors.text.secondary, textAlign: 'center', lineHeight: 22 },
  sectionLabel: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs, fontSize: fontSizes.xs, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: colors.accentGreen },
  contactCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  contactIconBox: { width: 44, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.navBackground },
  contactValue: { fontSize: fontSizes.xs, color: colors.text.secondary, marginTop: 2 },
  responseBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#fff8e6', borderRadius: borderRadius.md, padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.warning + '44' },
  responseText: { fontSize: fontSizes.xs, color: colors.text.secondary, flex: 1 },
  faqCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  faqQuestion: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.navBackground, flex: 1, lineHeight: 20 },
  faqAnswer: { fontSize: fontSizes.sm, color: colors.text.secondary, lineHeight: 22, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  stillNeedHelp: { backgroundColor: colors.navBackground, borderRadius: borderRadius.lg, padding: spacing.lg, margin: spacing.md, alignItems: 'center' },
  stillNeedHelpTitle: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.white, marginBottom: spacing.xs },
  stillNeedHelpDesc: { fontSize: fontSizes.sm, color: colors.text.nav, textAlign: 'center', lineHeight: 20, marginBottom: spacing.md },
  emailBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.accentGreen, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  emailBtnText: { color: colors.white, fontWeight: '700', fontSize: fontSizes.sm },
  footer: { color: colors.text.secondary, fontSize: fontSizes.xs, textAlign: 'center', marginBottom: spacing.xl, marginTop: spacing.sm },
});