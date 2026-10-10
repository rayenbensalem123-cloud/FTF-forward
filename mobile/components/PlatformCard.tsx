import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '@/context/LanguageContext';
import type { Player } from '@/types';

/** The website's squad card tokens (app/globals.css), so the opened card reads the same. */
const P = {
  panel: '#112950', panel4: '#0e2345', body: '#0a1c38', blueDk: '#1b3a66', hover: '#2a4568',
  cream: '#f7f1e6', warm: '#a89c8a', warm2: '#c2b7a6', red: '#e3062c', gold: '#f6c744',
} as const;

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const ABS = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

/** The platform's player card: photo strip on the left, name, number and stats on the right. */
export function PlatformCard({ player: p }: { player: Player }) {
  const { t } = useLanguage();
  const [failed, setFailed] = useState(false);
  const photo = !!p.photoUrl && !failed;
  const num = p.number ? String(p.number).padStart(2, '0') : '—';
  const stats: [string, string][] = [
    [t('age'), p.age > 0 ? String(p.age) : '—'],
    [t('caps'), String(p.caps)],
    [t('goals'), String(p.goals)],
    [t('assists'), String(p.assists)],
  ];

  return (
    <View style={styles.card}>
      <View style={styles.photo}>
        {photo ? (
          <Image source={{ uri: p.photoUrl }} style={[ABS, { width: '100%', height: '100%' }]} resizeMode="cover" onError={() => setFailed(true)} />
        ) : (
          <>
            <LinearGradient colors={[P.blueDk, P.panel, P.body]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={ABS} />
            <View style={styles.center}><Text style={styles.ghost}>{p.position}</Text></View>
            <Text style={styles.brand}>TUNISIA WNT</Text>
          </>
        )}
        <LinearGradient colors={['rgba(12,31,61,0.2)', 'rgba(12,31,61,0)', 'rgba(12,31,61,0.75)']} style={ABS} pointerEvents="none" />
        <Text style={styles.posOnPhoto}>{p.position}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.club} numberOfLines={1}>{p.club || 'TUNISIA'}</Text>
        <Text style={styles.name}>{titleCase(p.name)}</Text>
        <View style={styles.badgeRow}>
          <Text style={styles.posBadge}>{p.position}</Text>
          <Text style={styles.tag}>TUNISIA WNT</Text>
        </View>

        <View style={{ marginTop: 16, gap: 8 }}>
          <View style={styles.numRow}>
            <Text style={styles.num}>№ {num}</Text>
            <Text style={styles.national}>NATIONAL</Text>
          </View>
          <Text style={styles.meta}>
            {(p.nationality || 'TUN').slice(0, 3).toUpperCase()}{p.height ? `  •  ${p.height} cm` : ''}
          </Text>
          <View style={styles.cards}>
            <View style={styles.chip}><View style={[styles.dot, { backgroundColor: '#facc15' }]} /><Text style={styles.chipText}>{p.yellowCards} YC</Text></View>
            <View style={styles.chip}><View style={[styles.dot, { backgroundColor: P.red }]} /><Text style={styles.chipText}>{p.redCards} RC</Text></View>
          </View>
        </View>

        <Text style={styles.watermark} pointerEvents="none">{num}</Text>

        <View style={styles.strip}>
          {stats.map(([l, v], i) => (
            <View key={l} style={[styles.stat, i > 0 && { borderLeftWidth: 1, borderLeftColor: P.hover }]}>
              <Text style={styles.statLabel} numberOfLines={1}>{l}</Text>
              <Text style={styles.statValue}>{v}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.bar} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', height: 340, backgroundColor: P.panel, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: P.hover },
  photo: { width: 112, borderRightWidth: 1, borderRightColor: P.hover, overflow: 'hidden' },
  center: { ...ABS, alignItems: 'center', justifyContent: 'center' },
  ghost: { color: 'rgba(247,241,230,0.22)', fontSize: 42, fontWeight: '900', fontStyle: 'italic' },
  brand: { position: 'absolute', bottom: 6, left: 8, color: 'rgba(168,156,138,0.7)', fontSize: 7, fontWeight: '900', letterSpacing: 2 },
  posOnPhoto: { position: 'absolute', bottom: 8, left: 8, color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '900', fontStyle: 'italic' },
  body: { flex: 1, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 14, minWidth: 0 },
  club: { color: P.warm2, fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  name: { color: P.cream, fontSize: 22, lineHeight: 24, fontWeight: '900', textTransform: 'uppercase', marginTop: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  posBadge: { backgroundColor: P.red, color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1.6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2, overflow: 'hidden' },
  tag: { color: 'rgba(247,241,230,0.55)', fontSize: 8, fontWeight: '900', letterSpacing: 2 },
  numRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  num: { color: P.red, fontSize: 26, fontWeight: '900', fontStyle: 'italic' },
  national: { color: 'rgba(247,241,230,0.45)', fontSize: 8, fontWeight: '900', letterSpacing: 2.4 },
  meta: { color: P.warm, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  cards: { flexDirection: 'row', gap: 8, paddingTop: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: P.hover, backgroundColor: P.panel4, borderRadius: 2, paddingHorizontal: 6, paddingVertical: 3 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { color: P.warm, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 },
  watermark: { position: 'absolute', right: 6, bottom: 70, color: 'rgba(227,6,44,0.09)', fontSize: 88, fontWeight: '900', fontStyle: 'italic' },
  strip: { marginTop: 'auto', flexDirection: 'row', borderWidth: 1, borderColor: P.hover, borderRadius: 8, overflow: 'hidden' },
  stat: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 8, paddingHorizontal: 2 },
  statLabel: { color: P.warm, fontSize: 7, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  statValue: { color: P.cream, fontSize: 18, fontWeight: '800' },
  role: { color: P.gold, fontSize: 16, lineHeight: 18, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase' },
  license: { color: P.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1, borderWidth: 1, borderColor: 'rgba(246,199,68,0.3)', backgroundColor: 'rgba(246,199,68,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2, overflow: 'hidden' },
  staffMark: { position: 'absolute', right: 8, bottom: 56, color: 'rgba(246,199,68,0.07)', fontSize: 130, fontWeight: '900', fontStyle: 'italic' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: P.red },
});

/** The platform's staff card: the role takes the place of the jersey number. */
export function StaffCard({ staff: s, ageLabel, badge }: { staff: import('@/lib/staff').StaffMember; ageLabel: string; badge: string }) {
  const [failed, setFailed] = useState(false);
  const photo = !!s.photoUrl && !failed;
  return (
    <View style={[styles.card, { height: 260 }]}>
      <View style={styles.photo}>
        {photo ? (
          <Image source={{ uri: s.photoUrl }} style={[ABS, { width: '100%', height: '100%' }]} resizeMode="cover" onError={() => setFailed(true)} />
        ) : (
          <>
            <LinearGradient colors={[P.blueDk, P.panel, P.body]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={ABS} />
            <View style={styles.center}><Text style={styles.ghost}>T</Text></View>
            <Text style={styles.brand}>TUNISIA WNT</Text>
          </>
        )}
        <LinearGradient colors={['rgba(12,31,61,0.2)', 'rgba(12,31,61,0)', 'rgba(12,31,61,0.75)']} style={ABS} pointerEvents="none" />
        <Text style={styles.posOnPhoto}>T</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.club} numberOfLines={1}>{s.nationality || 'TUNISIA'}</Text>
        <Text style={styles.name}>{titleCase(s.name)}</Text>
        <Text style={[styles.tag, { marginTop: 6 }]}>{badge.toUpperCase()}</Text>
        <View style={{ marginTop: 14, gap: 8 }}>
          <View style={{ height: 1, width: 32, backgroundColor: 'rgba(246,199,68,0.6)' }} />
          <Text style={styles.role}>{s.role || '—'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.meta}>{(s.nationality || 'TUN').slice(0, 3).toUpperCase()}</Text>
            {!!s.license && <Text style={styles.license}>{s.license}</Text>}
          </View>
        </View>
        <Text style={styles.staffMark} pointerEvents="none">T</Text>
        <View style={styles.strip}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>{ageLabel}</Text>
            <Text style={styles.statValue}>{s.age > 0 ? s.age : '—'}</Text>
          </View>
        </View>
      </View>
      <View style={styles.bar} />
    </View>
  );
}
