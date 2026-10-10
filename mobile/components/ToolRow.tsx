import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import { ForwardChevron } from '@/components/ForwardChevron';
import { colors, space } from '@/constants/theme';

export interface ToolItem { href: Href; icon: LucideIcon; title: string; desc: string }

/** One row of a tools card: gold icon, title, one-line description, chevron. */
export function ToolRow({ item, first }: { item: ToolItem; first: boolean }) {
  const router = useRouter();
  const Icon = item.icon;
  return (
    <TouchableOpacity style={[styles.row, !first && styles.divider]} onPress={() => router.push(item.href)}
      activeOpacity={0.75} accessibilityRole="button" accessibilityLabel={item.title}>
      <View style={styles.iconWrap}><Icon color={colors.gold} size={18} /></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.desc} numberOfLines={1}>{item.desc}</Text>
      </View>
      <ForwardChevron />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: colors.hairline },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.cardRaised, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.white, fontSize: 14, fontWeight: '700' },
  desc: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
