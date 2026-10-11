import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius } from '@/constants/theme';

/**
 * The one button. Three variants, one shape:
 *
 *   primary   gold fill, navy text   -- the single action on a card
 *   secondary gold outline, gold text -- the second action, same weight
 *   ghost     no outline, muted text  -- the least important action
 *
 * Every button in the app goes through this so the height, radius, tracking
 * and weight are identical everywhere. Before this, the hero, the feature
 * cards and the header each had their own idea of a button.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: React.ReactNode;
  accessibilityLabel?: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      {icon}
      <Text style={[styles.text, variant === 'primary' ? styles.textOnGold : styles.textOnDark]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
  },
  primary: { backgroundColor: colors.gold },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(246,199,68,0.45)' },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.red },
  text: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  textOnGold: { color: colors.navy },
  textOnDark: { color: colors.gold },
});
