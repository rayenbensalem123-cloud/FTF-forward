import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Cloud, CloudDrizzle, CloudFog, CloudHail, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun, Wind } from 'lucide-react-native';
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

/** WMO weather kinds to a short human label. */
const LABELS: Record<WeatherKind, string> = {
  clear: 'Clear',
  partly: 'Partly cloudy',
  cloudy: 'Overcast',
  fog: 'Fog',
  rain: 'Rain',
  snow: 'Snow',
  storm: 'Storm',
};

/**
 * The match-day forecast for the venue, from Open-Meteo via lib/weather.
 *
 * The icon is the point: it reflects the actual condition rather than a
 * static glyph, so the badge reads as a weather widget. The platform stores a
 * venue name and no coordinates, so the city is geocoded by name and the
 * forecast is best effort -- while it loads a spinner shows, and if it fails
 * or the match is beyond the forecast range the chip renders nothing rather
 * than a wrong number.
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
      <View style={styles.badge}>
        <ActivityIndicator size="small" color={colors.gold} />
      </View>
    );
  }
  if (!forecast) return null;

  const Icon = ICONS[forecast.kind];
  const range = forecast.minC != null ? `${forecast.maxC}° / ${forecast.minC}°` : `${forecast.maxC}°`;

  return (
    <View style={styles.badge}>
      <View style={styles.iconWrap}>
        <Icon color={colors.gold} size={18} strokeWidth={2.2} />
      </View>
      <View>
        <Text style={styles.temp}>{range}</Text>
        <Text style={styles.label} numberOfLines={1}>{LABELS[forecast.kind]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(6,12,24,0.55)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  iconWrap: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(246,199,68,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  temp: { color: colors.white, fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'], lineHeight: 16 },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 1 },
});
