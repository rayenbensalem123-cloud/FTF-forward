import React from 'react';
import { Text, View } from 'react-native';
import { Calendar, ClipboardList, Gamepad2, IdCard, Newspaper, Tent, Trophy, Users, Video } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { ToolRow, type ToolItem } from '@/components/ToolRow';
import { colors, sectionTitle, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { NT } from '@/i18n/toolStrings';

/** Every tool a player can open. Players have no More tab, so Profile shows this card. */
export function ToolsCard() {
  const { t, language } = useLanguage();
  const N = NT[language];
  const items: ToolItem[] = [
    { href: '/more/career', icon: Trophy, title: t('tabCareer'), desc: t('moreCareerDesc') },
    { href: '/id-card', icon: IdCard, title: t('tabIdCard'), desc: t('moreIdCardDesc') },
    { href: '/more/camp-schedule', icon: Calendar, title: t('tabCampSchedule'), desc: t('moreCampScheduleDesc') },
    { href: '/more/camps', icon: Tent, title: N.camps, desc: N.campsDesc },
    { href: '/more/reports', icon: ClipboardList, title: t('tabReports'), desc: t('moreReportsDesc') },
    { href: '/more/meetings', icon: Video, title: t('tabMeetings'), desc: t('moreMeetingsDesc') },
    { href: '/more/news', icon: Newspaper, title: N.news, desc: N.newsDesc },
    { href: '/more/staff', icon: Users, title: N.staff, desc: N.staffDesc },
    { href: '/more/games', icon: Gamepad2, title: t('tabGames'), desc: t('moreGamesDesc') },
  ];
  return (
    <View>
      <Text style={[sectionTitle, { marginBottom: space.sm }]}>{N.tools}</Text>
      <Card style={{ paddingVertical: space.xs }}>
        {items.map((it, i) => <ToolRow key={it.title} item={it} first={i === 0} />)}
      </Card>
    </View>
  );
}
