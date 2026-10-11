import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { colors, radius, space } from '@/constants/theme';
import { Button } from '@/components/Button';

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
      <Button
        title={cta}
        onPress={() => router.push(href)}
        icon={<Text style={styles.chevron}>›</Text>}
      />
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
  chevron: { color: colors.navy, fontSize: 15, fontWeight: '700', lineHeight: 15 },
});
