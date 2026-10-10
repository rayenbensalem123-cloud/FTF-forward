import type { Language } from '@/types';
/** Labels for the tools added after the main string table. */
const en = { staff: 'Staff', staffDesc: 'Coaches and technical team', news: 'News', newsDesc: 'Latest on the team and women\'s football', tools: 'Tools', camps: 'National camps', campsDesc: 'Camps, program, call-ups and reports' };
const md = {
  en: { today: 'Match day', tomorrow: 'Match tomorrow', lineup: 'Lineup', details: 'Match details', vs: 'Tunisia vs' },
  fr: { today: 'Jour de match', tomorrow: 'Match demain', lineup: 'Composition', details: 'Détails du match', vs: 'Tunisie vs' },
  ar: { today: 'يوم المباراة', tomorrow: 'المباراة غدًا', lineup: 'التشكيلة', details: 'تفاصيل المباراة', vs: 'تونس ضد' },
} as const;
export const MD = md;
const fr: typeof en = { staff: 'Staff', staffDesc: 'Entraîneurs et équipe technique', news: 'Actualités', newsDesc: "L'actualité de l'équipe et du football féminin", tools: 'Outils', camps: 'Rassemblements', campsDesc: 'Camps, programme, convocations et rapports' };
const ar: typeof en = { staff: 'الجهاز الفني', staffDesc: 'المدربون والطاقم الفني', news: 'الأخبار', newsDesc: 'آخر أخبار المنتخب وكرة القدم النسوية', tools: 'أدوات', camps: 'التجمعات الوطنية', campsDesc: 'المعسكرات والبرنامج والاستدعاءات والتقارير' };
export const NT: Record<Language, typeof en> = { en, fr, ar };
