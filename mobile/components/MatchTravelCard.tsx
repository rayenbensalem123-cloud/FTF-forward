import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Clock, Droplets, MapPin, Plane, Sun, Wind } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { colors, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { usePlayers } from '@/context/PlayersContext';
import type { StringKey } from '@/i18n/strings';
import { formatDuration, type WeatherKind } from '@/lib/travel';
import { loadMatchInfo, type MatchInfo } from '@/lib/weather';

const ICON = { clear: Sun, partly: CloudSun, cloudy: Cloud, fog: CloudFog, rain: CloudRain, snow: CloudSnow, storm: CloudLightning } as const;
const LABEL: Record<WeatherKind, StringKey> = {
  clear: 'wxClear', partly: 'wxPartly', cloudy: 'wxCloudy', fog: 'wxFog', rain: 'wxRain', snow: 'wxSnow', storm: 'wxStorm',
};

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Weather on match day and trip facts for the next match's city. Hidden when the match has no venue. */
export function MatchTravelCard() {
  const { t } = useLanguage();
  const { nextMatch } = usePlayers();
  const [info, setInfo] = useState<MatchInfo | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');

  const venue = nextMatch?.venue;
  const date = nextMatch?.date;
  useEffect(() => {
    if (!venue || !date) return;
    let alive = true;
    setState('loading');
    loadMatchInfo(venue, date, todayIso())
      .then((r) => {
        if (!alive) return;
        setInfo(r);
        setState(r ? 'ok' : 'error');
      })
      .catch(() => alive && setState('error'));
    return () => {
      alive = false;
    };
  }, [venue, date]);

  if (!venue || !date || state === 'loading') return null;

  if (state === 'error' || !info) {
    return (
      <Card>
        <Text style={styles.section}>{t('matchCity')}</Text>
        <Text style={styles.muted}>{t('weatherUnavailable')}</Text>
      </Card>
    );
  }

  const f = info.forecast;
  const WxIcon = f ? ICON[f.kind] : Cloud;
  const diff = info.timeDiffHours;
  const timeText = diff === 0 ? t('sameTime') : `${diff > 0 ? '+' : '−'}${Math.abs(diff)} ${diff > 0 ? t('hoursAhead') : t('hoursBehind')}`;

  return (
    <Card style={{ gap: space.sm + 2 }}>
      <View style={styles.head}>
        <Text style={styles.section}>{t('matchCity')}</Text>
        <View style={styles.place}>
          <MapPin color={colors.gold} size={12} />
          <Text style={styles.placeText} numberOfLines={1}>{[info.place.name, info.place.country].filter(Boolean).join(', ')}</Text>
        </View>
      </View>

      {f ? (
        <View style={styles.wx}>
          <WxIcon color={colors.gold} size={34} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.temp}>{f.maxC}° <Text style={styles.tempLow}>/ {f.minC}°</Text></Text>
            <Text style={styles.muted}>{t(LABEL[f.kind])}</Text>
          </View>
          <View style={{ gap: 4, alignItems: 'flex-end' }}>
            {f.rainChance !== null && (
              <View style={styles.stat}><Droplets color={colors.muted} size={13} /><Text style={styles.statText}>{f.rainChance}% {t('rainChance')}</Text></View>
            )}
            {f.windKmh !== null && (
              <View style={styles.stat}><Wind color={colors.muted} size={13} /><Text style={styles.statText}>{f.windKmh} {t('windKmh')}</Text></View>
            )}
          </View>
        </View>
      ) : (
        <Text style={styles.muted}>{t('forecastLater')}</Text>
      )}

      <View style={styles.divider} />
      <View style={styles.trip}>
        {info.flightMinutes > 0 && (
          <View style={styles.stat}>
            <Plane color={colors.gold} size={14} />
            <Text style={styles.tripText}>~{formatDuration(info.flightMinutes)} {t('flightApprox')} · {info.distanceKm.toLocaleString('en-US')} km</Text>
          </View>
        )}
        <View style={styles.stat}>
          <Clock color={colors.gold} size={14} />
          <Text style={styles.tripText}>{timeText}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  section: { color: colors.gold, fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  place: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  placeText: { color: colors.white, fontSize: 12, fontWeight: '600', flexShrink: 1 },
  wx: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  temp: { color: colors.white, fontSize: 24, fontWeight: '800' },
  tempLow: { color: colors.muted, fontSize: 16, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.line },
  trip: { gap: 6 },
  tripText: { color: colors.white, fontSize: 12, flexShrink: 1 },
});
