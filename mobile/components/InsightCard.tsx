import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '@/constants/theme';

/**
 * One of the dashboard's insight cards: a title over a chart. The three cards
 * sit in a row and share this shell so their internals can differ (two radars
 * and a bar) without the frames drifting apart.
 */
export function InsightCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: space.md,
  },
  title: { color: colors.white, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  body: { alignItems: 'center', justifyContent: 'center', minHeight: 96 },
});
