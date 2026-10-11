import React from 'react';
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
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
 * gradient so the type sits on it.
 *
 * The layout is four tight rows with one job each, so the banner reads top to
 * bottom instead of as a pile: the competition line, the teams, the timer
 * strip, and a footer with the venue and the weather. Nothing shares a row
 * with something unrelated, and nothing spans two lines except the team
 * names, which earn it.
 *
 * Proper circular crests with a white ring: the federation crest for Tunisia,
 * the opponent's flag at badge size. Both sit small on the dark disc, the
 * header's language -- never cropped to fill.
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
        <View style={styles.topRow}>
          <Text style={styles.eyebrow}>{t('nextMatch').toUpperCase()}</Text>
          <Text style={styles.competition} numberOfLines={1}>
            {match?.competition || match?.category || 'WNT'}
          </Text>
        </View>

        <View style={styles.teams}>
          <View style={styles.team}>
            {/* The federation crest at badge size on the dark disc -- the same
                language as the header. It must NOT be cropped to fill the
                circle: the emblem is mostly white and becomes a white blob. */}
            <View style={styles.crest}>
              <Image source={require('../assets/ftf-logo.png')} style={styles.crestImage} resizeMode="contain" />
            </View>
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
                <Flag name={opponentCode} width={30} />
              ) : (
                <Text style={styles.crestText}>?</Text>
              )}
            </View>
          </View>
        </View>

        {/* One line under the teams, centered on the date. */}
        <View style={styles.countRow}>
          <Countdown
            boxed
            target={match ? `${match.date}T00:00:00` : ''}
            labels={{ days: t('days'), hrs: t('hrs'), min: t('min'), sec: t('sec') }}
          />
        </View>

        <View style={styles.footer}>
          {!!match?.venue && (
            <View style={styles.venue}>
              <MapPin color={colors.white} size={12} />
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
  scrim: { padding: space.lg, justifyContent: 'flex-end' },
  // One top line: the eyebrow on the left, the competition on the right.
  topRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.sm },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.92)' },
  competition: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  // Side columns get the extra room (1.2 vs 0.8) so a 7-letter name like
  // "Tunisie" never truncates against the date; the date column only needs
  // ~80px and takes what is left.
  teams: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  team: { flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  teamRight: { justifyContent: 'flex-end' },
  center: { flex: 0.8, alignItems: 'center' },
  // Proper circular crests: a white ring around a dark disc, with the emblem
  // at badge size in the middle -- the header's language. Neither the crest
  // nor a flag is ever cropped to fill the disc.
  crest: {
    width: 46, height: 46, borderRadius: 23, overflow: 'hidden',
    backgroundColor: colors.cardRaised, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  crestImage: { width: 32, height: 32 },
  crestText: { fontFamily: fonts.display, color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 20 },
  teamName: { fontFamily: fonts.display, fontSize: 15, fontWeight: '700', letterSpacing: 0.5, color: colors.white, flexShrink: 1 },
  teamNameRight: { textAlign: 'right' },
  bigDate: {
    fontFamily: fonts.display, fontSize: 26, fontWeight: '700', letterSpacing: 0.5,
    color: colors.white, fontVariant: ['tabular-nums'], textAlign: 'center', lineHeight: 28,
  },
  countRow: { marginTop: 12, alignItems: 'center' },
  // One footer line: the venue on the left, the weather on the right.
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  venue: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 },
  venueText: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
});
