import type { Language } from '@/types';
/** Wording of the platform's "National Camps" (stages) module. */
const en = {
  title: 'National Camps', sub: 'Camps and gatherings', none: 'No camps recorded', failed: 'Could not load camps',
  done: 'Done', live: 'Live', upcoming: 'Upcoming', program: 'Program', players: 'Players', staff: 'Staff',
  report: 'Official report', openReport: 'Open report', photos: 'Photos', noProgram: 'No program recorded.', days: 'days',
  noPlayers: 'No players.', session: 'session', sessions: 'sessions', called: 'called up',
};
const fr: typeof en = {
  title: 'Rassemblements Nationaux', sub: 'Camps & Stages', none: 'Aucun rassemblement enregistré', failed: 'Impossible de charger les rassemblements',
  done: 'Terminé', live: 'En cours', upcoming: 'À venir', program: 'Programme', players: 'Joueuses', staff: 'Staff',
  report: 'Rapport officiel', openReport: 'Ouvrir le rapport', photos: 'Photos', noProgram: 'Aucun programme enregistré.', days: 'jours',
  noPlayers: 'Aucune joueuse.', session: 'séance', sessions: 'séances', called: 'convoquées',
};
const ar: typeof en = {
  title: 'التجمعات الوطنية', sub: 'المعسكرات والتجمعات', none: 'لا توجد تجمعات مسجّلة', failed: 'تعذّر تحميل التجمعات',
  done: 'انتهى', live: 'جارٍ', upcoming: 'قادم', program: 'البرنامج', players: 'اللاعبات', staff: 'الطاقم',
  report: 'التقرير الرسمي', openReport: 'فتح التقرير', photos: 'الصور', noProgram: 'لا يوجد برنامج مسجّل.', days: 'أيام',
  noPlayers: 'لا توجد لاعبات.', session: 'حصة', sessions: 'حصص', called: 'مستدعاة',
};
export const CP: Record<Language, typeof en> = { en, fr, ar };
