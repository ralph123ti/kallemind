import React, { useCallback, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, fontSizes, borderRadius } from '../../theme';
import { MONTHLY_USES_KEY, HAS_UNREAD_NOTIFS_KEY, FREE_MONTHLY_LIMIT } from '../../store/storageKeys';

// Moved inside a function (instead of a module-level const) because it now
// depends on `t`, which is only available once useTranslation() runs inside
// the component. Called once per render via getQuickActions(t) below.
function getQuickActions(t: (key: string) => string) {
  return [
    {
      label: t('symptomChecker'),
      sub: t('symptomCheckerSub'),
      icon: 'search',
      screen: 'Checker',
      params: { mode: 'symptom' },
      badge: t('noDiagnosis'),
      color: '#1e6ab0',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400',
    },
    {
      label: t('doctorPrepSheet'),
      sub: t('doctorPrepSheetSub'),
      icon: 'clipboard',
      screen: 'Checker',
      params: { mode: 'prep' },
      badge: t('onDevice'),
      color: '#0f6e56',
      image: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400',
    },
    {
      label: t('findDoctors'),
      sub: t('findDoctorsSub'),
      icon: 'people',
      screen: 'Doctors',
      params: undefined,
      badge: t('verified'),
      color: '#1d9e75',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
    },
    {
      label: t('healthArticles'),
      sub: t('healthArticlesSub'),
      icon: 'book',
      screen: 'Articles',
      params: undefined,
      badge: t('articles20'),
      color: '#9F7AEA',
      image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=400',
    },
  ];
}

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const limit = FREE_MONTHLY_LIMIT;
  const quickActions = getQuickActions(t);

  const [uses, setUses] = useState(0);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      (async () => {
        try {
          const storedUses = await AsyncStorage.getItem(MONTHLY_USES_KEY);
          if (isActive) {
            setUses(storedUses ? parseInt(storedUses, 10) || 0 : 0);
          }
        } catch {
          if (isActive) setUses(0);
        }

        try {
          const storedFlag = await AsyncStorage.getItem(HAS_UNREAD_NOTIFS_KEY);
          if (isActive) {
            setHasUnreadNotifications(storedFlag === 'true');
          }
        } catch {
          if (isActive) setHasUnreadNotifications(false);
        }
      })();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const pct = Math.min((uses / limit) * 100, 100);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Dark Navy Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.logoRow}>
          {/* White patch behind the logo so it doesn't blend into the dark header */}
          <View style={styles.logoImgWrap}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <View style={styles.logoTextBox}>
            <Text style={styles.logoText} numberOfLines={1}>
              Kalle<Text style={styles.logoGreen}>Mind</Text>
            </Text>
            {/* Brand name "KalleMind" is intentionally NOT translated */}
            <Text style={styles.logoTag} numberOfLines={1}>{t('appTagline')}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => navigation.navigate('Checker', { mode: 'symptom' })}
              accessibilityRole="button"
              accessibilityLabel={t('symptomChecker')}
            >
              <Ionicons name="search" size={18} color={colors.text.nav} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => navigation.navigate('Notifications')}
              accessibilityRole="button"
              accessibilityLabel={t('notifications')}
            >
              <Ionicons name="notifications" size={18} color={colors.text.nav} />
              {hasUnreadNotifications && <View style={styles.notifDot} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{t('heroBadge')}</Text>
          </View>
          <Text style={styles.heroTitle}>{t('heroTitle')}{'\n'}<Text style={styles.heroTitleGreen}>{t('heroGlobal')}</Text></Text>
          <Text style={styles.heroSub}>{t('heroSub')}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum} numberOfLines={1} adjustsFontSizeToFit>{Math.max(limit - uses, 0)}</Text>
              <Text style={styles.statLbl} numberOfLines={2}>{t('freeChecks')}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum} numberOfLines={1} adjustsFontSizeToFit>Free</Text>
              <Text style={styles.statLbl} numberOfLines={2}>{t('noLogin')}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum} numberOfLines={1} adjustsFontSizeToFit>100%</Text>
              <Text style={styles.statLbl} numberOfLines={2}>{t('anonymous')}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          <Text style={styles.disclaimerBold}>⚠️ </Text>
          {t('disclaimer')}
        </Text>
      </View>

      {/* Usage Bar */}
      <View style={styles.usageBox}>
        <View style={styles.usageTop}>
          <Text style={styles.usageLbl}>{t('monthlyUses')}</Text>
          <Text style={styles.usageCt}>{uses} / {limit}</Text>
        </View>
        <View style={styles.ubar}>
          <View style={[styles.ufill, { width: `${pct}%` as any, backgroundColor: uses >= limit ? colors.error : uses === limit - 1 ? colors.warning : colors.accentGreen }]} />
        </View>
      </View>

      {/* Upgrade Strip */}
      <TouchableOpacity
        style={styles.upgradeStrip}
        onPress={() => navigation.navigate('Subscription')}
        accessibilityRole="button"
        accessibilityLabel={t('unlockAccess')}
      >
        <Text style={styles.upgradeStripTitle}>{t('unlockAccess')}</Text>
        {/* Prices stay as raw numbers/currency — not translated, but the
            surrounding wording ("month", "Pro") now comes from t() if you
            want it localized. Kept as-is here since the original had it
            hardcoded with special spacing; wire up `t('perMonth')`-style
            keys later if you want the whole sentence localized. */}
        <Text style={styles.upgradeStripSub}>
          $5.99{'\u00A0/\u00A0'}month{'\u00A0·\u00A0'}$9.99{'\u00A0/\u00A0'}month Pro
        </Text>
        <View style={styles.upgradeStripBtn}>
          <Text style={styles.upgradeStripBtnText}>{t('upgrade')}</Text>
        </View>
      </TouchableOpacity>

      {/* Section Label */}
      <Text style={styles.sectionLbl}>{t('coreTools')}</Text>

      {/* Quick Actions Grid with Images */}
      <View style={styles.grid}>
        {quickActions.map((action, i) => (
          <TouchableOpacity
            key={i}
            style={styles.qcard}
            onPress={() => navigation.navigate(action.screen, action.params)}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            accessibilityHint={action.sub}
          >
            <Image
              source={{ uri: action.image }}
              style={styles.qcardImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
              style={styles.qcardScrimTop}
              pointerEvents="none"
            />
            <View style={[styles.qcardAccentStrip, { backgroundColor: action.color }]} />
            <View style={[styles.qcardIconOnImage, { backgroundColor: action.color }]}>
              <Ionicons name={action.icon as any} size={20} color={colors.white} />
            </View>
            <View style={styles.qcardBadgeOnImage}>
              <Text style={styles.qcardBadgeOnImageText}>{action.badge}</Text>
            </View>
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
  // White circular patch behind the logo image so it doesn't blend into the dark header
  logoImgWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: { width: 34, height: 34, borderRadius: 4 },
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
  statsRow: { flexDirection: 'row', width: '100%' },
  stat: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 2 },
  statNum: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.accentGreen },
  statLbl: { fontSize: fontSizes.xs, color: colors.text.muted, marginTop: 1, textAlign: 'center', width: '100%' },
  disclaimer: { backgroundColor: '#fff8e6', borderLeftWidth: 3, borderLeftColor: colors.warning, padding: spacing.sm, margin: spacing.md, borderRadius: borderRadius.sm },
  disclaimerText: { fontSize: fontSizes.xs, color: '#5a3e00', lineHeight: 18 },
  disclaimerBold: { fontWeight: '700' },
  disclaimerEmphasis: { fontWeight: '700', color: '#3d2c00' },
  usageBox: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  usageTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  usageLbl: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.text.primary },
  usageCt: { fontSize: fontSizes.xs, color: colors.text.secondary },
  ubar: { height: 6, backgroundColor: colors.border, borderRadius: borderRadius.full, overflow: 'hidden' },
  ufill: { height: '100%', borderRadius: borderRadius.full },
  upgradeStrip: {
    backgroundColor: colors.accentGreen,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  upgradeStripTitle: { color: colors.white, fontSize: fontSizes.sm, fontWeight: '700' },
  upgradeStripSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: fontSizes.xs,
    marginTop: 1,
    marginBottom: spacing.sm,
  },
  upgradeStripBtn: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  upgradeStripBtnText: { color: colors.accentGreenDark, fontSize: fontSizes.xs, fontWeight: '700' },
  sectionLbl: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm, fontSize: fontSizes.xs, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: colors.accentGreen },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, gap: spacing.sm },
  qcard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, width: '47%', overflow: 'hidden' },
  qcardImage: { width: '100%', height: 90, backgroundColor: colors.border },
  qcardScrimTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 60 },
  qcardAccentStrip: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  qcardIconOnImage: { position: 'absolute', top: spacing.sm + 2, left: spacing.sm, width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  qcardBadgeOnImage: { position: 'absolute', top: spacing.sm + 2, right: spacing.sm, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: borderRadius.full, paddingHorizontal: spacing.xs, paddingVertical: 2 },
  qcardBadgeOnImageText: { color: colors.white, fontSize: fontSizes.xs - 2, fontWeight: '700' },
  qcardContent: { padding: spacing.sm },
  qcardTitle: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.navBackground, marginBottom: 2 },
  qcardSub: { fontSize: fontSizes.xs - 1, color: colors.text.secondary, lineHeight: 14 },
});
