import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { MatchProvider } from '@/context/MatchContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { PlayersProvider } from '@/context/PlayersContext';

const modal = { presentation: 'modal', animation: 'slide_from_bottom' } as const;

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <PlayersProvider>
            <MatchProvider>
              <NotificationsProvider>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.navy } }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="sign-in" options={{ animation: 'fade' }} />
                  <Stack.Screen name="match-details" options={modal} />
                  <Stack.Screen name="match-squad" options={modal} />
                  <Stack.Screen name="add-player" options={modal} />
                  <Stack.Screen name="edit-player" options={modal} />
                  <Stack.Screen name="notifications" options={modal} />
                </Stack>
              </NotificationsProvider>
            </MatchProvider>
          </PlayersProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
