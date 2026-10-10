import type { Language } from '@/types';
const en = { title: 'Staff', sub: 'Coaches and technical team', badge: 'Team Staff', age: 'Age', none: 'No staff yet', failed: 'Could not load staff' };
const fr: typeof en = { title: 'Staff', sub: 'Entraîneurs et équipe technique', badge: 'Staff Technique', age: 'Âge', none: 'Aucun staff', failed: 'Impossible de charger le staff' };
const ar: typeof en = { title: 'الجهاز الفني', sub: 'المدربون والطاقم الفني', badge: 'الجهاز الفني', age: 'العمر', none: 'لا يوجد طاقم بعد', failed: 'تعذّر تحميل الطاقم' };
export const SF: Record<Language, typeof en> = { en, fr, ar };
