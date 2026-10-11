import React from 'react';
import { ActivityIndicator, Alert, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import { colors, radius } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { NW } from '@/i18n/newsStrings';
import { ago, fetchNews, type NewsItem } from '@/lib/news';

/**
 * The body of the News card: the team photo as the visual anchor, then the
 * top live headline with its source and age. The feed carries no thumbnails,
 * so the photo is the squad itself rather than a grey box -- tapping the card
 * opens the article.
 *
 * It reads the same Google News feed as the news screen (cached), so the card
 * always agrees with the screen it opens. While the feed loads a spinner
 * shows; when it fails the card renders the same empty line as the news
 * screen rather than a stale or invented story.
 */
export function NewsTeaser() {
  const { language } = useLanguage();
  const T = NW[language];
  const [item, setItem] = React.useState<NewsItem | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    fetchNews()
      .then((list) => { if (alive) setItem(list[0] ?? null); })
      .catch(() => { if (alive) setItem(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={colors.gold} />
      </View>
    );
  }
  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{T.none}</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => Linking.openURL(item.link).catch(() => Alert.alert(T.title, T.openFailed))}
      activeOpacity={0.8}
      accessibilityRole="link"
      accessibilityLabel={item.title}
    >
      <Image source={require('../assets/home-bg.jpg')} style={styles.photo} accessibilityLabel={T.title} />
      <Text style={styles.headline} numberOfLines={3}>{item.title}</Text>
      <View style={styles.meta}>
        <Text style={styles.source} numberOfLines={1}>{item.source}</Text>
        <Text style={styles.time}>{ago(item.pubDate)}</Text>
        <ExternalLink size={11} color={colors.muted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: { minHeight: 72, alignItems: 'center', justifyContent: 'center' },
  empty: { color: colors.muted, fontSize: 11 },
  photo: { width: '100%', height: 64, borderRadius: radius.sm, marginBottom: 8 },
  headline: { color: colors.white, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  source: { color: colors.gold, fontSize: 11, fontWeight: '800', flexShrink: 1 },
  time: { color: colors.muted, fontSize: 11, flex: 1 },
});
