import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ForwardChevron } from '@/components/ForwardChevron';
import { accent, colors, sectionTitle, space } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';

/**
 * The design's section heading: an Oswald uppercase title with a small accent
 * "See all" link on the right. Screens share this so the heading is identical
 * everywhere -- previously each screen restated the 13px style inline, which is
 * how the headings drifted apart from each other.
 *
 * `href` is optional. A section with nowhere to go renders the title on its
 * own rather than a dead link.
 */
export function SectionHeader({ title, href }: { title: string; href?: Href }) {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {href ? (
        <TouchableOpacity
          style={styles.link}
          onPress={() => router.push(href)}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel={t('seeAll')}
        >
          <Text style={styles.linkText}>{t('seeAll')}</Text>
          <ForwardChevron color={colors.gold} size={12} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  // sectionTitle carries its own marginBottom for screens that stack it above a
  // block; here the caller's layout gap does that job, so drop it.
  title: { ...sectionTitle, marginBottom: 0 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText: { color: colors.gold, fontSize: 12, fontWeight: '600' },
});
