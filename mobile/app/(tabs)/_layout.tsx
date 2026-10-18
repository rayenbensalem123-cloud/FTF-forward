import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, ClipboardList, Gamepad2, Home, User } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

/**
 * Two navigators, chosen by the signed-in role:
 *
 *   staff  : Dashboard · Calendar · Reports · Games · Profile
 *   player : Home · Schedule · Games · Reports · Profile
 *
 * Calendar is the camp-program screen, which the database already filters per
 * role, so it is the same route for both. Reports and Games were promoted
 * from the More stack to tabs; Reports sits after Games for players so a
 * self-logged club match is one tap from anywhere.
 *
 * Stats, Squad and More stay mounted but hidden: their contents get placed on
 * real pages next, and nothing links to them today except the tab bar itself.
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
  // labels in the display face, white when active and muted otherwise.
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

  return (
    <Tabs screenOptions={options}>
      {/* ── Role-dependent titles, fixed order ────────── */}
      {/* Players get Reports too, but after Games: Home · Schedule · Games ·
          Reports · Profile, so logging a club match never hides behind Profile. */}
      <Tabs.Screen
        name="index"
        options={{
          title: isStaff ? t('tabDashboard') : t('tabHome'),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: isStaff ? t('tabCalendar') : t('tabSchedule'),
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      {isStaff ? (
        <Tabs.Screen
          name="reports"
          options={{
            title: t('tabReports'),
            tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
          }}
        />
      ) : null}
      <Tabs.Screen
        name="games"
        options={{
          title: t('tabGames'),
          tabBarIcon: ({ color, size }) => <Gamepad2 color={color} size={size} />,
        }}
      />
      {isStaff ? null : (
        <Tabs.Screen
          name="reports"
          options={{
            title: t('tabReports'),
            tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabProfile'),
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      {/* ── Mounted but hidden until their contents are placed ────────── */}
      <Tabs.Screen name="stats" options={{ href: null }} />
      <Tabs.Screen name="squad" options={{ href: null }} />
      <Tabs.Screen name="more" options={{ href: null }} />
    </Tabs>
  );
}
