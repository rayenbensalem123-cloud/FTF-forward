import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/theme';

/**
 * The one button. Three variants, one shape:
 *
 *   primary   federation red fill, white text -- the single action on a card
 *   secondary transparent, hairline border, white text -- the second action
 *   ghost     no border, muted text -- the least important action
 *
 * Rounded rectangles, not pills: the cards they sit on are rectangles, and a
 * pill inside a rectangle fights the card for the eye. Every button in the
 * app goes through this so the height, radius, tracking and weight are
 * identical everywhere.
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
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: React.ReactNode;
  accessibilityLabel?: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.base, variant === 'primary' && styles.primary, variant === 'secondary' && styles.secondary, variant === 'ghost' && styles.ghost]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      {icon}
      <Text style={[styles.text, variant === 'ghost' ? styles.textMuted : styles.textOnDark]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  primary: { backgroundColor: colors.red },
  secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  ghost: { backgroundColor: 'transparent' },
  text: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  textOnDark: { color: colors.white },
  textMuted: { color: colors.muted },
});
