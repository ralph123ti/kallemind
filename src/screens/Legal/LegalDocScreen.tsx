import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSizes, borderRadius } from '../../theme';

// Generic reader used by PrivacyPolicyScreen, TermsScreen, and
// HealthDisclaimerScreen so all three look consistent and only the
// content differs.
export default function LegalDocScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { title, lastUpdated, sections } = route.params as {
    title: string;
    lastUpdated: string;
    sections: { heading: string; body: string }[];
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: {lastUpdated}</Text>
        {sections.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.navBackground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { color: colors.white, fontSize: fontSizes.md, fontWeight: '800' },
  content: { padding: spacing.md },
  updated: { color: colors.text.secondary, fontSize: fontSizes.xs, marginBottom: spacing.md, fontWeight: '600' },
  section: { marginBottom: spacing.lg, backgroundColor: colors.card, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  heading: { fontSize: fontSizes.sm, fontWeight: '700', color: colors.navBackground, marginBottom: spacing.xs },
  body: { fontSize: fontSizes.sm, color: colors.text.secondary, lineHeight: 20 },
});
