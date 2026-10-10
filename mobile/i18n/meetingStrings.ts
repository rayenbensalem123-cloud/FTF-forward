import type { Language } from '@/types';

/** Wording for the Zoom meetings screen. */
const en = {
  title: 'Meetings', sub: 'Team video calls and recordings',
  upcoming: 'Upcoming', past: 'Past', join: 'Join meeting', recording: 'Watch recording',
  noUpcoming: 'No meetings scheduled', noPast: 'No past meetings', failed: 'Could not load meetings',
  recorded: 'Recorded', today: 'Today', openFailed: 'Could not open the link',
};
type S = typeof en;
const fr: S = {
  title: 'Réunions', sub: "Visioconférences de l'équipe et enregistrements",
  upcoming: 'À venir', past: 'Passées', join: 'Rejoindre la réunion', recording: "Voir l'enregistrement",
  noUpcoming: 'Aucune réunion prévue', noPast: 'Aucune réunion passée', failed: 'Impossible de charger les réunions',
  recorded: 'Enregistrée', today: "Aujourd'hui", openFailed: "Impossible d'ouvrir le lien",
};
const ar: S = {
  title: 'الاجتماعات', sub: 'اجتماعات الفريق المرئية والتسجيلات',
  upcoming: 'القادمة', past: 'السابقة', join: 'انضمي إلى الاجتماع', recording: 'مشاهدة التسجيل',
  noUpcoming: 'لا توجد اجتماعات مجدولة', noPast: 'لا توجد اجتماعات سابقة', failed: 'تعذّر تحميل الاجتماعات',
  recorded: 'مسجَّل', today: 'اليوم', openFailed: 'تعذّر فتح الرابط',
};
export const MS: Record<Language, S> = { en, fr, ar };
