import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

/** The "More" tab is its own stack: a menu first, then Squad, Stats or Profile with a back button. */
export default function MoreLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.navy } }} />;
}
