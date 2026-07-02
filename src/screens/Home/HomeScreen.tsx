import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSizes, borderRadius } from '../../theme';

const quickActions = [
  {
    label: 'Symptom Checker',
    sub: 'Type symptoms → urgency + doctor questions',
    icon: 'search',
    screen: 'Checker',
    badge: 'No diagnosis',
    color: '#1e6ab0',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400',
  },
  {
    label: 'Doctor Prep Sheet',
    sub: 'Auto timeline + checklist to screenshot',
    icon: 'clipboard',
    screen: 'Checker',
    badge: 'On device',
    color: '#0f6e56',
    image: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400',
  },
  {
    label: 'Find Doctors',
    sub: 'Browse profiles, book appointments',
    icon: 'people',
    screen: 'Doctors',
    badge: 'Verified',
    color: '#1d9e75',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
  },
  {
    label: 'Health Articles',
    sub: 'Vetted education-only content',
    icon: 'book',
    screen: 'Articles',
    badge: '20 articles',
    color: '#9F7AEA',
    image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=400',
  },
];

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [uses] = useState(0);
  const limit = 3;
  const pct = Math.min((uses / limit) * 100, 100);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Dark Navy Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.logoRow}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <View style={styles.logoTextBox}>
            <Text style={styles.logoText} numberOfLines={1}>
              Kalle<Text style={styles.logoGreen}>Mind</Text>
            </Text>
            <Text style={styles.logoTag} numberOfLines={1}>Discover. Learn. Connect.</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Articles')}>
              <Ionicons name="search" size={18} color={colors.text.nav} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="notifications" size={18} color={colors.text.nav} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>🌍 150+ Countries · Free · No Sign-Up</Text>
          </View>
          <Text style={styles.heroTitle}>Smart Health Info.{'\n'}<Text style={styles.heroTitleGreen}>Global Access.</Text></Text>
          <Text style={styles.heroSub}>Reliable health guidance and doctor tools — anytime, anywhere.</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum} numberOfLines={1} adjustsFontSizeToFit>{Math.max(limit - uses, 0)}</Text>
              <Text style={styles.statLbl} numberOfLines={2}>Free checks left</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum} numberOfLines={1} adjustsFontSizeToFit>Free</Text>
              <Text style={styles.statLbl} numberOfLines={2}>No login needed</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum} numberOfLines={1} adjustsFontSizeToFit>100%</Text>
              <Text style={styles.statLbl} numberOfLines={2}>Anonymous</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          <Text style={styles.disclaimerBold}>⚠️ </Text>
          KalleMind provides health <Text style={styles.disclaimerEmphasis}>information only</Text>. Not medical advice. Always consult a licensed healthcare professional.
        </Text>
      </View>

      {/* Usage Bar */}
      <View style={styles.usageBox}>
        <View style={styles.usageTop}>
          <Text style={styles.usageLbl}>Monthly Free Uses</Text>
          <Text style={styles.usageCt}>{uses} / {limit} used</Text>
        </View>
        <View style={styles.ubar}>
          <View style={[styles.ufill, { width: `${pct}%` as any, backgroundColor: uses >= limit ? colors.error : uses === limit - 1 ? colors.warning : colors.accentGreen }]} />
        </View>
      </View>

      {/* Upgrade Strip */}
      <TouchableOpacity style={styles.upgradeStrip} onPress={() => navigation.navigate('Subscription')}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.upgradeStripTitle}>Unlock Unlimited Access</Text>
          <Text style={styles.upgradeStripSub}>$5.99/mo · $9.99/mo Pro</Text>
        </View>
        <View style={styles.upgradeStripBtn}>
          <Text style={styles.upgradeStripBtnText}>Upgrade</Text>
        </View>
      </TouchableOpacity>

      {/* Section Label */}
      <Text style={styles.sectionLbl}>Core Tools</Text>

      {/* Quick Actions Grid with Images */}
      <View style={styles.grid}>
        {quickActions.map((action, i) => (
          <TouchableOpacity
            key={i}
            style={styles.qcard}
            onPress={() => navigation.navigate(action.screen)}
          >
            {/* Card Image */}
            <Image
              source={{ uri: action.image }}
              style={styles.qcardImage}
              resizeMode="cover"
            />
            {/* Fixed neutral dark fade (not tied to action.color) so the icon and badge
                read the same way on every card, regardless of how bright/light the
                underlying photo is — but fading to transparent instead of a hard bar,
                so it reads as a natural photo shade rather than a slapped-on overlay */}
            <LinearGradient
              colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
              style={styles.qcardScrimTop}
              pointerEvents="none"
            />
            {/* Thin accent-color strip at the very top, so each card still keeps
                its own identity/color without covering the photo or the text */}
            <View style={[styles.qcardAccentStrip, { backgroundColor: action.color }]} />
            {/* Icon on image */}
            <View style={[styles.qcardIconOnImage, { backgroundColor: action.color }]}>
              <Ionicons name={action.icon as any} size={20} color={colors.white} />
            </View>
            {/* Badge on image */}
            <View style={styles.qcardBadgeOnImage}>
              <Text style={styles.qcardBadgeOnImageText}>{action.badge}</Text>
            </View>
            {/* Content below image */}
            <View style={styles.qcardContent}>
              <Text style={styles.qcardTitle}>{action.label}</Text>
              <Text style={styles.qcardSub} numberOfLines={2}>{action.sub}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.navBackground },
  logoRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  logoImg: { width: 36, height: 36, borderRadius: 6 },
  logoTextBox: { flex: 1, minWidth: 0 },
  logoText: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.white, lineHeight: 20 },
  logoGreen: { color: colors.accentGreen },
  logoTag: { fontSize: fontSizes.xs - 1, color: colors.accentGreenLight, fontWeight: '500' },
  headerIcons: { flexDirection: 'row', flexShrink: 0, gap: spacing.sm },
  headerIcon: { padding: spacing.xs, position: 'relative' },
  notifDot: { position: 'absolute', top: 2, right: 2, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accentGreen },
  hero: { padding: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.lg, alignItems: 'center' },
  heroBadge: { backgroundColor: 'rgba(29,158,117,0.2)', borderWidth: 1, borderColor: 'rgba(29,158,117,0.4)', borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginBottom: spacing.sm },
  heroBadgeText: { color: colors.accentGreenLight, fontSize: fontSizes.xs, fontWeight: '700', letterSpacing: 0.5 },
  heroTitle: { fontSize: fontSizes.xxl, fontWeight: '800', color: colors.white, textAlign: 'center', lineHeight: 30, marginBottom: spacing.sm },
  heroTitleGreen: { color: colors.accentGreen },
  heroSub: { fontSize: fontSizes.sm, color: colors.text.nav, textAlign: 'center', lineHeight: 20, marginBottom: spacing.md },
  // space-between + flex:1 on each stat gives long labels ("100% / Anonymous") room to wrap
  // instead of clipping against their neighbor
  statsRow: { flexDirection: 'row', width: '100%' },
  // minWidth: 0 is the key fix — without it, a flex row child in RN can refuse to
  // shrink below its content's natural (unwrapped) width, which is what was
  // pushing "Anonymous" past the edge of its column and clipping it.
  stat: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 2 },
  statNum: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.accentGreen },
  statLbl: { fontSize: fontSizes.xs, color: colors.text.muted, marginTop: 1, textAlign: 'center', width: '100%' },
  disclaimer: { backgroundColor: '#fff8e6', borderLeftWidth: 3, borderLeftColor: colors.warning, padding: spacing.sm, margin: spacing.md, borderRadius: borderRadius.sm },
  disclaimerText: { fontSize: fontSizes.xs, color: '#5a3e00', lineHeight: 18 },
  disclaimerBold: { fontWeight: '700' },
  // was fontStyle: 'italic' — custom fonts usually don't ship an italic weight,
  // so RN silently swapped in the system italic font for just this word.
  // Using weight + color keeps the same font family throughout.
  disclaimerEmphasis: { fontWeight: '700', color: '#3d2c00' },
  usageBox: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  usageTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  usageLbl: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.text.primary },
  usageCt: { fontSize: fontSizes.xs, color: colors.text.secondary },
  ubar: { height: 6, backgroundColor: colors.border, borderRadius: borderRadius.full, overflow: 'hidden' },
  ufill: { height: '100%', borderRadius: borderRadius.full },
  upgradeStrip: { backgroundColor: colors.accentGreen, borderRadius: borderRadius.md, padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  upgradeStripTitle: { color: colors.white, fontSize: fontSizes.sm, fontWeight: '700' },
  upgradeStripSub: { color: 'rgba(255,255,255,0.75)', fontSize: fontSizes.xs, marginTop: 1 },
  upgradeStripBtn: { backgroundColor: colors.white, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, flexShrink: 0 },
  upgradeStripBtnText: { color: colors.accentGreenDark, fontSize: fontSizes.xs, fontWeight: '700' },
  sectionLbl: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm, fontSize: fontSizes.xs, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: colors.accentGreen },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, gap: spacing.sm },
  qcard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, width: '47%', overflow: 'hidden' },
  qcardImage: { width: '100%', height: 90, backgroundColor: colors.border },
  // fixed, photo-independent dark-to-transparent fade behind the icon/badge row — this is
  // what guarantees consistent contrast on every card instead of contrast varying with each
  // card's own accent color and photo brightness. Taller than the icon/badge row itself so
  // the gradient has room to fully fade out before it would otherwise look like a hard edge.
  qcardScrimTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 60 },
  // a slim strip of the card's own color along the very top edge, so cards keep their
  // individual identity without tinting the photo or reducing text contrast
  qcardAccentStrip: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  // solid (not translucent) icon chip in the card's accent color — always high-contrast
  // against the white icon, regardless of the photo underneath
  qcardIconOnImage: { position: 'absolute', top: spacing.sm + 2, left: spacing.sm, width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  qcardBadgeOnImage: { position: 'absolute', top: spacing.sm + 2, right: spacing.sm, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: borderRadius.full, paddingHorizontal: spacing.xs, paddingVertical: 2 },
  qcardBadgeOnImageText: { color: colors.white, fontSize: fontSizes.xs - 2, fontWeight: '700' },
  qcardContent: { padding: spacing.sm },
  qcardTitle: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.navBackground, marginBottom: 2 },
  qcardSub: { fontSize: fontSizes.xs - 1, color: colors.text.secondary, lineHeight: 14 },
});
