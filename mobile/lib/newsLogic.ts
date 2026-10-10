export interface NewsItem { title: string; link: string; pubDate: string; source: string }

const decode = (s: string) =>
  s.replace('<![CDATA[', '').replace(']]>', '').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

/** Same parsing as the website's /api/news route, so both show the same stories. */
export function parseRssItems(xml: string, fallbackSource = 'Google News'): NewsItem[] {
  const items: NewsItem[] = [];
  for (const block of xml.split('<item>').slice(1)) {
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return m ? decode(m[1]) : '';
    };
    const title = get('title'), link = get('link');
    if (title && link) items.push({ title, link, pubDate: get('pubDate'), source: get('source') || fallbackSource });
  }
  return items;
}

/** Merge feeds, drop duplicates by the start of the title, newest first, capped. */
export function mergeNews(lists: NewsItem[][], cap = 24): NewsItem[] {
  const seen = new Set<string>();
  const merged = lists.flat().filter((i) => {
    const key = i.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  merged.sort((a, b) => (Date.parse(b.pubDate) || 0) - (Date.parse(a.pubDate) || 0));
  return merged.slice(0, cap);
}

/** "3h ago" style label, language-neutral digits plus a unit. */
export function ago(iso: string, now = Date.now()): string {
  const t = Date.parse(iso);
  if (!t) return '';
  const m = Math.max(0, Math.round((now - t) / 60000));
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / 1440)}d`;
}
