import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { colors, radius, space } from '@/constants/theme';

/**
 * One of the home screen's feature cards: a title, an optional one-line
 * description, a visual, and a gold call to action that opens a real screen.
 *
 * The four cards are the home's way into the parts of the app that are
 * otherwise buried behind the staff-only "More" tab -- the tactic board,
 * scouting, recovery and match analysis. Each CTA is a route, not a dead
 * button.
 */
export function FeatureCard({
  title,
  description,
  cta,
  href,
  children,
}: {
  title: string;
  description?: string;
  cta: string;
  href: Href;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {!!description && <Text style={styles.desc} numberOfLines={2}>{description}</Text>}
      <View style={styles.visual}>{children}</View>
      <TouchableOpacity
        style={styles.cta}
        onPress={() => router.push(href)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={cta}
      >
        <Text style={styles.ctaText}>{cta}</Text>
        <Text style={styles.ctaChevron}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: space.md,
  },
  title: { color: colors.white, fontSize: 14, fontWeight: '800' },
  desc: { color: colors.muted, fontSize: 11, fontWeight: '600', marginTop: 3, lineHeight: 15 },
  visual: { marginVertical: space.sm, minHeight: 72, justifyContent: 'center' },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    marginTop: space.sm,
  },
  ctaText: { color: colors.navy, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  ctaChevron: { color: colors.navy, fontSize: 15, fontWeight: '700', lineHeight: 15 },
});
