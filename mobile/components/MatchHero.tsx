import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { colors, fonts, radius, space, typeScale } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { Flag } from '@/components/Flag';
import { flagCodeFor } from '@/lib/countryFlags';
import { formatDate } from '@/lib/format';
import type { Match } from '@/types';

/**
 * The model's hero: the next match on a photo of the squad, with a dark
 * gradient so the type sits on it, and one full-width call to action.
 *
 * The previous hero was a red-to-navy gradient carrying a countdown and three
 * competing buttons. The photo is what makes it read as a broadcast card
 * rather than a panel, and a single clear action beats a row of small ones.
 *
 * The model leads with a big kick-off time; the data records a date and no
 * time, so the date takes that slot rather than a fabricated clock.
 */
export function MatchHero({ match }: { match: Match | null }) {
  const { t } = useLanguage();
  const router = useRouter();

  const opponentCode = match && flagCodeFor(match.opponent) ? match.opponent : null;
  const dateLabel = match ? formatDate(match.date) : '';

  return (
    <ImageBackground
      source={require('../assets/home-bg.jpg')}
      style={styles.card}
      imageStyle={styles.photo}
      accessibilityLabel={t('nextMatch')}
    >
      {/* Darken the photo from the top so the type reads, as in the model. */}
      <LinearGradient
        colors={['rgba(6,12,24,0.82)', 'rgba(6,12,24,0.35)', 'rgba(6,12,24,0.62)']}
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
            <Text style={styles.teamName} numberOfLines={1}>TUNISIE</Text>
          </View>

          <View style={styles.center}>
            <Text style={styles.bigDate} numberOfLines={1}>{dateLabel}</Text>
          </View>

          <View style={[styles.team, styles.teamRight]}>
            <Text style={[styles.teamName, styles.teamNameRight]} numberOfLines={1}>
              {match?.opponent?.toUpperCase() || t('noMatchScheduled')}
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

        {!!match?.venue && (
          <View style={styles.venue}>
            <MapPin color={colors.gold} size={12} />
            <Text style={styles.venueText} numberOfLines={1}>{match.venue}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.85}
          onPress={() => router.push('/match-details')}
          accessibilityRole="button"
          accessibilityLabel={t('tabConvocation')}
        >
          <Text style={styles.ctaText}>{t('tabConvocation')}</Text>
          <Text style={styles.ctaChevron}>›</Text>
        </TouchableOpacity>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, overflow: 'hidden' },
  photo: { borderRadius: radius.card },
  scrim: { padding: space.lg, justifyContent: 'flex-end', minHeight: 210 },
  eyebrow: { ...typeScale.micro, color: 'rgba(255,255,255,0.92)' },
  competition: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  teams: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  team: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  teamRight: { justifyContent: 'flex-end' },
  center: { flex: 1.15, alignItems: 'center' },
  crest: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.cardRaised,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  crestText: { color: colors.white, fontWeight: '800', fontSize: 11 },
  teamName: { fontFamily: fonts.display, fontSize: 15, fontWeight: '700', letterSpacing: 0.5, color: colors.white, flexShrink: 1 },
  teamNameRight: { textAlign: 'right' },
  bigDate: {
    fontFamily: fonts.display, fontSize: 26, fontWeight: '700', letterSpacing: 0.5,
    color: colors.white, fontVariant: ['tabular-nums'], textAlign: 'center',
  },
  venue: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  venueText: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  cta: {
    height: 44, borderRadius: radius.pill, backgroundColor: colors.red,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 14,
  },
  ctaText: { color: colors.white, fontSize: 13, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  ctaChevron: { color: colors.white, fontSize: 18, fontWeight: '700', lineHeight: 18 },
});
