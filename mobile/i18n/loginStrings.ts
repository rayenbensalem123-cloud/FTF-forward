import type { Language } from '@/types';

/** Wording of the platform's login screen (lib/translations.ts), reused so both match. */
const en = {
  systemLocked: 'System Locked', authRequired: 'Authentication Required', accessKey: 'ACCESS KEY', authorize: 'Authorize',
  register: 'Register ↗', footer: 'Authorized federation members only', registerTitle: 'Register', federation: 'Fédération Tunisienne de Football',
};
const fr: typeof en = {
  systemLocked: 'Système Verrouillé', authRequired: 'Authentification Requise', accessKey: "CODE D'ACCÈS", authorize: 'Autoriser',
  register: "S'inscrire ↗", footer: 'Réservé aux membres autorisés de la fédération', registerTitle: 'Inscription', federation: 'Fédération Tunisienne de Football',
};
const ar: typeof en = {
  systemLocked: 'النظام مقفل', authRequired: 'المصادقة مطلوبة', accessKey: 'مفتاح الدخول', authorize: 'تسجيل الدخول',
  register: 'إنشاء حساب ↗', footer: 'لأعضاء الاتحاد المصرّح لهم فقط', registerTitle: 'إنشاء حساب', federation: 'الجامعة التونسية لكرة القدم',
};
export const LG: Record<Language, typeof en> = { en, fr, ar };
