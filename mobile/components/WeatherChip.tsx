import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { loadMatchInfo } from '@/lib/weather';
import type { WeatherKind } from '@/lib/travel';

const ICONS: Record<WeatherKind, typeof Sun> = {
  clear: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

/**
 * The match-day temperature for the venue, from Open-Meteo via lib/weather: a
 * condition icon and the high/low on one compact line, made to sit at the end
 * of the banner's footer row next to the venue.
 *
 * The platform stores a venue name and no coordinates, so the city is geocoded
 * by name and the forecast is best effort -- if it fails or the match is
 * beyond the forecast range the chip renders nothing rather than a wrong
 * number.
 */
export function WeatherChip({ venue, date }: { venue: string; date: string }) {
  const [text, setText] = React.useState<string | null>(null);
  const [kind, setKind] = React.useState<WeatherKind | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    loadMatchInfo(venue, date, new Date().toISOString().slice(0, 10))
      .then((info) => {
        if (!alive) return;
        const f = info?.forecast ?? null;
        setText(f ? (f.minC != null ? `${f.maxC}°/${f.minC}°` : `${f.maxC}°`) : null);
        setKind(f?.kind ?? null);
      })
      .catch(() => { if (alive) { setText(null); setKind(null); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [venue, date]);

  if (loading) {
    return <ActivityIndicator size="small" color={colors.gold} style={styles.spinner} />;
  }
  if (!text || !kind) return null;

  const Icon = ICONS[kind];

  return (
    <View style={styles.chip}>
      <Icon color={colors.gold} size={13} strokeWidth={2.4} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  spinner: { marginLeft: 4 },
  // flexShrink 0: the chip never wraps under the venue, whatever the venue
  // name length. The venue truncates instead (numberOfLines 1 + minWidth 0).
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  text: { color: colors.gold, fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
