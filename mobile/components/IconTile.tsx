import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import { accent, colors, radius, typeScale } from '@/constants/theme';

/**
 * The design's quick-action tile: a rounded square with the icon in the accent
 * colour and a short label under it. Four of them sit in a row (`flex: 1` each,
 * so they divide the width evenly whatever the label length).
 *
 * The previous home screen used a two-column grid of large cards, which meant
 * four features filled a whole screen and everything else fell below the fold.
 * This keeps the same four routes but costs about a third of the height.
 */
export function IconTile({
  href,
  icon: Icon,
  label,
}: {
  href: Href;
  icon: LucideIcon;
  label: string;
}) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.tile}
      activeOpacity={0.75}
      onPress={() => router.push(href)}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.iconWrap}>
        <Icon color={colors.gold} size={20} strokeWidth={2} />
      </View>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, alignItems: 'center', gap: 8, minWidth: 0 },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typeScale.body, fontWeight: '600', color: colors.white, textAlign: 'center' },
});
