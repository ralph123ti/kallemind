import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSizes, borderRadius } from '../../theme';
import { supabase } from '../../api/supabase';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  clinic: string;
  address: string;
  phone: string;
  whatsapp: string;
  photo_url: string;
  rating: number;
  verified: boolean;
}

const specialties = ['All', 'General', 'Cardiology', 'Paediatrics', 'Dermatology', 'Mental Health'];

export default function DoctorsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeSpec, setActiveSpec] = useState('All');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('DOCTORS').select('*');
      if (error) {
        console.log('Supabase error:', JSON.stringify(error));
        alert('Error: ' + JSON.stringify(error));
        throw error;
      }
      console.log('Doctors fetched:', data);
      setDoctors(data || []);
    } catch (e) {
      console.log('Error fetching doctors:', e);
      setDoctors([]);
    }
    setLoading(false);
  };

  const filtered = doctors.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase());
    const matchesSpec = activeSpec === 'All' || d.specialty.toLowerCase().includes(activeSpec.toLowerCase());
    return matchesSearch && matchesSpec;
  });

  return (
    <View style={styles.container}>
      {/* Dark Navy Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>Doctor Directory</Text>
        <Text style={styles.headerSub}>Verified healthcare professionals</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.search}
            placeholder="Search doctors, specialties..."
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
                style={[styles.filterChip, activeSpec === s && styles.filterChipActive]}
                onPress={() => setActiveSpec(s)}
              >
                <Text style={[styles.filterText, activeSpec === s && styles.filterTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={colors.accentGreen} size="large" style={{ marginTop: 60 }} />
        ) : filtered.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="people" size={48} color={colors.accentGreen} />
            </View>
            <Text style={styles.emptyTitle}>No Doctors Listed Yet</Text>
            <Text style={styles.emptyDesc}>
              We are currently onboarding verified healthcare professionals across 150+ countries. Check back soon!
            </Text>

            <View style={styles.comingSoonBox}>
              <Text style={styles.comingSoonTitle}>Coming Soon</Text>
              {[
                { icon: 'location', text: 'Doctors near you via GPS' },
                { icon: 'call', text: 'Direct call & WhatsApp contact' },
                { icon: 'star', text: 'Verified ratings & reviews' },
                { icon: 'calendar', text: 'Appointment booking' },
              ].map((item, i) => (
                <View key={i} style={styles.comingSoonRow}>
                  <View style={styles.comingSoonIcon}>
                    <Ionicons name={item.icon as any} size={16} color={colors.accentGreen} />
                  </View>
                  <Text style={styles.comingSoonText}>{item.text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.getListedBox}>
              <Text style={styles.getListedTitle}>Are you a Doctor?</Text>
              <Text style={styles.getListedDesc}>
                Join the KaliMed directory and connect with patients across the globe.
              </Text>
              <TouchableOpacity
                style={styles.getListedBtn}
                onPress={() => Linking.openURL('mailto:doctors@kalimed.com?subject=Doctor Directory Listing')}
              >
                <Ionicons name="mail" size={16} color={colors.white} />
                <Text style={styles.getListedBtnText}>Get Listed — Contact Us</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Doctor List */
          <View style={styles.listContainer}>
            {filtered.map(d => (
              <View key={d.id} style={styles.card}>
                <View style={styles.cardAvatar}>
                  {d.photo_url ? (
                    <Image source={{ uri: d.photo_url }} style={styles.avatarImg} />
                  ) : (
                    <Ionicons name="person" size={24} color={colors.white} />
                  )}
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.cardName}>{d.name}</Text>
                    {d.verified && <Ionicons name="checkmark-circle" size={14} color={colors.accentGreen} />}
                  </View>
                  <Text style={styles.cardSpec}>{d.specialty}</Text>
                  <Text style={styles.cardClinic}>{d.clinic}</Text>
                  <Text style={styles.cardAddress}>{d.address}</Text>
                  <View style={styles.cardBtns}>
                    <TouchableOpacity style={styles.cardBtn} onPress={() => Linking.openURL(`tel:${d.phone}`)}>
                      <Ionicons name="call" size={13} color={colors.white} />
                      <Text style={styles.cardBtnText}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cardBtn, styles.waBtn]}
                      onPress={() => Linking.openURL(`https://wa.me/${d.whatsapp?.replace('+', '')}`)}
                    >
                      <Ionicons name="logo-whatsapp" size={13} color={colors.white} />
                      <Text style={styles.cardBtnText}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
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
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, margin: spacing.md, paddingHorizontal: spacing.md },
  searchIcon: { marginRight: spacing.sm },
  search: { flex: 1, padding: spacing.md, color: colors.text.primary, fontSize: fontSizes.sm },
  filtersScroll: { marginBottom: spacing.sm, maxHeight: 44 },
  filters: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  filterChip: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  filterChipActive: { backgroundColor: colors.accentGreen, borderColor: colors.accentGreen },
  filterText: { fontSize: fontSizes.xs, fontWeight: '600', color: colors.text.secondary },
  filterTextActive: { color: colors.white },
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
  getListedBtnText: { color: colors.white, fontWeight: '700', fontSize: fontSizes.sm },
  listContainer: { paddingHorizontal: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', gap: spacing.md },
  cardAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accentBlue, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardName: { color: colors.navBackground, fontWeight: '700', fontSize: fontSizes.md },
  cardSpec: { color: colors.accentGreen, fontSize: fontSizes.sm, fontWeight: '600' },
  cardClinic: { color: colors.text.secondary, fontSize: fontSizes.xs },
  cardAddress: { color: colors.text.secondary, fontSize: fontSizes.xs, marginBottom: spacing.sm },
  cardBtns: { flexDirection: 'row', gap: spacing.sm },
  cardBtn: { backgroundColor: colors.accentBlue, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, flexDirection: 'row', alignItems: 'center', gap: 4 },
  waBtn: { backgroundColor: '#25D366' },
  cardBtnText: { color: colors.white, fontWeight: '700', fontSize: fontSizes.xs },
});