import type { Language } from '@/types';
const en = { title: 'News', sub: "Team and women's football headlines", none: 'No news right now', failed: 'Could not load news', openFailed: 'Could not open the link' };
const fr: typeof en = { title: 'Actualités', sub: "L'équipe et le football féminin", none: "Pas d'actualité pour le moment", failed: "Impossible de charger l'actualité", openFailed: "Impossible d'ouvrir le lien" };
const ar: typeof en = { title: 'الأخبار', sub: 'أخبار المنتخب وكرة القدم النسوية', none: 'لا توجد أخبار حاليًا', failed: 'تعذّر تحميل الأخبار', openFailed: 'تعذّر فتح الرابط' };
export const NW: Record<Language, typeof en> = { en, fr, ar };
