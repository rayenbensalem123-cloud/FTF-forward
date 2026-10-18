import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, Gamepad2, Home, LayoutGrid, Sun, User, Users } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

/**
 * Two navigators, chosen by the signed-in role:
 *
 *   staff  : Today · Squad · Games · Camp · More
 *   player : Home · Schedule · Games · Profile
 *
 * Camp is the coach's editor for the daily program. Reports (the club match
 * form) is reached from the player's home or the More grid, so it stays
 * mounted but hidden from the tab bar.
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { t, ready: langReady } = useLanguage();
  const { ready, user } = useAuth();

  if (!ready || !langReady) return null;
  if (!user) return <Redirect href="/sign-in" />;

  const isStaff = user.role === 'staff' || user.role === 'admin';

  const options = {
    headerShown: false,
    tabBarActiveTintColor: colors.white,
    tabBarInactiveTintColor: colors.muted,
    tabBarLabelStyle: { fontFamily: fonts.display, fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },
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

  const hidden = { href: null } as const;

  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen
        name="index"
        options={{
          title: isStaff ? 'Today' : t('tabHome'),
          tabBarIcon: ({ color, size }) => (isStaff ? <Sun color={color} size={size} /> : <Home color={color} size={size} />),
        }}
      />
      <Tabs.Screen name="squad" options={isStaff ? {
        title: t('tabSquad'),
        tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
      } : hidden} />
      <Tabs.Screen name="schedule" options={isStaff ? hidden : {
        title: t('tabSchedule'),
        tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
      }} />
      <Tabs.Screen
        name="games"
        options={{
          title: t('tabGames'),
          tabBarIcon: ({ color, size }) => <Gamepad2 color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="camp" options={isStaff ? {
        title: 'Camp',
        tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
      } : hidden} />
      <Tabs.Screen name="more" options={isStaff ? {
        title: 'More',
        tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} />,
      } : hidden} />
      <Tabs.Screen name="profile" options={isStaff ? hidden : {
        title: t('tabProfile'),
        tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
      }} />
      <Tabs.Screen name="reports" options={hidden} />
      <Tabs.Screen name="stats" options={hidden} />
    </Tabs>
  );
}
