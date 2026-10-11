import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin } from 'lucide-react-native';
import { colors, fonts, radius, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { Countdown } from '@/components/Countdown';
import { Flag } from '@/components/Flag';
import { flagCodeFor } from '@/lib/countryFlags';
import { formatDate } from '@/lib/format';
import { WeatherChip } from '@/components/WeatherChip';
import type { Match } from '@/types';

/**
 * The match banner: the next match on a photo of the squad, with a dark
 * gradient so the type sits on it, and one full-width call to action.
 *
 * This is the hero the reference banner shows, and it replaces the maroon
 * gradient card -- a photo reads as a broadcast banner in a way a flat
 * gradient does not. The crests sit directly on the image with a faint
 * translucent backing rather than on solid discs.
 */
export function MatchHero({ match }: { match: Match | null }) {
  const { t } = useLanguage();

  const opponentCode = match && flagCodeFor(match.opponent) ? match.opponent : null;
  const dateLabel = match ? formatDate(match.date) : '';

  return (
    <ImageBackground
      source={require('../assets/home-bg.jpg')}
      style={styles.card}
      imageStyle={styles.photo}
      accessibilityLabel={t('nextMatch')}
    >
      <LinearGradient
        colors={['rgba(6,12,24,0.78)', 'rgba(6,12,24,0.32)', 'rgba(6,12,24,0.55)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.scrim}
      >
        <Text style={styles.eyebrow}>{t('nextMatch').toUpperCase()}</Text>
        <Text style={styles.competition} numberOfLines={1}>
          {match?.competition || match?.category || 'WNT'}
        </Text>

        <View style={styles.teams}>
          <View style={styles.team}>
            <View style={styles.crest}><Flag name="Tunisia" width={34} /></View>
            <Text style={styles.teamName} numberOfLines={1}>Tunisie</Text>
          </View>

          <View style={styles.center}>
            <Text style={styles.bigDate} numberOfLines={2}>{dateLabel}</Text>
          </View>

          <View style={[styles.team, styles.teamRight]}>
            <Text style={[styles.teamName, styles.teamNameRight]} numberOfLines={1}>
              {match?.opponent || t('noMatchScheduled')}
            </Text>
            <View style={styles.crest}>
              {opponentCode ? (
                <Flag name={opponentCode} width={34} />
              ) : (
                <Text style={styles.crestText}>{match ? '?' : '—'}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.countRow}>
          <Countdown
            boxed
            target={match ? `${match.date}T00:00:00` : ''}
            labels={{ days: t('days'), hrs: t('hrs'), min: t('min'), sec: t('sec') }}
          />
        </View>

        <View style={styles.venueRow}>
          {!!match?.venue && (
            <View style={styles.venue}>
              <MapPin color={colors.gold} size={12} />
              <Text style={styles.venueText} numberOfLines={1}>{match.venue}</Text>
            </View>
          )}
          {match?.venue ? <WeatherChip venue={match.venue} date={match.date} /> : null}
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, overflow: 'hidden' },
  photo: { borderRadius: radius.card },
  scrim: { padding: space.lg, justifyContent: 'flex-end', minHeight: 220 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.92)' },
  competition: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  teams: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  team: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  teamRight: { justifyContent: 'flex-end' },
  center: { flex: 1.15, alignItems: 'center' },
  // A faint translucent backing rather than a solid disc: the crest reads as
  // itself, not as an icon inside a coloured badge.
  crest: {
    width: 42, height: 42, borderRadius: 21, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  crestText: { color: colors.white, fontWeight: '800', fontSize: 11 },
  teamName: { fontFamily: fonts.display, fontSize: 15, fontWeight: '700', letterSpacing: 0.5, color: colors.white, flexShrink: 1 },
  teamNameRight: { textAlign: 'right' },
  countRow: { marginTop: 14, alignItems: 'flex-start' },
  bigDate: {
    fontFamily: fonts.display, fontSize: 26, fontWeight: '700', letterSpacing: 0.5,
    color: colors.white, fontVariant: ['tabular-nums'], textAlign: 'center', lineHeight: 28,
  },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  venue: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  venueText: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
});
