import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, fontSizes, borderRadius } from '../../theme';
import { MONTHLY_USES_KEY, FREE_MONTHLY_LIMIT } from '../../store/storageKeys';

// TODO: move this alongside your other keys in ../../store/storageKeys and
// import it from there instead, for consistency with MONTHLY_USES_KEY etc.
const DISCLAIMER_AGREED_KEY = 'disclaimerAgreedV1';

const commonSymptoms = [
  'Headache', 'Fever', 'Cough', 'Fatigue',
  'Nausea', 'Chest Pain', 'Shortness of Breath',
  'Sore Throat', 'Dizziness', 'Back Pain',
  'Abdominal Pain', 'Vomiting',
];

type UrgencyLevel = 'red' | 'yellow' | 'green';
type Mode = 'symptom' | 'prep';

interface SymptomResult {
  urgency: UrgencyLevel;
  urgency_label: string;
  summary: string;
  questions: string[];
}

interface PrepResult {
  timeline: string;
  checklist: string[];
  questions: string[];
}

// This must point at a backend endpoint you control — never call the
// Anthropic API directly from the client. Anything prefixed EXPO_PUBLIC_
// gets compiled straight into the shipped app bundle, so an
// EXPO_PUBLIC_ANTHROPIC_API_KEY is trivially extractable from the binary.
// Your backend should hold the real Anthropic key server-side and forward
// only the model's response.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// While there's no backend/API credits configured, fall back to local mock
// data instead of showing a "setup needed" error. Set EXPO_PUBLIC_API_BASE_URL
// once you have a real backend and this switches over automatically —
// no code changes needed. You can also force mock mode on purpose via
// EXPO_PUBLIC_USE_MOCK=true even if a base URL is set.
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true' || !API_BASE_URL;

function getMockSymptomResult(symptoms: string[]): SymptomResult {
  const hasRedFlag = symptoms.some(s =>
    ['Chest Pain', 'Shortness of Breath'].includes(s)
  );
  return {
    urgency: hasRedFlag ? 'red' : symptoms.length > 2 ? 'yellow' : 'green',
    urgency_label: hasRedFlag
      ? 'Seek care urgently'
      : symptoms.length > 2
      ? 'See a doctor soon'
      : 'Monitor at home',
    summary: `[MOCK DATA] Based on ${symptoms.join(', ')}, this is placeholder output for UI testing — not a real assessment.`,
    questions: [
      'When did these symptoms first start?',
      'Have you noticed any patterns or triggers?',
      'Are you currently taking any medications?',
    ],
  };
}

function getMockPrepResult(symptoms: string[], onset: string, notes: string): PrepResult {
  return {
    timeline: `[MOCK DATA] Symptoms began ${onset || 'recently'}: ${symptoms.join(', ')}. ${notes ? `Already tried: ${notes}.` : ''} This is placeholder output for UI testing.`,
    checklist: [
      `Symptoms: ${symptoms.join(', ')}`,
      `Onset: ${onset || 'not specified'}`,
      'Any medications currently being taken',
      'Any relevant medical history',
    ],
    questions: [
      "Could this be related to any recent changes (diet, stress, travel)?",
      'What tests, if any, would you recommend?',
      "When should I follow up if this doesn't improve?",
    ],
  };
}

export default function SymptomCheckerScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();

  // Falls back to 'symptom' if no param is passed, so this screen still
  // works if something ever navigates here without a mode.
  const mode: Mode = route?.params?.mode === 'prep' ? 'prep' : 'symptom';
  const isPrep = mode === 'prep';

  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState('');
  const [onset, setOnset] = useState(''); // prep-only: "when did this start"
  const [notes, setNotes] = useState(''); // prep-only: what's been tried already
  const [loading, setLoading] = useState(false);
  const [symptomResult, setSymptomResult] = useState<SymptomResult | null>(null);
  const [prepResult, setPrepResult] = useState<PrepResult | null>(null);
  const [usesRemaining, setUsesRemaining] = useState(FREE_MONTHLY_LIMIT);

  // Disclaimer gate: null while we're still checking storage (so we don't
  // flash the modal for users who already agreed), true/false once known.
  const [hasAgreed, setHasAgreed] = useState<boolean | null>(null);

  // Reset per-mode state when the same screen is reused for the other mode
  // (e.g. user goes Home → Symptom Checker → back → Doctor Prep Sheet)
  // instead of carrying over stale results from the previous mode.
  useEffect(() => {
    setSelected([]);
    setCustom('');
    setOnset('');
    setNotes('');
    setSymptomResult(null);
    setPrepResult(null);
  }, [mode]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(MONTHLY_USES_KEY);
        const used = stored ? parseInt(stored, 10) || 0 : 0;
        setUsesRemaining(Math.max(FREE_MONTHLY_LIMIT - used, 0));
      } catch {
        setUsesRemaining(FREE_MONTHLY_LIMIT);
      }
    })();
  }, []);

  // Check whether the user has already agreed to the disclaimer before.
  // Re-checked every time this screen mounts so it also covers the
  // Home → Symptom Checker → back → Doctor Prep Sheet flow correctly.
  useEffect(() => {
    (async () => {
      try {
        const agreed = await AsyncStorage.getItem(DISCLAIMER_AGREED_KEY);
        setHasAgreed(agreed === 'true');
      } catch {
        // If storage fails, default to showing the disclaimer — safer to
        // ask again than to silently skip it.
        setHasAgreed(false);
      }
    })();
  }, []);

  const acceptDisclaimer = async () => {
    setHasAgreed(true);
    try {
      await AsyncStorage.setItem(DISCLAIMER_AGREED_KEY, 'true');
    } catch {
      // Non-fatal — worst case they see the modal again next visit.
    }
  };

  // Cancel used to call navigation.goBack() unconditionally. On web (and on
  // any screen reached without a prior history entry — e.g. deep link, or
  // this being the first screen in the stack) goBack() silently no-ops,
  // which left the modal stuck on screen with no way to dismiss it. Now we
  // only go back if there's actually somewhere to go back to, and fall
  // back to a known safe screen (Home) otherwise.
  const declineDisclaimer = () => {
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  const toggleSymptom = (s: string) => {
    setSelected(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const addCustom = () => {
    if (custom.trim() && !selected.includes(custom.trim())) {
      setSelected(prev => [...prev, custom.trim()]);
      setCustom('');
    }
  };

  const incrementUsage = async () => {
    try {
      const stored = await AsyncStorage.getItem(MONTHLY_USES_KEY);
      const used = stored ? parseInt(stored, 10) || 0 : 0;
      const next = used + 1;
      await AsyncStorage.setItem(MONTHLY_USES_KEY, String(next));
      setUsesRemaining(Math.max(FREE_MONTHLY_LIMIT - next, 0));
    } catch {
      // Non-fatal — usage tracking failing shouldn't block the user from
      // seeing a result they already paid an API call for.
    }
  };

  const analyzeSymptoms = async () => {
    if (selected.length === 0) return;

    // Enforce the free-tier cap before spending an API call, rather than
    // only showing a counter on Home that nothing here actually checks.
    if (usesRemaining <= 0) {
      Alert.alert(
        'Free limit reached',
        "You've used all your free checks this month. Upgrade for unlimited access.",
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Subscription') },
        ]
      );
      return;
    }

    setLoading(true);
    setSymptomResult(null);
    setPrepResult(null);

    try {
      let data: SymptomResult | PrepResult;

      if (USE_MOCK) {
        // Simulate network latency so loading states/spinners are still
        // testable, then return fixture data — no API key, no backend,
        // no cost. Switches off automatically once EXPO_PUBLIC_API_BASE_URL
        // is set to a real backend.
        await new Promise(resolve => setTimeout(resolve, 900));
        data = isPrep
          ? getMockPrepResult(selected, onset, notes)
          : getMockSymptomResult(selected);
      } else {
        const response = await fetch(`${API_BASE_URL}/analyze-symptoms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode,
            symptoms: selected,
            onset: isPrep ? onset : undefined,
            notes: isPrep ? notes : undefined,
          }),
        });

        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        data = await response.json();
      }

      if (isPrep) {
        setPrepResult(data as PrepResult);
      } else {
        setSymptomResult(data as SymptomResult);
      }

      await incrementUsage();
    } catch (e) {
      if (isPrep) {
        setPrepResult({
          timeline: 'Could not generate your prep sheet. Please try again.',
          checklist: ['Bring a list of your symptoms and when each started'],
          questions: ['Describe your symptoms in detail to your doctor'],
        });
      } else {
        setSymptomResult({
          urgency: 'yellow',
          urgency_label: 'See a doctor soon',
          summary: 'Could not analyze symptoms. Please try again or consult a doctor.',
          questions: ['Describe your symptoms in detail to your doctor'],
        });
      }
    }
    setLoading(false);
  };

  const urgencyConfig = {
    red: { color: colors.error, bg: '#fff5f5', border: colors.error, icon: 'alert-circle' as const },
    yellow: { color: colors.warning, bg: '#fffbf0', border: colors.warning, icon: 'warning' as const },
    green: { color: colors.accentGreen, bg: '#f0faf6', border: colors.accentGreen, icon: 'checkmark-circle' as const },
  };

  return (
    <View style={styles.container}>
      {/* Disclaimer gate — blocks interaction with the rest of the screen
          until the user explicitly agrees this tool is informational only,
          not a diagnosis. hasAgreed === null means we're still reading
          storage, so we intentionally render nothing for the modal yet. */}
      <Modal
        visible={hasAgreed === false}
        animationType="fade"
        transparent
        onRequestClose={() => {}} // Android back button: force explicit choice, don't let it dismiss silently
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="information-circle" size={32} color={colors.accentGreen} />
            </View>
            <Text style={styles.modalTitle}>Before you continue</Text>
            <Text style={styles.modalBody}>
              KalleMind gives general health information only.{'\n'}
              It does not diagnose, prescribe, or replace a doctor or nurse.{'\n'}
              We do not save or store your symptoms.{'\n'}
              In an emergency, call your local emergency number or visit your nearest clinic immediately.
            </Text>
            <TouchableOpacity
              style={styles.modalAgreeBtn}
              onPress={acceptDisclaimer}
              accessibilityRole="button"
              accessibilityLabel="I Understand — this is not a diagnosis"
            >
              <Text style={styles.modalAgreeBtnText}>I Understand — This is Not a Diagnosis</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={declineDisclaimer}
              accessibilityRole="button"
              accessibilityLabel="Cancel and go back"
            >
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dark Navy Header — copy now reflects which mode this actually is */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>{isPrep ? 'Doctor Prep Sheet' : 'Symptom Checker'}</Text>
        <Text style={styles.headerSub}>
          {isPrep ? 'Timeline + checklist to screenshot · No diagnosis' : 'Red / Yellow / Green urgency · No diagnosis'}
        </Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.intro}>
          <Text style={styles.introTitle}>{isPrep ? '📋 Build your visit prep sheet' : '🔍 Describe your symptoms'}</Text>
          <Text style={styles.introDesc}>
            {isPrep
              ? 'Select symptoms and add a bit of context. Get a timeline and checklist you can screenshot before your appointment.'
              : 'Tap symptoms below or type your own. Get urgency level + doctor questions.'}{' '}
            <Text style={styles.introGreen}>No diagnosis given.</Text>
          </Text>
        </View>

        {usesRemaining <= 0 && (
          <View style={styles.limitBanner}>
            <Ionicons name="lock-closed" size={16} color={colors.warning} />
            <Text style={styles.limitBannerText}>
              You've used all {FREE_MONTHLY_LIMIT} free checks this month.{' '}
              <Text style={styles.limitBannerLink} onPress={() => navigation.navigate('Subscription')}>
                Upgrade for unlimited access
              </Text>
            </Text>
          </View>
        )}

        {/* Symptom Chips */}
        <View style={styles.symptomsGrid}>
          {commonSymptoms.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.chip, selected.includes(s) && styles.chipActive]}
              onPress={() => toggleSymptom(s)}
              accessibilityRole="button"
              accessibilityLabel={s}
              accessibilityState={{ selected: selected.includes(s) }}
            >
              <Text style={[styles.chipText, selected.includes(s) && styles.chipTextActive]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Input */}
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            placeholder="Add other symptom..."
            placeholderTextColor={colors.text.secondary}
            value={custom}
            onChangeText={setCustom}
            onSubmitEditing={addCustom}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addCustom} accessibilityRole="button" accessibilityLabel="Add symptom">
            <Ionicons name="add" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Prep-only context fields */}
        {isPrep && (
          <View style={styles.prepFieldsBox}>
            <Text style={styles.prepFieldLabel}>When did this start?</Text>
            <TextInput
              style={styles.customInput}
              placeholder="e.g. 3 days ago"
              placeholderTextColor={colors.text.secondary}
              value={onset}
              onChangeText={setOnset}
            />
            <Text style={[styles.prepFieldLabel, { marginTop: spacing.md }]}>Anything you've already tried?</Text>
            <TextInput
              style={[styles.customInput, { height: 70 }]}
              placeholder="e.g. rest, over-the-counter medication..."
              placeholderTextColor={colors.text.secondary}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>
        )}

        {/* Selected */}
        {selected.length > 0 && (
          <View style={styles.selectedBox}>
            <Text style={styles.selectedTitle}>Selected ({selected.length}):</Text>
            <Text style={styles.selectedList}>{selected.join(' · ')}</Text>
          </View>
        )}

        {/* Analyze Button */}
        <TouchableOpacity
          style={[styles.analyzeBtn, (selected.length === 0 || usesRemaining <= 0) && styles.analyzeBtnDisabled]}
          onPress={analyzeSymptoms}
          disabled={selected.length === 0 || loading || usesRemaining <= 0}
          accessibilityRole="button"
          accessibilityLabel={isPrep ? 'Generate prep sheet' : 'Check symptoms'}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name={isPrep ? 'clipboard' : 'search'} size={18} color={colors.white} />
              <Text style={styles.analyzeBtnText}>{isPrep ? 'Generate Prep Sheet →' : 'Check Symptoms →'}</Text>
            </>
          )}
        </TouchableOpacity>

        {!isPrep && usesRemaining > 0 && (
          <Text style={styles.usesLeftText}>{usesRemaining} free check{usesRemaining === 1 ? '' : 's'} left this month</Text>
        )}

        {/* Symptom-mode result: urgency triage */}
        {!isPrep && symptomResult && (
          <View style={[styles.resultCard, { backgroundColor: urgencyConfig[symptomResult.urgency].bg, borderColor: urgencyConfig[symptomResult.urgency].border }]}>
            <View style={[styles.urgencyBadge, { backgroundColor: urgencyConfig[symptomResult.urgency].color }]}>
              <Ionicons name={urgencyConfig[symptomResult.urgency].icon} size={16} color={colors.white} />
              <Text style={styles.urgencyText}>{symptomResult.urgency_label}</Text>
            </View>

            <Text style={styles.resultSectionTitle}>What this means</Text>
            <Text style={styles.resultText}>{symptomResult.summary}</Text>

            <Text style={styles.resultSectionTitle}>Questions to ask your doctor:</Text>
            {symptomResult.questions.map((q, i) => (
              <View key={i} style={styles.questionRow}>
                <View style={styles.questionNum}>
                  <Text style={styles.questionNumText}>?</Text>
                </View>
                <Text style={styles.questionText}>{q}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Prep-mode result: timeline + checklist, distinct from triage */}
        {isPrep && prepResult && (
          <View style={[styles.resultCard, { backgroundColor: '#f0f5fa', borderColor: colors.border }]}>
            <Text style={styles.resultSectionTitle}>Visit Timeline</Text>
            <Text style={styles.resultText}>{prepResult.timeline}</Text>

            <Text style={styles.resultSectionTitle}>Checklist to bring</Text>
            {prepResult.checklist.map((item, i) => (
              <View key={i} style={styles.questionRow}>
                <Ionicons name="checkbox-outline" size={18} color={colors.accentGreen} style={{ marginTop: 1 }} />
                <Text style={styles.questionText}>{item}</Text>
              </View>
            ))}

            <Text style={styles.resultSectionTitle}>Questions to ask your doctor</Text>
            {prepResult.questions.map((q, i) => (
              <View key={i} style={styles.questionRow}>
                <View style={styles.questionNum}>
                  <Text style={styles.questionNumText}>?</Text>
                </View>
                <Text style={styles.questionText}>{q}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            KalleMind provides general health information only. <Text style={{ fontWeight: '700' }}>Not medical advice.</Text> Always consult a licensed healthcare professional.
          </Text>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f5fa',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 32, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0faf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.navBackground,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: fontSizes.sm,
    color: colors.text.secondary,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalAgreeBtn: {
    backgroundColor: colors.accentGreen,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalAgreeBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  modalCancelBtn: {
    paddingVertical: spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: colors.text.secondary,
    fontWeight: '600',
    fontSize: fontSizes.sm,
  },
  header: {
    backgroundColor: colors.navBackground,
    padding: spacing.lg,
    paddingTop: spacing.xl,
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
  scroll: {
    flex: 1,
    padding: spacing.md,
  },
  intro: {
    backgroundColor: colors.navBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  introTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  introDesc: {
    fontSize: fontSizes.sm,
    color: colors.text.nav,
    lineHeight: 20,
  },
  introGreen: {
    color: colors.accentGreenLight,
    fontWeight: '700',
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#fffbf0',
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  limitBannerText: {
    flex: 1,
    fontSize: fontSizes.xs,
    color: '#5a3e00',
    lineHeight: 18,
  },
  limitBannerLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: {
    backgroundColor: colors.accentGreen,
    borderColor: colors.accentGreen,
  },
  chipText: {
    color: colors.text.primary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.white,
  },
  customRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  customInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: fontSizes.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  addBtn: {
    backgroundColor: colors.accentGreen,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prepFieldsBox: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prepFieldLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  selectedBox: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedTitle: {
    color: colors.text.secondary,
    fontSize: fontSizes.xs,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  selectedList: {
    color: colors.text.primary,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  analyzeBtn: {
    backgroundColor: colors.accentGreen,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  analyzeBtnDisabled: {
    opacity: 0.5,
  },
  analyzeBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSizes.md,
  },
  usesLeftText: {
    textAlign: 'center',
    fontSize: fontSizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  resultCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    marginBottom: spacing.md,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  urgencyText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSizes.sm,
  },
  resultSectionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.navBackground,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  resultText: {
    fontSize: fontSizes.sm,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  questionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  questionNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accentGreen,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  questionNumText: {
    color: colors.white,
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  questionText: {
    fontSize: fontSizes.sm,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 20,
  },
  disclaimer: {
    backgroundColor: '#fff8e6',
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  disclaimerText: {
    fontSize: fontSizes.xs,
    color: '#5a3e00',
    lineHeight: 18,
  },
});