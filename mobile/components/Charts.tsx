import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';
import { colors } from '@/constants/theme';

/**
 * The dashboard's charts, drawn directly on react-native-svg. No chart library
 * is installed and the cards are small, so a hand-rolled radar and bar are
 * both lighter and easier to keep on-brand than pulling one in.
 */

/** A radar (spider) chart: concentric grid, one axis per label, one data polygon. */
export function RadarChart({
  data,
  labels,
  size = 116,
  color = colors.gold,
}: {
  /** One value per axis, each 0..1. */
  data: number[];
  labels: string[];
  size?: number;
  color?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 16;
  const n = data.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, f: number): [number, number] => {
    const a = angle(i);
    return [cx + Math.cos(a) * r * f, cy + Math.sin(a) * r * f];
  };
  const ring = (f: number) => data.map((_, i) => point(i, f).join(',')).join(' ');
  const dataPoly = data.map((d, i) => point(i, Math.max(d, 0.04)).join(',')).join(' ');

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {[0.33, 0.66, 1].map((f) => (
          <Polygon key={f} points={ring(f)} fill="none" stroke={colors.hairline} strokeWidth={1} />
        ))}
        {data.map((_, i) => {
          const [x, y] = point(i, 1);
          return <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={colors.hairline} strokeWidth={1} />;
        })}
        <Polygon points={dataPoly} fill={color} fillOpacity={0.22} stroke={color} strokeWidth={1.5} />
        {data.map((d, i) => {
          const [x, y] = point(i, Math.max(d, 0.04));
          return <Circle key={i} cx={x} cy={y} r={2} fill={color} />;
        })}
      </Svg>
      {labels.map((label, i) => {
        const [x, y] = point(i, 1.24);
        return (
          <View key={label} pointerEvents="none" style={[styles.radarLabel, { left: x - 16, top: y - 6 }]}>
            <Text style={styles.radarLabelText}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** A simple bar chart with a shared baseline and value-scaled heights. */
export function BarChart({
  data,
  color = colors.gold,
  height = 76,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={[styles.bars, { height }]}>
      {data.map((d) => (
        <View key={d.label} style={styles.barCol}>
          <View
            style={{
              width: '68%',
              height: `${Math.max((d.value / max) * 100, 4)}%`,
              backgroundColor: color,
              borderRadius: 3,
              opacity: d.value === max ? 1 : 0.55,
            }}
          />
          <Text style={styles.barLabel} numberOfLines={1}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  radarLabel: { position: 'absolute', width: 32, alignItems: 'center' },
  radarLabelText: { color: colors.muted, fontSize: 8, fontWeight: '700', letterSpacing: 0.4 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  barCol: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  barLabel: { color: colors.muted, fontSize: 8, fontWeight: '700' },
});
