import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, Calendar, Home, Menu, User, Users } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

/**
 * Two navigators, chosen by the signed-in role, as in the redesign prototype:
 *
 *   staff  : Squad · Home · Stats · More
 *   player : Home · Schedule · Stats · Profile
 *
 * `href: null` hides a tab without deleting its route: Schedule and Profile are
 * hidden for staff, Squad and More for players. Lineup and Matches are no
 * longer tabs at all -- they were moved to the root stack (app/lineup.tsx,
 * app/matches.tsx) and are pushed from Home with a back button.
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { t, ready: langReady } = useLanguage();
  const { ready, user } = useAuth();

  // Wait for the saved session and language (so the tabs never flash the wrong text or direction),
  // then send signed-out users to the sign-in screen.
  if (!ready || !langReady) return null;
  if (!user) return <Redirect href="/sign-in" />;

  const isStaff = user.role === 'staff' || user.role === 'admin';

  // Prototype tab bar: card background, hairline top border, 10px uppercase
  // labels, gold when active and muted otherwise.
  const options = {
    headerShown: false,
    tabBarActiveTintColor: colors.gold,
    tabBarInactiveTintColor: colors.muted,
    tabBarLabelStyle: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },
    tabBarStyle: {
      backgroundColor: colors.card,
      borderTopColor: colors.hairline,
      borderTopWidth: 1,
      height: 56 + insets.bottom,
      paddingBottom: insets.bottom + 6,
      paddingTop: 8,
    },
    sceneStyle: { backgroundColor: colors.navy },
  };

  return (
    <Tabs screenOptions={options}>
      {/* ── Role-dependent visibility, fixed order ────────── */}
      <Tabs.Screen
        name="squad"
        options={{
          title: t('tabSquad'),
          href: isStaff ? undefined : null,
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabHome'),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: t('tabSchedule'),
          href: isStaff ? null : undefined,
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t('tabStats'),
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabProfile'),
          href: isStaff ? null : undefined,
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('tabMore'),
          href: isStaff ? undefined : null,
          tabBarIcon: ({ color, size }) => <Menu color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
