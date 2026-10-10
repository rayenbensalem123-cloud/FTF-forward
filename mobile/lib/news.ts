import { mergeNews, parseRssItems, type NewsItem } from '@/lib/newsLogic';

export * from '@/lib/newsLogic';

const QUERIES = ["Tunisia women's national football team", "CAF WAFCON women's football", "FIFA women's football"];

/** Reads the same Google News feeds as the website; a phone has no browser cross-origin limit. */
export async function fetchNews(): Promise<NewsItem[]> {
  const lists = await Promise.all(QUERIES.map(async (q) => {
    try {
      const res = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`);
      return res.ok ? parseRssItems(await res.text()) : [];
    } catch { return []; }
  }));
  return mergeNews(lists);
}
