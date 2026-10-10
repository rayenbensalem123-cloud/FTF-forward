import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { MatchProvider } from '@/context/MatchContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { PlayersProvider } from '@/context/PlayersContext';

const modal = { presentation: 'modal', animation: 'slide_from_bottom' } as const;

/**
 * One `direction` on the root flips every row, offset and text alignment below it for Arabic.
 * I18nManager.forceRTL is not used: Android only reads it when the app restarts.
 */
function DirectionalRoot({ children }: { children: React.ReactNode }) {
  const { isRtl } = useLanguage();
  return <View style={{ flex: 1, direction: isRtl ? 'rtl' : 'ltr' }}>{children}</View>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <DirectionalRoot>
        <AuthProvider>
          <PlayersProvider>
            <MatchProvider>
              <NotificationsProvider>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.navy } }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="sign-in" options={{ animation: 'fade' }} />
                  <Stack.Screen name="sign-up" options={{ animation: 'fade' }} />
                  <Stack.Screen name="match-details" options={modal} />
                  <Stack.Screen name="match-squad" options={modal} />
                  <Stack.Screen name="add-player" options={modal} />
                  <Stack.Screen name="edit-player" options={modal} />
                  <Stack.Screen name="notifications" options={modal} />
                  <Stack.Screen name="id-card" options={modal} />
                </Stack>
              </NotificationsProvider>
            </MatchProvider>
          </PlayersProvider>
        </AuthProvider>
        </DirectionalRoot>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
