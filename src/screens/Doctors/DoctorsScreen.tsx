import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  ActivityIndicator,
  Image,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fontSizes, borderRadius } from '../../theme';
import { supabase } from '../../api/supabase';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type WheelchairAccess = 'yes' | 'no' | 'partial';
type RampsParking = 'available' | 'not_available';
type SignLanguageSupport = 'available' | 'on_request' | 'not_available';

interface AccessibilityInfo {
  wheelchairAccess: WheelchairAccess;
  rampsParking: RampsParking;
  signLanguageSupport: SignLanguageSupport;
  other?: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  clinic: string;
  phone: string;
  whatsapp: string;
  photo_url: string;
  verified: boolean;
  // Comes from the `accessibility` jsonb column in Supabase. Optional
  // because older/unlisted doctor rows may not have it filled in yet.
  // NOTE: jsonb has no schema validation, so this can also contain
  // malformed data (typos, missing keys, wrong types) — never trust its
  // shape blindly. See AccessibilityList below for the defensive handling.
  accessibility?: AccessibilityInfo;
}

// IMPORTANT: `key` stays in English because it's matched against the
// `specialty` value stored in Supabase (DB data isn't translated). `labelKey`
// is what gets translated and shown to the user. Never swap these — filtering
// would silently break the moment the app runs in a non-English language.
const specialties = [
  { key: 'All', labelKey: 'specialtyAll' },
  { key: 'General', labelKey: 'specialtyGeneral' },
  { key: 'Cardiology', labelKey: 'specialtyCardiology' },
  { key: 'Paediatrics', labelKey: 'specialtyPaediatrics' },
  { key: 'Dermatology', labelKey: 'specialtyDermatology' },
  { key: 'Mental Health', labelKey: 'specialtyMentalHealth' },
];

const sanitizePhone = (value?: string | null) => (value ? value.replace(/\D/g, '') : '');

// ---------------------------------------------------------------------
// Regulatory / verification disclaimer, shown once at the top of the
// Doctors Directory, above the search bar. Every string goes through
// `t()` with an English fallback, matching the rest of this file's
// i18n convention — translate these keys in your locale files whenever
// you're ready; until then the fallback text below is what renders.
// ---------------------------------------------------------------------
function DirectoryDisclaimer({ t }: { t: (k: string, d?: string) => string }) {
  return (
    <View style={styles.disclaimerBox}>
      <Text style={styles.disclaimerTitle}>{t('directoryDisclaimerTitle', 'DISCLAIMER')}</Text>

      <Text style={styles.disclaimerParagraph}>
        {t(
          'directoryDisclaimerIntro',
          'KalleMind is an independent information directory only. We do not provide medical, veterinary diagnosis, treatment, or telemedicine services.'
        )}
      </Text>

      <Text style={styles.disclaimerParagraph}>
        {t(
          'directoryDisclaimerVerification',
          'All human healthcare practitioners listed are verified against the Medical and Dental Practitioners Council of Zimbabwe / Health Professions Authority registers. All veterinary practitioners listed are verified against the Veterinarians Council of Zimbabwe register.'
        )}
      </Text>

      <Text style={styles.disclaimerParagraph}>
        {t(
          'directoryDisclaimerEndorsement',
          'Listing on KalleMind does not constitute endorsement by MOHCC, HPA, MDPCZ, or VCZ. Practitioner information is provided by the practitioners and verified against public registers. We remove any practitioner immediately upon notification of suspension or deregistration by the relevant council.'
        )}
      </Text>

      <Text style={styles.disclaimerParagraph}>
        {t(
          'directoryDisclaimerEmergency',
          'For medical or veterinary emergencies, please contact your nearest hospital, clinic, or registered practitioner directly.'
        )}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------
// Accessibility section.
// Collapsed by default to a single compact summary bar (icon + title +
// a quick "N of 3 available" hint + chevron), so clinic cards stay short
// and scannable. Tapping the bar expands it to the full icon + label +
// color-coded status pill breakdown, and tapping again collapses it back.
//
// DEFENSIVE HANDLING: the `accessibility` column is raw jsonb with no
// schema validation in Supabase, so any field can be missing, misspelled
// ("Yes" instead of "yes"), or the wrong type. `safeStatus()` looks the
// raw value up in a known-value map and falls back to a neutral
// "Not specified" status for anything unrecognized, instead of crashing.
// ---------------------------------------------------------------------

type AccessLevel = 'positive' | 'partial' | 'negative' | 'unknown';

type AccessStatus = { label: string; level: AccessLevel };

const accessLevelStyle: Record<AccessLevel, { color: string; bg: string }> = {
  positive: { color: colors.accentGreen, bg: colors.accentGreen + '1A' },
  partial: { color: colors.warning, bg: colors.warning + '1A' },
  negative: { color: colors.text.secondary, bg: colors.text.secondary + '15' },
  unknown: { color: colors.text.secondary, bg: colors.text.secondary + '15' },
};

// Looks up `value` in `statuses`, falling back to a safe "unknown" status
// if the value is missing, not a string, or doesn't match any known key.
// This is what stops a bad Supabase value from crashing the render.
function safeStatus<T extends string>(
  statuses: Record<T, AccessStatus>,
  value: unknown,
  fallback: AccessStatus
): AccessStatus {
  if (typeof value === 'string' && Object.prototype.hasOwnProperty.call(statuses, value)) {
    return statuses[value as T];
  }
  return fallback;
}

function AccessibilityList({ info, t }: { info: AccessibilityInfo; t: (k: string, d?: string) => string }) {
  const [expanded, setExpanded] = useState(false);

  // Drives two things: the chevron's rotation (0 -> 180deg) and the
  // details block's fade/slide-in. Kept in a ref so the same Animated.Value
  // persists across re-renders instead of being recreated each time.
  const animProgress = useRef(new Animated.Value(0)).current;

  // Guard against the column containing something that isn't a plain
  // object at all (e.g. a raw string or array pasted in by mistake).
  if (!info || typeof info !== 'object') {
    return null;
  }

  const unknownStatus: AccessStatus = { label: t('accessNotSpecified', 'Not specified'), level: 'unknown' };

  const wheelchairStatuses: Record<WheelchairAccess, AccessStatus> = {
    yes: { label: t('accessYes', 'Yes'), level: 'positive' },
    partial: { label: t('accessPartial', 'Partial'), level: 'partial' },
    no: { label: t('accessNo', 'No'), level: 'negative' },
  };
  const rampsStatuses: Record<RampsParking, AccessStatus> = {
    available: { label: t('accessAvailable', 'Available'), level: 'positive' },
    not_available: { label: t('accessNotAvailable', 'Not Available'), level: 'negative' },
  };
  const signStatuses: Record<SignLanguageSupport, AccessStatus> = {
    available: { label: t('accessAvailable', 'Available'), level: 'positive' },
    on_request: { label: t('accessOnRequest', 'On Request'), level: 'partial' },
    not_available: { label: t('accessNotAvailable', 'Not Available'), level: 'negative' },
  };

  const otherText = typeof info.other === 'string' && info.other.trim() ? info.other.trim() : null;

  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; status: AccessStatus }[] = [
    {
      icon: 'body-outline',
      label: t('accessWheelchairLabel', 'Wheelchair Access'),
      status: safeStatus(wheelchairStatuses, info.wheelchairAccess, unknownStatus),
    },
    {
      icon: 'car-outline',
      label: t('accessRampsLabel', 'Ramps & Parking'),
      status: safeStatus(rampsStatuses, info.rampsParking, unknownStatus),
    },
    {
      icon: 'chatbubble-ellipses-outline',
      label: t('accessSignLabel', 'Sign Language Support'),
      status: safeStatus(signStatuses, info.signLanguageSupport, unknownStatus),
    },
  ];

  // Quick "N of 3 available" hint shown on the collapsed summary bar so
  // there's still useful info at a glance before the person taps to expand.
  const positiveCount = rows.filter(r => r.status.level === 'positive').length;
  const summaryHint = t('accessSummaryCount', `${positiveCount} of ${rows.length} available`).replace(
    '${positiveCount}',
    String(positiveCount)
  ).replace('${rows.length}', String(rows.length));

  const toggle = () => {
    // Smooth height/layout change for the card growing or shrinking.
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = !expanded;
    setExpanded(next);
    // Chevron rotates and details fade+slide in over the same 220ms, using
    // the native driver so it stays smooth even while LayoutAnimation is
    // also mid-flight.
    Animated.timing(animProgress, {
      toValue: next ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const chevronRotation = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const detailsOpacity = animProgress;
  const detailsTranslateY = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 0],
  });

  return (
    <View style={styles.accessSection}>
      <TouchableOpacity
        style={styles.accessSummaryBar}
        onPress={toggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={t('accessSectionTitle', 'Accessibility')}
      >
        <View style={styles.accessSectionHeader}>
          <Ionicons name="accessibility" size={16} color={colors.accentGreen} />
          <Text style={styles.accessSectionTitle}>{t('accessSectionTitle', 'Accessibility')}</Text>
        </View>
        <View style={styles.accessSummaryRight}>
          {!expanded && <Text style={styles.accessSummaryHint}>{summaryHint}</Text>}
          <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
            <Ionicons name="chevron-down" size={16} color={colors.text.secondary} />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View
          style={[
            styles.accessDetails,
            { opacity: detailsOpacity, transform: [{ translateY: detailsTranslateY }] },
          ]}
        >
          {rows.map((row, i) => {
            const { color, bg } = accessLevelStyle[row.status.level];
            return (
              <View key={i} style={styles.accessRow}>
                <View style={[styles.accessIconBadge, { backgroundColor: bg }]}>
                  <Ionicons name={row.icon} size={16} color={color} />
                </View>
                <Text style={styles.accessRowLabel} numberOfLines={1}>
                  {row.label}
                </Text>
                <View style={[styles.accessStatusPill, { backgroundColor: bg }]}>
                  <Text style={[styles.accessStatusText, { color }]} numberOfLines={1}>
                    {row.status.label}
                  </Text>
                </View>
              </View>
            );
          })}

          <View style={styles.accessOtherRow}>
            <View style={[styles.accessIconBadge, { backgroundColor: colors.accentBlue + '1A' }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.accentBlue} />
            </View>
            <View style={styles.accessOtherTextWrap}>
              <Text style={styles.accessRowLabel}>{t('accessOtherLabel', 'Other')}</Text>
              <Text style={styles.accessOtherValue}>{otherText || t('accessNotSpecified', 'Not specified')}</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

export default function DoctorsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [activeSpec, setActiveSpec] = useState('All');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.from('DOCTORS').select('*');
      if (err) throw err;
      setDoctors(data || []);
    } catch (e) {
      console.log('Error fetching doctors:', e);
      setDoctors([]);
      setError(t('errorLoadDoctors'));
    }
    setLoading(false);
  };

  const handleCall = (phone?: string) => {
    const sanitized = sanitizePhone(phone);
    if (!sanitized) {
      Alert.alert(t('noPhoneNumber'), t('noPhoneNumberDesc'));
      return;
    }
    Linking.openURL(`tel:${sanitized}`);
  };

  const handleWhatsApp = (whatsapp?: string) => {
    const sanitized = sanitizePhone(whatsapp);
    if (!sanitized) {
      Alert.alert(t('noWhatsappNumber'), t('noWhatsappNumberDesc'));
      return;
    }
    Linking.openURL(`https://wa.me/${sanitized}`);
  };

  // Filtering still compares against `activeSpec`, which is the English `key`
  // (e.g. "Cardiology"), never the translated label — so this logic is
  // unchanged from before and works the same in every language.
  const filtered = doctors.filter(d => {
    const matchesSearch =
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty?.toLowerCase().includes(search.toLowerCase());
    const matchesSpec = activeSpec === 'All' || d.specialty?.toLowerCase().includes(activeSpec.toLowerCase());
    return matchesSearch && matchesSpec;
  });

  const comingSoonItems = [
    { icon: 'call', text: t('comingSoonCall') },
    { icon: 'calendar', text: t('comingSoonBooking') },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>{t('doctorDirectory')}</Text>
        <Text style={styles.headerSub}>{t('verifiedProfessionals')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Regulatory disclaimer — shown once, above search/filters, before
            any doctor cards render. See DirectoryDisclaimer above. */}
        <DirectoryDisclaimer t={t} />

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.search}
            placeholder={t('searchDoctors')}
            placeholderTextColor={colors.text.secondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Specialty Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <View style={styles.filters}>
            {specialties.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.filterChip, activeSpec === s.key && styles.filterChipActive]}
                onPress={() => setActiveSpec(s.key)}
              >
                <Text style={[styles.filterText, activeSpec === s.key && styles.filterTextActive]}>
                  {t(s.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.accentGreen} size="large" />
            <Text style={styles.loadingText}>{t('loadingDoctors')}</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBox, { backgroundColor: '#fdeaea' }]}>
              <Ionicons name="alert-circle" size={48} color={colors.error} />
            </View>
            <Text style={styles.emptyTitle}>{t('couldNotLoadDoctors')}</Text>
            <Text style={styles.emptyDesc}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchDoctors}>
              <Ionicons name="refresh" size={16} color={colors.white} />
              <Text style={styles.getListedBtnText}>{t('tryAgain')}</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="people" size={48} color={colors.accentGreen} />
            </View>
            <Text style={styles.emptyTitle}>{t('noDoctersYet')}</Text>
            <Text style={styles.emptyDesc}>{t('onboardingMessage')}</Text>

            <View style={styles.comingSoonBox}>
              <Text style={styles.comingSoonTitle}>{t('comingSoon')}</Text>
              {comingSoonItems.map((item, i) => (
                <View key={i} style={styles.comingSoonRow}>
                  <View style={styles.comingSoonIcon}>
                    <Ionicons name={item.icon as any} size={16} color={colors.accentGreen} />
                  </View>
                  <Text style={styles.comingSoonText}>{item.text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.getListedBox}>
              <Text style={styles.getListedTitle}>{t('areYouDoctor')}</Text>
              <Text style={styles.getListedDesc}>{t('joinDirectory')}</Text>
              <TouchableOpacity
                style={styles.getListedBtn}
                onPress={() => Linking.openURL('mailto:kallemind@gmail.com?subject=Doctor Directory Listing')}
              >
                <Ionicons name="mail" size={16} color={colors.white} />
                <Text style={styles.getListedBtnText}>{t('getListed')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filtered.map(d => (
              <View key={d.id} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View style={styles.cardAvatar}>
                    {d.photo_url && !brokenImages[d.id] ? (
                      <Image
                        source={{ uri: d.photo_url }}
                        style={styles.avatarImg}
                        onError={() => setBrokenImages(prev => ({ ...prev, [d.id]: true }))}
                      />
                    ) : (
                      <Ionicons name="person" size={28} color={colors.white} />
                    )}
                  </View>
                  <View style={styles.cardHeaderInfo}>
                    {/* d.name, d.specialty, d.clinic all come from Supabase —
                        real doctor data, not app UI strings, so these are
                        intentionally NOT translated. */}
                    <View style={styles.nameRow}>
                      <Text style={styles.cardName}>{d.name}</Text>
                      {d.verified && <Ionicons name="checkmark-circle" size={16} color={colors.accentGreen} />}
                    </View>
                    <Text style={styles.cardSpec}>{d.specialty}</Text>
                    {!!d.clinic && (
                      <View style={styles.locationRow}>
                        <Ionicons name="location" size={12} color={colors.text.secondary} />
                        <Text style={styles.cardClinic}>{d.clinic}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {d.accessibility && <AccessibilityList info={d.accessibility} t={t} />}

                <View style={styles.contactBox}>
                  {!!d.phone && (
                    <View style={styles.contactRow}>
                      <Ionicons name="call-outline" size={15} color={colors.text.secondary} />
                      <Text style={styles.contactLabel}>{t('call')}</Text>
                      <Text style={styles.contactValue}>{d.phone}</Text>
                    </View>
                  )}
                  {!!d.whatsapp && (
                    <View style={styles.contactRow}>
                      <Ionicons name="logo-whatsapp" size={15} color={colors.text.secondary} />
                      <Text style={styles.contactLabel}>{t('whatsapp')}</Text>
                      <Text style={styles.contactValue}>{d.whatsapp}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardBtns}>
                  <TouchableOpacity
                    style={[styles.cardBtn, styles.outlineBtn]}
                    onPress={() => handleWhatsApp(d.whatsapp)}
                  >
                    <Ionicons name="logo-whatsapp" size={15} color={colors.accentGreen} />
                    <Text style={styles.outlineBtnText}>{t('whatsapp')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cardBtn, styles.filledBtn]}
                    onPress={() => handleCall(d.phone)}
                  >
                    <Ionicons name="call" size={15} color={colors.white} />
                    <Text style={styles.filledBtnText}>{t('call')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f5fa' },
  header: { backgroundColor: colors.navBackground, padding: spacing.lg },
  headerTitle: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.white, marginBottom: 2 },
  headerSub: { fontSize: fontSizes.xs, color: colors.accentGreenLight, fontWeight: '500' },

  // Regulatory disclaimer banner — same visual pattern used for the
  // Wellness Hub's "not medical advice" note, so the app stays consistent.
  disclaimerBox: {
    backgroundColor: '#fff8e6',
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  disclaimerTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    color: '#5a3e00',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  disclaimerParagraph: {
    fontSize: fontSizes.xs,
    color: '#5a3e00',
    lineHeight: 18,
    marginBottom: spacing.xs,
  },

  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, margin: spacing.md, paddingHorizontal: spacing.md },
  searchIcon: { marginRight: spacing.sm },
  search: { flex: 1, padding: spacing.md, color: colors.text.primary, fontSize: fontSizes.sm },
  filtersScroll: { marginBottom: spacing.sm, maxHeight: 44 },
  filters: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  filterChip: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  filterChipActive: { backgroundColor: colors.accentGreen, borderColor: colors.accentGreen },
  filterText: { fontSize: fontSizes.xs, fontWeight: '600', color: colors.text.secondary },
  filterTextActive: { color: colors.white },
  loadingContainer: { alignItems: 'center', marginTop: 60, gap: spacing.md },
  loadingText: { color: colors.text.secondary, fontSize: fontSizes.sm },
  emptyContainer: { alignItems: 'center', padding: spacing.lg },
  emptyIconBox: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#e1f5ee', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.navBackground, marginBottom: spacing.sm, textAlign: 'center' },
  emptyDesc: { fontSize: fontSizes.sm, color: colors.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg },
  comingSoonBox: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, width: '100%', marginBottom: spacing.md },
  comingSoonTitle: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.navBackground, marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 1 },
  comingSoonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  comingSoonIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#e1f5ee', alignItems: 'center', justifyContent: 'center' },
  comingSoonText: { fontSize: fontSizes.sm, color: colors.text.primary },
  getListedBox: { backgroundColor: colors.navBackground, borderRadius: borderRadius.lg, padding: spacing.lg, width: '100%', alignItems: 'center' },
  getListedTitle: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.white, marginBottom: spacing.xs },
  getListedDesc: { fontSize: fontSizes.sm, color: colors.text.nav, textAlign: 'center', lineHeight: 20, marginBottom: spacing.md },
  getListedBtn: { backgroundColor: colors.accentGreen, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  retryBtn: { backgroundColor: colors.accentBlue, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  getListedBtnText: { color: colors.white, fontWeight: '700', fontSize: fontSizes.sm },
  listContainer: { paddingHorizontal: spacing.md },

  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTopRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  cardAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  cardHeaderInfo: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardName: { color: colors.navBackground, fontWeight: '800', fontSize: fontSizes.md },
  cardSpec: { color: colors.accentGreen, fontSize: fontSizes.sm, fontWeight: '600', marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  cardClinic: { color: colors.text.secondary, fontSize: fontSizes.xs },

  // Accessibility: collapsed by default. accessSection is the outer
  // wrapper; accessSummaryBar is the always-visible tappable header row;
  // accessDetails is the expandable block that only renders when open.
  accessSection: {
    backgroundColor: '#f0f5fa',
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  accessSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  accessSummaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  accessSummaryHint: {
    fontSize: fontSizes.xs,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  accessDetails: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  accessSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accessSectionTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.navBackground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  accessIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessRowLabel: {
    flex: 1,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.text.primary,
  },
  accessStatusPill: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    maxWidth: 130,
  },
  accessStatusText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  accessOtherRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  accessOtherTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  accessOtherValue: {
    fontSize: fontSizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
    lineHeight: 16,
  },
  contactBox: {
    backgroundColor: '#f0f5fa',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  contactLabel: { color: colors.text.secondary, fontSize: fontSizes.xs, width: 70 },
  contactValue: { color: colors.navBackground, fontSize: fontSizes.sm, fontWeight: '700' },
  cardBtns: { flexDirection: 'row', gap: spacing.sm },
  cardBtn: {
    flex: 1,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  outlineBtn: { borderWidth: 1.5, borderColor: colors.accentGreen, backgroundColor: 'transparent' },
  outlineBtnText: { color: colors.accentGreen, fontWeight: '700', fontSize: fontSizes.sm },
  filledBtn: { backgroundColor: colors.accentGreen },
  filledBtnText: { color: colors.white, fontWeight: '700', fontSize: fontSizes.sm },
});
