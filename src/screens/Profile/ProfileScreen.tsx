import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { colors, spacing, fontSizes, borderRadius } from '../../theme';

interface UserProfile {
  name: string;
  email: string;
  country: string;
  symptomChecks: number;
  articlesRead: number;
  doctorsSaved: number;
  plan: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  email: '',
  country: '',
  symptomChecks: 0,
  articlesRead: 0,
  doctorsSaved: 0,
  plan: 'Free',
};

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem('kallemind_profile');
      if (stored) {
        setProfile(JSON.parse(stored));
      } else {
        // Auto detect country on first load
        detectCountry();
      }
    } catch (e) {
      console.log('Error loading profile:', e);
    }
    setLoading(false);
  };

  const detectCountry = async () => {
    setDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const geo = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geo[0]?.country) {
          const updated = { ...DEFAULT_PROFILE, country: geo[0].country };
          setProfile(updated);
          await AsyncStorage.setItem('kallemind_profile', JSON.stringify(updated));
        }
      }
    } catch (e) {
      console.log('Location error:', e);
    }
    setDetectingLocation(false);
  };

  const saveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    const updated = { ...profile, name: editName.trim(), email: editEmail.trim() };
    setProfile(updated);
    await AsyncStorage.setItem('kallemind_profile', JSON.stringify(updated));
    setEditModal(false);
    Alert.alert('Saved!', 'Your profile has been updated.');
  };

  const openEditModal = () => {
    setEditName(profile.name);
    setEditEmail(profile.email);
    setEditModal(true);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete all your data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('kallemind_profile');
            setProfile(DEFAULT_PROFILE);
            Alert.alert('Done', 'Your data has been deleted.');
          },
        },
      ]
    );
  };

  // Removed the standalone "Notifications" menu item — it duplicated the
  // Push Notifications switch above and just alerted the user to use that
  // switch instead of doing anything itself.
  // Merged "Privacy & Security" into "Help & Support" since both opened the
  // same mailto link and offered no distinct action of their own.
  const menuItems = [
    { icon: 'help-circle-outline' as const, label: 'Help & Support', action: 'help' },
    { icon: 'card-outline' as const, label: 'Subscription & Billing', action: 'subscription' },
    { icon: 'document-text-outline' as const, label: 'Terms & Conditions', action: 'terms' },
    { icon: 'trash-outline' as const, label: 'Delete My Data', action: 'delete' },
  ];

  const handleMenu = (action: string) => {
    switch (action) {
      case 'subscription': navigation.navigate('Subscription'); break;
      case 'help': Linking.openURL('mailto:kallemind@gmail.com?subject=Help & Support'); break;
      case 'terms': navigation.navigate('Terms'); break;
      case 'delete': handleDeleteAccount(); break;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.accentGreen} size="large" />
      </View>
    );
  }

  const initials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <Text style={styles.headerSub}>Manage your account</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile.name || 'Your Name'}
            </Text>
            <Text style={styles.profileEmail}>
              {profile.email || 'Add your email'}
            </Text>
            {profile.country ? (
              <Text style={styles.profileCountry}>📍 {profile.country}</Text>
            ) : null}
            <View style={styles.planBadge}>
              <Ionicons name="star" size={11} color={colors.accentBlue} />
              <Text style={styles.planText}>{profile.plan} Plan</Text>
            </View>
          </View>
          <TouchableOpacity onPress={openEditModal}>
            <Ionicons name="create-outline" size={22} color={colors.accentGreen} />
          </TouchableOpacity>
        </View>

        {/* Setup banner if no name */}
        {!profile.name && (
          <TouchableOpacity style={styles.setupBanner} onPress={openEditModal}>
            <Ionicons name="person-add-outline" size={20} color={colors.white} />
            <View style={{ flex: 1 }}>
              <Text style={styles.setupTitle}>Set up your profile</Text>
              <Text style={styles.setupSub}>Add your name and email to personalise your experience</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.white} />
          </TouchableOpacity>
        )}

        {/* Upgrade Banner */}
        {profile.plan === 'Free' && (
          <TouchableOpacity style={styles.upgradeBanner} onPress={() => navigation.navigate('Subscription')}>
            <View>
              <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
              <Text style={styles.upgradeSub}>Unlock unlimited AI checks and more</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={32} color={colors.white} />
          </TouchableOpacity>
        )}

        {/* Stats */}
        <Text style={styles.sectionLabel}>Your Activity</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="search" size={20} color={colors.accentBlue} />
            <Text style={styles.statNumber}>{profile.symptomChecks}</Text>
            <Text style={styles.statLabel}>Symptom Checks</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="book" size={20} color={colors.accentGreen} />
            <Text style={styles.statNumber}>{profile.articlesRead}</Text>
            <Text style={styles.statLabel}>Articles Read</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={20} color='#9F7AEA' />
            <Text style={styles.statNumber}>{profile.doctorsSaved}</Text>
            <Text style={styles.statLabel}>Doctors Saved</Text>
          </View>
        </View>

        {/* Notifications Toggle */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleLeft}>
            <Ionicons name="notifications-outline" size={20} color={colors.navBackground} />
            <Text style={styles.toggleLabel}>Push Notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: colors.border, true: colors.accentGreen }}
            thumbColor={colors.white}
          />
        </View>

        {/* Menu */}
        <Text style={styles.sectionLabel}>Settings</Text>
        <View style={styles.menuContainer}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.menuItem,
                i < menuItems.length - 1 && styles.menuItemBorder,
                item.action === 'delete' && styles.menuItemDanger,
              ]}
              onPress={() => handleMenu(item.action)}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={item.action === 'delete' ? colors.error : colors.text.secondary}
              />
              <Text style={[styles.menuLabel, item.action === 'delete' && { color: colors.error }]}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact */}
        <TouchableOpacity
          style={styles.contactBtn}
          onPress={() => Linking.openURL('mailto:kallemind@gmail.com')}
        >
          <Ionicons name="mail-outline" size={18} color={colors.accentGreen} />
          <Text style={styles.contactBtnText}>kallemind@gmail.com</Text>
        </TouchableOpacity>

        <Text style={styles.version}>KalleMind v1.0.0 · Your Health. Connected.</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. John Doe"
              placeholderTextColor={colors.text.muted}
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@email.com"
              placeholderTextColor={colors.text.muted}
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Country</Text>
            <View style={styles.countryRow}>
              <Text style={styles.countryValue}>
                {detectingLocation ? 'Detecting...' : profile.country || 'Not detected'}
              </Text>
              <TouchableOpacity style={styles.detectBtn} onPress={detectCountry}>
                <Ionicons name="location" size={14} color={colors.white} />
                <Text style={styles.detectBtnText}>Detect</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
              <Text style={styles.saveBtnText}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f5fa' },
  header: { backgroundColor: colors.navBackground, padding: spacing.lg },
  headerTitle: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.white, marginBottom: 2 },
  headerSub: { fontSize: fontSizes.xs, color: colors.accentGreenLight, fontWeight: '500' },
  profileCard: { backgroundColor: colors.card, margin: spacing.md, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accentBlue, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: fontSizes.xl },
  profileInfo: { flex: 1 },
  profileName: { color: colors.navBackground, fontWeight: '800', fontSize: fontSizes.lg },
  profileEmail: { color: colors.text.secondary, fontSize: fontSizes.sm, marginBottom: 2 },
  profileCountry: { color: colors.text.secondary, fontSize: fontSizes.xs, marginBottom: spacing.xs },
  planBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e8f0fe', borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, alignSelf: 'flex-start' },
  planText: { color: colors.accentBlue, fontSize: fontSizes.xs, fontWeight: '600' },
  setupBanner: { backgroundColor: colors.accentBlue, borderRadius: borderRadius.lg, padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  setupTitle: { color: colors.white, fontWeight: '700', fontSize: fontSizes.sm },
  setupSub: { color: 'rgba(255,255,255,0.8)', fontSize: fontSizes.xs, marginTop: 2 },
  upgradeBanner: { backgroundColor: colors.accentGreen, borderRadius: borderRadius.lg, padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  upgradeTitle: { color: colors.white, fontWeight: '800', fontSize: fontSizes.md },
  upgradeSub: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.xs, marginTop: 2 },
  sectionLabel: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs, fontSize: fontSizes.xs, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: colors.accentGreen },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.md, marginBottom: spacing.md },
  // Fixed: labels were clipping their last word on some devices because
  // lineHeight (14) was too tight for fontSize (10) combined with a manually
  // forced line break. Cards now have a minHeight floor and text wraps
  // naturally instead of using a hard-coded '\n'.
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border, gap: 4, minHeight: 92 },
  statNumber: { color: colors.navBackground, fontWeight: '800', fontSize: fontSizes.xl },
  statLabel: { color: colors.text.secondary, fontSize: 10, textAlign: 'center', lineHeight: 16 },
  toggleCard: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toggleLabel: { color: colors.text.primary, fontSize: fontSizes.sm, fontWeight: '600' },
  menuContainer: { backgroundColor: colors.card, borderRadius: borderRadius.lg, marginHorizontal: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuItemDanger: { backgroundColor: '#fff5f5' },
  menuLabel: { flex: 1, color: colors.text.primary, fontSize: fontSizes.sm, fontWeight: '500' },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.accentGreen + '55' },
  contactBtnText: { color: colors.accentGreen, fontSize: fontSizes.sm, fontWeight: '600' },
  version: { color: colors.text.secondary, fontSize: fontSizes.xs, textAlign: 'center', marginBottom: spacing.sm },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.card, borderRadius: 20, padding: spacing.lg, paddingBottom: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.navBackground },
  inputLabel: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.text.secondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { backgroundColor: '#f0f5fa', borderRadius: borderRadius.md, padding: spacing.md, color: colors.text.primary, fontSize: fontSizes.sm, borderWidth: 1, borderColor: colors.border },
  countryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#f0f5fa', borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  countryValue: { flex: 1, color: colors.text.primary, fontSize: fontSizes.sm },
  detectBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accentGreen, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  detectBtnText: { color: colors.white, fontSize: fontSizes.xs, fontWeight: '700' },
  saveBtn: { backgroundColor: colors.accentGreen, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  saveBtnText: { color: colors.white, fontWeight: '800', fontSize: fontSizes.md },
});
