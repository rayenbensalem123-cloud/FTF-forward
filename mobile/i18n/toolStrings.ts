import type { Language } from '@/types';
/** Labels for the tools added after the main string table. */
const en = { staff: 'Staff', staffDesc: 'Coaches and technical team', news: 'News', newsDesc: 'Latest on the team and women\'s football', tools: 'Tools' };
const fr: typeof en = { staff: 'Staff', staffDesc: 'Entraîneurs et équipe technique', news: 'Actualités', newsDesc: "L'actualité de l'équipe et du football féminin", tools: 'Outils' };
const ar: typeof en = { staff: 'الجهاز الفني', staffDesc: 'المدربون والطاقم الفني', news: 'الأخبار', newsDesc: 'آخر أخبار المنتخب وكرة القدم النسوية', tools: 'أدوات' };
export const NT: Record<Language, typeof en> = { en, fr, ar };
