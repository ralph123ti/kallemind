import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import DisclaimerBanner from '../components/DisclaimerBanner';

import HomeScreen from '../screens/Home/HomeScreen';
import SymptomCheckerScreen from '../screens/SymptomChecker/SymptomCheckerScreen';
import DoctorsScreen from '../screens/Doctors/DoctorsScreen';
import ArticlesScreen from '../screens/Articles/ArticlesScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SubscriptionScreen from '../screens/Subscription/SubscriptionScreen';
import DoctorSubscriptionScreen from '../screens/Subscription/DoctorSubscriptionScreen';
import SplashScreen from '../screens/Splash/SplashScreen';
import TermsScreen from '../screens/Terms/TermsScreen';
import HelpScreen from '../screens/Help/HelpScreen';
// New: Privacy Policy and Health Disclaimer screens, both live in screens/Legal
import PrivacyPolicyScreen from '../screens/Legal/PrivacyPolicyScreen';
import HealthDisclaimerScreen from '../screens/Legal/HealthDisclaimerScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcons: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Checker: { active: 'search', inactive: 'search-outline' },
  Doctors: { active: 'people', inactive: 'people-outline' },
  Articles: { active: 'book', inactive: 'book-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.navBackground,
          borderTopColor: 'rgba(255,255,255,0.07)',
          height: 56 + (Platform.OS === 'android' ? insets.bottom : 0),
          paddingBottom: Platform.OS === 'android' ? insets.bottom : 8,
          paddingTop: 4,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.accentGreen,
        tabBarInactiveTintColor: '#4a6a80',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = tabIcons[route.name];
          return (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Checker" component={SymptomCheckerScreen} options={{ title: 'Checker' }} />
      <Tab.Screen name="Doctors" component={DoctorsScreen} />
      <Tab.Screen name="Articles" component={ArticlesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Subscription" component={SubscriptionScreen} />
          {/* New: doctor paywall, reached at the end of doctor signup/onboarding */}
          <Stack.Screen name="DoctorSubscription" component={DoctorSubscriptionScreen} />
          <Stack.Screen name="Terms" component={TermsScreen} />
          <Stack.Screen name="Help" component={HelpScreen} />
          {/* New: reachable from Profile > Legal */}
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="HealthDisclaimer" component={HealthDisclaimerScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <DisclaimerBanner />
    </View>
  );
}