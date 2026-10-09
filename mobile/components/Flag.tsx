import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { FLAG_IMAGES } from '@/lib/flagImages';
import { flagCodeFor } from '@/lib/countryFlags';

/** A country's flag by name ("Morocco", "Côte d'Ivoire"...). Renders nothing for an unknown name. */
export function Flag({ name, width = 24 }: { name?: string | null; width?: number }) {
  const code = flagCodeFor(name);
  const source = code ? FLAG_IMAGES[code] : undefined;
  if (!source) return null;
  const height = Math.round((width * 3) / 4);
  return (
    <Image
      source={source}
      style={[styles.flag, { width, height, borderRadius: Math.max(2, width / 9) }]}
      accessibilityLabel={name ?? undefined}
    />
  );
}

const styles = StyleSheet.create({
  flag: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.goldBorder },
});
