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
import { colors, spacing, fontSizes, borderRadius } from '../../theme';
import { LANGUAGES, LanguageCode } from '../../i18n/languages';
import { changeLanguage } from '../../i18n';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
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
  age: '',
  gender: '',
  symptomChecks: 0,
  articlesRead: 0,
  doctorsSaved: 0,
  plan: 'Free',
};

const PROFILE_KEY = 'kallemind_profile';
const NOTIFICATIONS_KEY = 'kallemind_notifications';

// Shared shape for both settings and legal menu rows so a single
// renderMenuGroup can safely accept either list.
interface MenuItem {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  action: string;
}

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

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const [storedProfile, storedNotifications] = await Promise.all([
        AsyncStorage.getItem(PROFILE_KEY),
        AsyncStorage.getItem(NOTIFICATIONS_KEY),
      ]);
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }
      if (storedNotifications !== null) {
        setNotifications(storedNotifications === 'true');
      }
    } catch (e) {
      console.log('Error loading profile:', e);
    }
    setLoading(false);
  };

  const toggleNotifications = async (value: boolean) => {
    setNotifications(value);
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, String(value));
    } catch (e) {
      console.log('Error saving notification preference:', e);
    }
  };

  const isValidEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

  const saveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert(t('errorTitle'), t('enterNameError'));
      return;
    }
    if (editEmail.trim() && !isValidEmail(editEmail.trim())) {
      Alert.alert(t('errorTitle'), t('enterValidEmailError'));
      return;
    }
    const updated: UserProfile = {
      ...profile,
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      age: editAge.trim(),
      gender: editGender.trim(),
    };
    setProfile(updated);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
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
            await AsyncStorage.removeItem(PROFILE_KEY);
            setProfile(DEFAULT_PROFILE);
            Alert.alert(t('doneTitle'), t('dataDeleted'));
          },
        },
      ]
    );
  };

  const settingsItems: MenuItem[] = [
    { icon: 'card-outline', label: t('subscriptionBilling'), action: 'subscription' },
    { icon: 'globe-outline', label: t('language'), action: 'language' },
    { icon: 'help-buoy-outline', label: t('helpSupport'), action: 'help' },
    { icon: 'trash-outline', label: t('deleteData'), action: 'delete' },
  ];

  const legalItems: MenuItem[] = [
    { icon: 'shield-checkmark-outline', label: t('privacyPolicy'), action: 'privacyPolicy' },
    { icon: 'document-text-outline', label: t('termsOfUse'), action: 'terms' },
    { icon: 'information-circle-outline', label: t('healthDisclaimer'), action: 'healthDisclaimer' },
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
    ? profile.name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '—';

  const renderMenuGroup = (items: MenuItem[]) => (
    <View style={styles.menuContainer}>
      {items.map((item, i) => (
        <TouchableOpacity
          key={item.action}
          style={[
            styles.menuItem,
            i < items.length - 1 && styles.menuItemBorder,
          ]}
          onPress={() => handleMenu(item.action)}
          activeOpacity={0.6}
        >
          <View style={[styles.menuIconWrap, item.action === 'delete' && styles.menuIconWrapDanger]}>
            <Ionicons
              name={item.icon}
              size={17}
              color={item.action === 'delete' ? colors.error : colors.text.secondary}
            />
          </View>
          <Text
            style={[styles.menuLabel, item.action === 'delete' && { color: colors.error }]}
            numberOfLines={2}
          >
            {item.label}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.text.muted ?? colors.text.secondary} />
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
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {profile.name || t('yourNamePlaceholder')}
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {profile.email || t('addYourEmailPlaceholder')}
              </Text>
              <View style={styles.planBadge}>
                <Text style={styles.planText} numberOfLines={1}>
                  {profile.plan} {t('planSuffix')}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={openEditModal} style={styles.editBtn} hitSlop={8}>
              <Ionicons name="pencil-outline" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {(profile.phone || profile.age || profile.gender) && (
            <View style={styles.metaRow}>
              {profile.phone ? (
                <Text style={styles.metaItem}>{profile.phone}</Text>
              ) : null}
              {profile.age ? (
                <Text style={styles.metaItem}>{profile.age} {t('yrsSuffix')}</Text>
              ) : null}
              {profile.gender ? (
                <Text style={styles.metaItem}>{profile.gender}</Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Setup banner if no name */}
        {!profile.name && (
          <TouchableOpacity style={styles.setupBanner} onPress={openEditModal} activeOpacity={0.85}>
            <View style={styles.setupIconWrap}>
              <Ionicons name="person-outline" size={18} color={colors.white} />
            </View>
            <View style={styles.setupTextWrap}>
              <Text style={styles.setupTitle} numberOfLines={1}>{t('setupProfile')}</Text>
              <Text style={styles.setupSub} numberOfLines={2}>{t('setupProfileSub')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        )}

        {/* Upgrade Banner */}
        {profile.plan === 'Free' && (
          <TouchableOpacity style={styles.upgradeBanner} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.85}>
            <View style={styles.upgradeTextWrap}>
              <Text style={styles.upgradeTitle} numberOfLines={1}>{t('upgradePremium')}</Text>
              <Text style={styles.upgradeSub} numberOfLines={2}>{t('unlockUnlimited')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.white} />
          </TouchableOpacity>
        )}

        {/* Stats */}
        <Text style={styles.sectionLabel}>{t('yourActivity')}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profile.symptomChecks}</Text>
            <Text
              style={styles.statLabel}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {t('symptomChecks')}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profile.articlesRead}</Text>
            <Text
              style={styles.statLabel}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {t('articlesRead')}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profile.doctorsSaved}</Text>
            <Text
              style={styles.statLabel}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {t('doctorsSaved')}
            </Text>
          </View>
        </View>

        {/* Notifications Toggle */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleLeft}>
            <View style={styles.menuIconWrap}>
              <Ionicons name="notifications-outline" size={17} color={colors.text.secondary} />
            </View>
            <Text style={styles.toggleLabel}>{t('pushNotifications')}</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={toggleNotifications}
            trackColor={{ false: colors.border, true: colors.accentGreen }}
            thumbColor={colors.white}
          />
        </View>

        {/* Settings menu */}
        <Text style={styles.sectionLabel}>{t('settings')}</Text>
        {renderMenuGroup(settingsItems)}

        {/* Legal menu */}
        <Text style={styles.sectionLabel}>{t('privacySecurity')}</Text>
        {renderMenuGroup(legalItems)}

        {/* Contact */}
        <TouchableOpacity
          style={styles.contactBtn}
          onPress={() => Linking.openURL('mailto:kallemind@gmail.com')}
          activeOpacity={0.7}
        >
          <Ionicons name="mail-outline" size={16} color={colors.text.secondary} />
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
                <TouchableOpacity onPress={() => setEditModal(false)} hitSlop={8}>
                  <Ionicons name="close" size={22} color={colors.text.primary} />
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

              <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>{t('saveProfile')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Language Picker Modal */}
      <Modal visible={languageModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('language')}</Text>
                <TouchableOpacity onPress={() => setLanguageModal(false)} hitSlop={8}>
                  <Ionicons name="close" size={22} color={colors.text.primary} />
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
                  activeOpacity={0.7}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={styles.languageName} numberOfLines={1}>{lang.nativeName}</Text>
                  {i18n.language === lang.code && (
                    <Ionicons name="checkmark" size={18} color={colors.accentGreen} />
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

  profileCard: { backgroundColor: colors.card, margin: spacing.md, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.navBackground, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: fontSizes.lg, letterSpacing: 0.5 },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: { color: colors.navBackground, fontWeight: '700', fontSize: fontSizes.lg },
  profileEmail: { color: colors.text.secondary, fontSize: fontSizes.sm, marginTop: 1, marginBottom: 6 },
  planBadge: { backgroundColor: '#eef2f6', borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2, alignSelf: 'flex-start' },
  planText: { color: colors.text.secondary, fontSize: fontSizes.xs, fontWeight: '700', letterSpacing: 0.3 },
  editBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f5fa' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  metaItem: { color: colors.text.secondary, fontSize: fontSizes.xs, backgroundColor: '#f0f5fa', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },

  setupBanner: { backgroundColor: colors.navBackground, borderRadius: borderRadius.lg, padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  setupIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  setupTextWrap: { flex: 1, minWidth: 0 },
  setupTitle: { color: colors.white, fontWeight: '700', fontSize: fontSizes.sm },
  setupSub: { color: 'rgba(255,255,255,0.75)', fontSize: fontSizes.xs, marginTop: 2, lineHeight: 15 },

  upgradeBanner: { backgroundColor: colors.accentGreen, borderRadius: borderRadius.lg, padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  upgradeTextWrap: { flex: 1, minWidth: 0, marginRight: spacing.sm },
  upgradeTitle: { color: colors.white, fontWeight: '700', fontSize: fontSizes.md },
  upgradeSub: { color: 'rgba(255,255,255,0.85)', fontSize: fontSizes.xs, marginTop: 2, lineHeight: 15 },

  sectionLabel: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xs, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: colors.text.secondary },

  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.md, marginHorizontal: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, paddingVertical: spacing.md },
  statCard: { flex: 1, minWidth: 0, alignItems: 'center', gap: 3, paddingHorizontal: 4 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  statNumber: { color: colors.navBackground, fontWeight: '800', fontSize: fontSizes.lg },
  statLabel: { color: colors.text.secondary, fontSize: 10.5, textAlign: 'center', lineHeight: 13 },

  toggleCard: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginHorizontal: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toggleLabel: { color: colors.text.primary, fontSize: fontSizes.sm, fontWeight: '500' },

  menuContainer: { backgroundColor: colors.card, borderRadius: borderRadius.lg, marginHorizontal: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIconWrap: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#f0f5fa', alignItems: 'center', justifyContent: 'center' },
  menuIconWrapDanger: { backgroundColor: '#fdeeee' },
  menuLabel: { flex: 1, minWidth: 0, color: colors.text.primary, fontSize: fontSizes.sm, fontWeight: '500' },

  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.sm, marginBottom: spacing.xs },
  contactBtnText: { color: colors.text.secondary, fontSize: fontSizes.sm, fontWeight: '500' },
  version: { color: colors.text.muted ?? colors.text.secondary, fontSize: fontSizes.xs, textAlign: 'center', marginBottom: spacing.sm },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.card, borderRadius: 20, padding: spacing.lg, paddingBottom: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.navBackground },
  rowInputs: { flexDirection: 'row', gap: spacing.sm },
  inputLabel: { fontSize: fontSizes.sm, fontWeight: '600', color: colors.text.secondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { backgroundColor: '#f0f5fa', borderRadius: borderRadius.md, padding: spacing.md, color: colors.text.primary, fontSize: fontSizes.sm, borderWidth: 1, borderColor: colors.border },
  saveBtn: { backgroundColor: colors.accentGreen, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: fontSizes.md },
  languageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: borderRadius.md },
  languageRowActive: { backgroundColor: '#eef2f6' },
  languageFlag: { fontSize: 22 },
  languageName: { flex: 1, minWidth: 0, fontSize: fontSizes.sm, fontWeight: '600', color: colors.text.primary },
});