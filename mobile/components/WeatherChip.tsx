import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from 'lucide-react-native';
import { colors, radius } from '@/constants/theme';
import { loadMatchInfo, type Forecast } from '@/lib/weather';
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
 * The match-day forecast for the venue, from Open-Meteo via lib/weather.
 *
 * The platform stores a venue name and no coordinates, so the city is geocoded
 * by name and the forecast is best effort: while it loads a spinner shows, and
 * if it fails or the match is beyond the forecast range the chip renders
 * nothing rather than a wrong number.
 */
export function WeatherChip({ venue, date }: { venue: string; date: string }) {
  const [forecast, setForecast] = React.useState<Forecast | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    loadMatchInfo(venue, date, new Date().toISOString().slice(0, 10))
      .then((info) => { if (alive) setForecast(info?.forecast ?? null); })
      .catch(() => { if (alive) setForecast(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [venue, date]);

  if (loading) {
    return (
      <View style={styles.chip}>
        <ActivityIndicator size="small" color={colors.gold} />
      </View>
    );
  }
  if (!forecast) return null;

  const Icon = ICONS[forecast.kind];
  const range = forecast.minC != null ? `${forecast.maxC}° / ${forecast.minC}°` : `${forecast.maxC}°`;

  return (
    <View style={styles.chip}>
      <Icon color={colors.gold} size={14} />
      <Text style={styles.text}>{range}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(246,199,68,0.12)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(246,199,68,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: { color: colors.gold, fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
