import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { loadLatestSchedule } from '@/lib/campSchedule';
import type { CampActivity } from '@/lib/campProgram';

const MONTHS: Record<string, number> = {};
[
  ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
  ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'],
  ['يناير', 'فبراير', 'مارس', 'ابريل', 'مايو', 'يونيو', 'يوليو', 'اغسطس', 'سبتمبر', 'اكتوبر', 'نوفمبر', 'ديسمبر'],
].forEach((list) => list.forEach((m, i) => { MONTHS[m] = i + 1; }));

const fold = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').trim();

/** "24 November" / "24 novembre" / "24 نوفمبر" -> { day, month }, or null. */
function parseDayLabel(label: string): { day: number; month: number } | null {
  const m = fold(label).match(/(\d{1,2})\s+([^\d\s]+)/);
  if (!m) return null;
  const month = MONTHS[m[2]];
  if (!month) return null;
  return { day: Number(m[1]), month };
}

/**
 * The body of the Today's Program card: the next sessions from the approved
 * camp program. The program's day whose month and day match today is shown;
 * when nothing matches (program upcoming or past), the opening day is shown
 * instead with its label, so the card always says something true.
 *
 * While the program loads a spinner shows; with nothing published yet the
 * card renders the empty line and the CTA still opens the upload screen.
 */
export function ProgramTeaser() {
  const { t } = useLanguage();
  const [day, setDay] = React.useState<{ label: string; items: CampActivity[] } | null>(null);
  const [empty, setEmpty] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    loadLatestSchedule()
      .then((schedule) => {
        if (!alive) return;
        if (!schedule || schedule.activities.length === 0) { setEmpty(true); return; }
        const groups = new Map<string, CampActivity[]>();
        for (const a of schedule.activities) {
          const list = groups.get(a.dayLabel) ?? [];
          list.push(a);
          groups.set(a.dayLabel, list);
        }
        const now = new Date();
        const today = { day: now.getDate(), month: now.getMonth() + 1 };
        let pick: string | null = null;
        for (const label of groups.keys()) {
          const parsed = parseDayLabel(label);
          if (parsed && parsed.day === today.day && parsed.month === today.month) { pick = label; break; }
        }
        pick ??= [...groups.keys()][0];
        setDay({ label: pick, items: (groups.get(pick) ?? []).slice(0, 3) });
      })
      .catch(() => { if (alive) setEmpty(true); });
    return () => { alive = false; };
  }, []);

  if (empty) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{t('noProgramYet')}</Text>
      </View>
    );
  }
  if (!day) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={colors.white} />
      </View>
    );
  }

  return (
    <View style={styles.list}>
      <Text style={styles.dayLabel} numberOfLines={1}>{day.label}</Text>
      {day.items.map((a) => (
        <View key={String(a.id)} style={styles.row}>
          {!!a.time && <Text style={styles.time}>{a.time}</Text>}
          <Text style={styles.activity} numberOfLines={2}>
            {a.activity}{a.playerLabel ? ` · ${a.playerLabel}` : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { minHeight: 72, alignItems: 'center', justifyContent: 'center' },
  empty: { color: colors.muted, fontSize: 11, textAlign: 'center' },
  list: { gap: 7, justifyContent: 'center' },
  dayLabel: { color: colors.white, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  time: { color: colors.white, fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] },
  activity: { color: colors.white, fontSize: 11, fontWeight: '600', flex: 1, lineHeight: 15 },
});
