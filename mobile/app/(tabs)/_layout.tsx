import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Menu, Shirt, Trophy } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { t, ready: langReady } = useLanguage();
  const { ready, user } = useAuth();

  // Wait for the saved session and language (so the tabs never flash the wrong text or direction),
  // then send signed-out users to the sign-in screen.
  if (!ready || !langReady) return null;
  if (!user) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.goldBorder,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
        },
        sceneStyle: { backgroundColor: colors.navy },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabHome'), tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="matches" options={{ title: t('tabMatches'), tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} /> }} />
      <Tabs.Screen name="lineup" options={{ title: t('tabLineup'), tabBarIcon: ({ color, size }) => <Shirt color={color} size={size} /> }} />
      {/* Squad, Stats and Profile live behind "More", so the bar stays short. */}
      <Tabs.Screen name="more" options={{ title: t('tabMore'), tabBarIcon: ({ color, size }) => <Menu color={color} size={size} /> }} />
    </Tabs>
  );
}
