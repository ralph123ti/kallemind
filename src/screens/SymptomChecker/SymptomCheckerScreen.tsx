import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSizes, borderRadius } from '../../theme';

const commonSymptoms = [
  'Headache', 'Fever', 'Cough', 'Fatigue',
  'Nausea', 'Chest Pain', 'Shortness of Breath',
  'Sore Throat', 'Dizziness', 'Back Pain',
  'Abdominal Pain', 'Vomiting',
];

type UrgencyLevel = 'red' | 'yellow' | 'green';

interface AIResult {
  urgency: UrgencyLevel;
  urgency_label: string;
  summary: string;
  questions: string[];
}

/**
 * On-device urgency engine.
 *
 * The previous version called api.anthropic.com directly from the app with no
 * API key — that can never work in a real build (it needs auth, and an API
 * key should never live inside a shipped app anyway; see prior discussion).
 * Rather than leave the feature broken until a backend exists, this gives a
 * reliable, always-working first pass: symptom → severity lookup, then the
 * single highest severity found wins the overall urgency level.
 *
 * This can be swapped for a real backend-proxied Claude call later without
 * changing anything else on this screen — analyzeSymptoms() just needs its
 * body replaced with a fetch to your own server endpoint that returns the
 * same AIResult shape.
 */
const RED_FLAG_SYMPTOMS = [
  'chest pain', 'shortness of breath', 'difficulty breathing', 'trouble breathing',
  'severe bleeding', 'heavy bleeding', 'coughing blood', 'vomiting blood',
  'sudden numbness', 'sudden weakness', 'slurred speech', 'facial drooping',
  'loss of consciousness', 'fainted', 'unresponsive', 'severe abdominal pain',
  'suicidal', 'severe head injury', 'seizure', 'stroke', 'blue lips',
];

const MODERATE_SYMPTOMS = [
  'fever', 'vomiting', 'persistent vomiting', 'dizziness', 'severe headache',
  'back pain', 'abdominal pain', 'high fever', 'sore throat', 'confusion',
  'rash', 'swelling', 'moderate pain', 'ongoing pain', 'blood in stool',
  'blood in urine', 'dehydration',
];

const MILD_SYMPTOMS = [
  'headache', 'fatigue', 'cough', 'nausea', 'mild pain', 'sore muscles',
  'runny nose', 'congestion', 'sneezing', 'tiredness',
];

function classifySeverity(symptom: string): UrgencyLevel {
  const s = symptom.toLowerCase();
  if (RED_FLAG_SYMPTOMS.some(k => s.includes(k))) return 'red';
  if (MODERATE_SYMPTOMS.some(k => s.includes(k))) return 'yellow';
  if (MILD_SYMPTOMS.some(k => s.includes(k))) return 'green';
  // Unrecognized/custom-typed symptoms default to yellow rather than green —
  // safer to err toward "see a doctor soon" than to silently under-triage
  // something the keyword list doesn't know about.
  return 'yellow';
}

function generateAssessment(symptoms: string[]): AIResult {
  const severities = symptoms.map(classifySeverity);
  const urgency: UrgencyLevel = severities.includes('red')
    ? 'red'
    : severities.includes('yellow')
      ? 'yellow'
      : 'green';

  const labels: Record<UrgencyLevel, string> = {
    red: 'Seek urgent care',
    yellow: 'See a doctor soon',
    green: 'Monitor at home',
  };

  const summaries: Record<UrgencyLevel, string> = {
    red: `Some of what you've entered (${symptoms.join(', ')}) can indicate something serious. Please seek in-person or emergency care promptly rather than waiting.`,
    yellow: `Your symptoms (${symptoms.join(', ')}) are worth having a doctor look at soon — within the next day or two if they don't improve or if they get worse.`,
    green: `Your symptoms (${symptoms.join(', ')}) are commonly manageable at home with rest and fluids. Keep an eye on things and see a doctor if they persist or worsen.`,
  };

  const questionBank: Record<UrgencyLevel, string[]> = {
    red: [
      'How quickly did these symptoms come on, and are they getting worse?',
      'Is there any chest pain, trouble breathing, or loss of consciousness involved?',
      'Do you have any relevant medical history (heart, lung, or neurological conditions)?',
    ],
    yellow: [
      'How long have you had these symptoms, and have they changed over time?',
      'Have you tried anything so far, and did it help?',
      'Do you have any other symptoms you haven\'t mentioned, even minor ones?',
    ],
    green: [
      'How long have these symptoms lasted so far?',
      'Are they interfering with sleep, eating, or daily activities?',
      'Is there anything that makes them noticeably better or worse?',
    ],
  };

  return {
    urgency,
    urgency_label: labels[urgency],
    summary: summaries[urgency],
    questions: questionBank[urgency],
  };
}

// Single source of truth for urgency colors/icon — used by BOTH the header legend
// and the result card below, so they can never visually drift apart. Change a
// color here and it updates everywhere it's used.
const urgencyConfig: Record<UrgencyLevel, { color: string; bg: string; border: string; icon: 'alert-circle' | 'warning' | 'checkmark-circle' }> = {
  red: { color: colors.error, bg: '#fff5f5', border: colors.error, icon: 'alert-circle' },
  yellow: { color: colors.warning, bg: '#fffbf0', border: colors.warning, icon: 'warning' },
  green: { color: colors.accentGreen, bg: '#f0faf6', border: colors.accentGreen, icon: 'checkmark-circle' },
};

export default function SymptomCheckerScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleSymptom = (s: string) => {
    setSelected(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
    // A previous result/error was based on the old symptom set — clear it so it
    // can't be mistaken for an assessment of the newly edited list.
    setResult(null);
    setError(null);
  };

  const removeSymptom = (s: string) => {
    setSelected(prev => prev.filter(x => x !== s));
    setResult(null);
    setError(null);
  };

  const addCustom = () => {
    if (custom.trim() && !selected.includes(custom.trim())) {
      setSelected(prev => [...prev, custom.trim()]);
      setCustom('');
      setResult(null);
      setError(null);
    }
  };

  const analyzeSymptoms = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // Small artificial delay so the loading state reads clearly rather than
      // flashing instantly — this is instant, on-device logic, not a network call.
      await new Promise(resolve => setTimeout(resolve, 400));
      const assessment = generateAssessment(selected);
      setResult(assessment);
    } catch (e) {
      console.error('Symptom analysis failed:', e);
      setError('We couldn\'t analyze your symptoms right now. Please try again, or contact a doctor directly if you\'re concerned.');
    }
    setLoading(false);
  };


  return (
    <View style={styles.container}>
      {/* Dark Navy Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>Symptom Checker</Text>
        {/* Legend chips are styled directly from urgencyConfig — the exact same
            color/bg/border object used by the result card below — so these can
            never visually drift apart from what a real result actually looks like. */}
        <View style={styles.legendRow}>
          {(['red', 'yellow', 'green'] as UrgencyLevel[]).map((level, i) => {
            const cfg = urgencyConfig[level];
            const labelText = level === 'red' ? 'Red' : level === 'yellow' ? 'Yellow' : 'Green';
            const captionText = level === 'red' ? 'Urgent' : level === 'yellow' ? 'Soon' : 'Monitor';
            return (
              <React.Fragment key={level}>
                <View style={[styles.legendChip, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                  <View style={styles.legendItemInner}>
                    <View style={[styles.legendDot, { backgroundColor: cfg.color }]} />
                    <Text style={[styles.legendText, { color: cfg.color }]} numberOfLines={1}>{labelText}</Text>
                  </View>
                  <Text style={styles.legendCaption} numberOfLines={1}>{captionText}</Text>
                </View>
                {i < 2 && <View style={styles.legendDivider} />}
              </React.Fragment>
            );
          })}
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.intro}>
          <Text style={styles.introTitle}>🔍 Describe your symptoms</Text>
          <Text style={styles.introDesc}>
            Tap symptoms below or type your own. Get urgency level + doctor questions.{' '}
            <Text style={styles.introGreen}>No diagnosis given.</Text>
          </Text>
        </View>

        {/* Symptom Chips */}
        <View style={styles.symptomsGrid}>
          {commonSymptoms.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.chip, selected.includes(s) && styles.chipActive]}
              onPress={() => toggleSymptom(s)}
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
          <TouchableOpacity style={styles.addBtn} onPress={addCustom}>
            <Ionicons name="add" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Selected — each chip is removable with a tap, whether it came from the
            preset list or was typed in manually via the custom input */}
        {selected.length > 0 && (
          <View style={styles.selectedBox}>
            <Text style={styles.selectedTitle}>Selected ({selected.length}):</Text>
            <View style={styles.selectedChipsRow}>
              {selected.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.selectedChip}
                  onPress={() => removeSymptom(s)}
                  accessibilityLabel={`Remove ${s}`}
                >
                  <Text style={styles.selectedChipText}>{s}</Text>
                  <Ionicons name="close-circle" size={16} color={colors.white} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Analyze Button */}
        <TouchableOpacity
          style={[styles.analyzeBtn, selected.length === 0 && styles.analyzeBtnDisabled]}
          onPress={analyzeSymptoms}
          disabled={selected.length === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="search" size={18} color={colors.white} />
              <Text style={styles.analyzeBtnText}>Check Symptoms →</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Error state — separate from a valid result, so a failed call can never be
            mistaken for a real "green" / low-urgency assessment */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Result */}
        {result && (
          <View style={[styles.resultCard, { backgroundColor: urgencyConfig[result.urgency].bg, borderColor: urgencyConfig[result.urgency].border }]}>
            <View style={[styles.urgencyBadge, { backgroundColor: urgencyConfig[result.urgency].color }]}>
              <Ionicons name={urgencyConfig[result.urgency].icon} size={16} color={colors.white} />
              <Text style={styles.urgencyText}>{result.urgency_label}</Text>
            </View>

            <Text style={styles.resultSectionTitle}>What this means</Text>
            <Text style={styles.resultText}>{result.summary}</Text>

            <Text style={styles.resultSectionTitle}>Questions to ask your doctor:</Text>
            {result.questions.map((q, i) => (
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
            KaliMed provides general health information only. <Text style={{ fontWeight: '700' }}>Not medical advice.</Text> Always consult a licensed healthcare professional.
          </Text>
        </View>

        <View style={{ height: insets.bottom + 90 }} />
      </ScrollView>
    </View>
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
  legendRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: spacing.md,
    gap: 6,
  },
  legendChip: {
    flex: 1,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  legendItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDivider: {
    display: 'none',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    marginLeft: 6,
  },
  legendCaption: {
    fontSize: fontSizes.xs - 2,
    color: colors.navBackground,
    opacity: 0.65,
    fontWeight: '500',
    marginTop: 1,
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
  selectedChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentGreen,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  selectedChipText: {
    color: colors.white,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  analyzeBtn: {
    backgroundColor: colors.accentGreen,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
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
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#fff5f5',
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    lineHeight: 18,
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
