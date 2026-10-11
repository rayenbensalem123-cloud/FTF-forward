import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space } from '@/constants/theme';

export interface BoardRow { key: string; name: string; value: string; sub?: string }

/** Ranked list used by both games' leaderboards. White for the leader, "you" highlighted. */
export function Board({ rows, you, youLabel, unit }: { rows: BoardRow[]; you: string; youLabel: string; unit: string }) {
  const medal = ['#EDEFF4', '#C9D3E6', '#D18A4F'];
  return (
    <View style={{ gap: 6 }}>
      {rows.map((r, i) => {
        const mine = r.key.toLowerCase() === you.toLowerCase();
        return (
          <View key={r.key} style={[s.row, mine && s.rowMine]}>
            <Text style={[s.rank, { color: medal[i] ?? colors.muted }]}>{i + 1}</Text>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.name} numberOfLines={1}>{r.name}{mine ? `  (${youLabel})` : ''}</Text>
              {!!r.sub && <Text style={s.sub} numberOfLines={1}>{r.sub}</Text>}
            </View>
            <Text style={s.value}>{r.value}<Text style={s.unit}> {unit}</Text></Text>
          </View>
        );
      })}
    </View>
  );
}

export function Notice({ text, tone = 'muted' }: { text: string; tone?: 'muted' | 'light' }) {
  return (
    <View style={[s.notice, tone === 'light' && { borderColor: 'rgba(255,255,255,0.35)', backgroundColor: colors.whiteSoft }]}>
      <Text style={[s.noticeText, tone === 'light' && { color: colors.white }]}>{text}</Text>
    </View>
  );
}

export const gameButton = StyleSheet.create({
  primary: { backgroundColor: colors.red, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  disabled: { opacity: 0.45 },
  soft: { backgroundColor: colors.cardRaised, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: space.lg, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  softText: { color: colors.white, fontWeight: '800', fontSize: 13 },
});

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.cardRaised, borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: space.md },
  rowMine: { borderWidth: 1, borderColor: colors.red },
  rank: { width: 22, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  name: { color: colors.white, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  sub: { color: colors.muted, fontSize: 10, fontWeight: '600', marginTop: 1 },
  value: { color: colors.white, fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  unit: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  notice: { borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.hairline, padding: space.lg },
  noticeText: { color: colors.muted, fontSize: 12, fontWeight: '700', lineHeight: 18 },
});
