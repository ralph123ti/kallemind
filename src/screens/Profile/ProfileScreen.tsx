import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { colors, spacing, fontSizes, borderRadius } from '../../theme';
import { LANGUAGES, LanguageCode } from '../../i18n/languages';
import { changeLanguage } from '../../i18n';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  country: string;
  age: string;
  gender: string;
  symptomChecks: number;
  articlesRead: number;
  doctorsSaved: number;
  plan: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  email: '',
  phone: '',
  country: '',
  age: '',
  gender: '',
  symptomChecks: 0,
  articlesRead: 0,
  doctorsSaved: 0,
  plan: 'Free',
};

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [editModal, setEditModal] = useState(false);
  const [languageModal, setLanguageModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('');
  const [loading, setLoading] = useState(true);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Reload profile every time screen is focused
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

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
      Alert.alert(t('errorTitle'), t('enterNameError'));
      return;
    }
    const updated = {
      ...profile,
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      age: editAge.trim(),
      gender: editGender.trim(),
    };
    setProfile(updated);
    await AsyncStorage.setItem('kallemind_profile', JSON.stringify(updated));
    setEditModal(false);
    Alert.alert(t('savedTitle'), t('profileUpdated'));
  };

  const openEditModal = () => {
    setEditName(profile.name);
    setEditEmail(profile.email);
    setEditPhone(profile.phone || '');
    setEditAge(profile.age || '');
    setEditGender(profile.gender || '');
    setEditModal(true);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('deleteAccountTitle'),
      t('deleteAccountConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('kallemind_profile');
            setProfile(DEFAULT_PROFILE);
            Alert.alert(t('doneTitle'), t('dataDeleted'));
          },
        },
      ]
    );
  };

  // Two groups now: general Settings, and a dedicated Legal group.
  // labels now come from t(), icons/actions untouched.
  const settingsItems = [
    { icon: 'card-outline' as const, label: t('subscriptionBilling'), action: 'subscription' },
    { icon: 'language-outline' as const, label: t('language'), action: 'language' },
    { icon: 'help-circle-outline' as const, label: t('helpSupport'), action: 'help' },
    { icon: 'trash-outline' as const, label: t('deleteData'), action: 'delete' },
  ];

  const legalItems = [
    { icon: 'shield-checkmark-outline' as const, label: t('privacyPolicy'), action: 'privacyPolicy' },
    { icon: 'document-text-outline' as const, label: t('termsOfUse'), action: 'terms' },
    { icon: 'medkit-outline' as const, label: t('healthDisclaimer'), action: 'healthDisclaimer' },
  ];

  const handleMenu = (action: string) => {
    switch (action) {
      case 'subscription': navigation.navigate('Subscription'); break;
      case 'language': setLanguageModal(true); break;
      case 'help': navigation.navigate('Help'); break;
      case 'terms': navigation.navigate('Terms'); break;
      case 'privacyPolicy': navigation.navigate('PrivacyPolicy'); break;
      case 'healthDisclaimer': navigation.navigate('HealthDisclaimer'); break;
      case 'delete': handleDeleteAccount(); break;
    }
  };

  const handleSelectLanguage = async (code: LanguageCode) => {
    await changeLanguage(code);
    setLanguageModal(false);
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

  const renderMenuGroup = (items: typeof settingsItems) => (
    <View style={styles.menuContainer}>
      {items.map((item, i) => (
        <TouchableOpacity
          key={i}
          style={[
            styles.menuItem,
            i < items.length - 1 && styles.menuItemBorder,
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
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>{t('myProfile')}</Text>
        <Text style={styles.headerSub}>{t('manageAccount')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile.name || t('yourNamePlaceholder')}
            </Text>
            <Text style={styles.profileEmail}>
              {profile.email || t('addYourEmailPlaceholder')}
            </Text>
            {profile.phone ? (
              <Text style={styles.profileCountry}>📞 {profile.phone}</Text>
            ) : null}
            {profile.age || profile.gender ? (
              <Text style={styles.profileCountry}>
                {profile.age ? `🎂 ${profile.age} ${t('yrsSuffix')}` : ''}{profile.age && profile.gender ? '  ' : ''}{profile.gender ? `⚧ ${profile.gender}` : ''}
              </Text>
            ) : null}
            {profile.country ? (
              <Text style={styles.profileCountry}>📍 {profile.country}</Text>
            ) : null}
            <View style={styles.planBadge}>
              <Ionicons name="star" size={11} color={colors.accentBlue} />
              <Text style={styles.planText}>{profile.plan} {t('planSuffix')}</Text>
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
              <Text style={styles.setupTitle}>{t('setupProfile')}</Text>
              <Text style={styles.setupSub}>{t('setupProfileSub')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.white} />
          </TouchableOpacity>
        )}

        {/* Upgrade Banner */}
        {profile.plan === 'Free' && (
          <TouchableOpacity style={styles.upgradeBanner} onPress={() => navigation.navigate('Subscription')}>
            <View>
              <Text style={styles.upgradeTitle}>{t('upgradePremium')}</Text>
              <Text style={styles.upgradeSub}>{t('unlockUnlimited')}</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={32} color={colors.white} />
          </TouchableOpacity>
        )}

        {/* Stats */}
        <Text style={styles.sectionLabel}>{t('yourActivity')}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="search" size={18} color={colors.accentBlue} />
            <Text style={styles.statNumber}>{profile.symptomChecks}</Text>
            <Text style={styles.statLabel}>{t('symptomChecks')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="book" size={18} color={colors.accentGreen} />
            <Text style={styles.statNumber}>{profile.articlesRead}</Text>
            <Text style={styles.statLabel}>{t('articlesRead')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={18} color='#9F7AEA' />
            <Text style={styles.statNumber}>{profile.doctorsSaved}</Text>
            <Text style={styles.statLabel}>{t('doctorsSaved')}</Text>
          </View>
        </View>

        {/* Notifications Toggle */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleLeft}>
            <Ionicons name="notifications-outline" size={20} color={colors.navBackground} />
            <Text style={styles.toggleLabel}>{t('pushNotifications')}</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: colors.border, true: colors.accentGreen }}
            thumbColor={colors.white}
          />
        </View>

        {/* Settings menu */}
        <Text style={styles.sectionLabel}>{t('settings')}</Text>
        {renderMenuGroup(settingsItems)}

        {/* Legal menu — required for GDPR + app store compliance */}
        <Text style={styles.sectionLabel}>{t('privacySecurity')}</Text>
        {renderMenuGroup(legalItems)}

        {/* Contact */}
        <TouchableOpacity
          style={styles.contactBtn}
          onPress={() => Linking.openURL('mailto:kallemind@gmail.com')}
        >
          <Ionicons name="mail-outline" size={18} color={colors.accentGreen} />
          <Text style={styles.contactBtnText}>kallemind@gmail.com</Text>
        </TouchableOpacity>

        <Text style={styles.version}>{t('version')}</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('editProfile')}</Text>
                <TouchableOpacity onPress={() => setEditModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>{t('fullName')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('fullNamePlaceholder')}
                placeholderTextColor={colors.text.muted}
                value={editName}
                onChangeText={setEditName}
              />

              <Text style={styles.inputLabel}>{t('emailAddress')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('emailPlaceholder')}
                placeholderTextColor={colors.text.muted}
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>{t('phoneNumber')}</Text>
              <TextInput
                style={styles.input}
                placeholder="+263 77 123 4567"
                placeholderTextColor={colors.text.muted}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{t('age')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('agePlaceholder')}
                    placeholderTextColor={colors.text.muted}
                    value={editAge}
                    onChangeText={setEditAge}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{t('gender')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('genderPlaceholder')}
                    placeholderTextColor={colors.text.muted}
                    value={editGender}
                    onChangeText={setEditGender}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>{t('country')}</Text>
              <View style={styles.countryRow}>
                <Text style={styles.countryValue}>
                  {detectingLocation ? t('detecting') : profile.country || t('notDetected')}
                </Text>
                <TouchableOpacity style={styles.detectBtn} onPress={detectCountry}>
                  <Ionicons name="location" size={14} color={colors.white} />
                  <Text style={styles.detectBtnText}>{t('detect')}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
                <Text style={styles.saveBtnText}>{t('saveProfile')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Language Picker Modal — new. Tapping a language calls changeLanguage(),
          which updates i18next immediately (every screen using useTranslation
          re-renders) and persists the choice to AsyncStorage. */}
      <Modal visible={languageModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('language')}</Text>
                <TouchableOpacity onPress={() => setLanguageModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageRow,
                    i18n.language === lang.code && styles.languageRowActive,
                  ]}
                  onPress={() => handleSelectLanguage(lang.code as LanguageCode)}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={styles.languageName}>{lang.nativeName}</Text>
                  {i18n.language === lang.code && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.accentGreen} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
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
  statCard: { flex: 1, minWidth: 0, backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border, gap: 2 },
  statNumber: { color: colors.navBackground, fontWeight: '800', fontSize: fontSizes.lg },
  statLabel: { color: colors.text.secondary, fontSize: 9, textAlign: 'center', lineHeight: 13, width: '100%' },
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
  rowInputs: { flexDirection: 'row', gap: spacing.sm },
  inputLabel: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.text.secondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { backgroundColor: '#f0f5fa', borderRadius: borderRadius.md, padding: spacing.md, color: colors.text.primary, fontSize: fontSizes.sm, borderWidth: 1, borderColor: colors.border },
  countryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#f0f5fa', borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  countryValue: { flex: 1, color: colors.text.primary, fontSize: fontSizes.sm },
  detectBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accentGreen, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  detectBtnText: { color: colors.white, fontSize: fontSizes.xs, fontWeight: '700' },
  saveBtn: { backgroundColor: colors.accentGreen, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  saveBtnText: { color: colors.white, fontWeight: '800', fontSize: fontSizes.md },
  languageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: borderRadius.md },
  languageRowActive: { backgroundColor: '#e1f5ee' },
  languageFlag: { fontSize: 24 },
  languageName: { flex: 1, fontSize: fontSizes.sm, fontWeight: '600', color: colors.text.primary },
});
