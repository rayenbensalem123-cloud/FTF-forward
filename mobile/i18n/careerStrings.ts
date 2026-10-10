import type { Language } from '@/types';

/** Wording for My Career, My Highlights, the injury timeline and the digital squad ID card. */
const en = {
  career: 'My Career', notLinked: 'Your account is not linked to a player yet. Ask staff to link it on the platform.',
  nationalTeam: 'National team', clubSeason: 'Club season (this season)',
  caps: 'Caps', goals: 'Goals', assists: 'Assists', matches: 'Matches', minutes: 'Minutes',
  ratingTrend: 'Rating trend', avg: 'avg', noRatings: 'Rate your club matches to see a trend here.',
  highlights: 'Highlights', noHighlights: 'No highlights yet. Add a link when you log a club match.',
  watchHighlights: 'Watch highlights', viewAllHighlights: 'View highlights reel',
  injuryTimeline: 'Injury timeline', noInjuries: 'No injuries on record. Long may that last.',
  currentlyOut: 'Currently out', recovering: 'In recovery', pastInjury: 'Recovered',
  addToCalendar: 'Add to calendar', addedToCalendar: 'Added to your calendar',
  calendarFailed: 'Could not add this to your calendar',
  calendarDenied: 'Allow calendar access in Settings to sync matches',
  syncAllMatches: 'Add all upcoming matches', allSynced: 'Upcoming matches added to your calendar',
  idCard: 'Squad ID card', idCardSub: 'Official digital identification', shareCard: 'Share card',
  nationality: 'Nationality', club: 'Club', category: 'Category', position: 'Position', validThrough: 'Valid for the current season',
  idCardFooter: 'Fédération Tunisienne de Football · Elite Squad Manager',
};
type S = typeof en;

const fr: S = {
  career: 'Ma carrière', notLinked: "Votre compte n'est pas encore lié à une joueuse. Demandez au staff de le relier sur la plateforme.",
  nationalTeam: 'Équipe nationale', clubSeason: 'Saison en club (cette saison)',
  caps: 'Sélections', goals: 'Buts', assists: 'Passes', matches: 'Matchs', minutes: 'Minutes',
  ratingTrend: 'Évolution de la note', avg: 'moy.', noRatings: 'Notez vos matchs de club pour voir une tendance ici.',
  highlights: 'Temps forts', noHighlights: "Aucun temps fort pour le moment. Ajoutez un lien en saisissant un match de club.",
  watchHighlights: 'Voir les temps forts', viewAllHighlights: 'Voir tous les temps forts',
  injuryTimeline: 'Historique des blessures', noInjuries: "Aucune blessure enregistrée. Longue vie à cette série.",
  currentlyOut: 'Actuellement absente', recovering: 'En réathlétisation', pastInjury: 'Rétablie',
  addToCalendar: 'Ajouter au calendrier', addedToCalendar: 'Ajouté à votre calendrier',
  calendarFailed: "Impossible d'ajouter au calendrier",
  calendarDenied: "Autorisez l'accès au calendrier dans les réglages pour synchroniser les matchs",
  syncAllMatches: 'Ajouter tous les matchs à venir', allSynced: 'Matchs à venir ajoutés à votre calendrier',
  idCard: "Carte d'identité", idCardSub: 'Identification numérique officielle', shareCard: 'Partager la carte',
  nationality: 'Nationalité', club: 'Club', category: 'Catégorie', position: 'Poste', validThrough: 'Valable pour la saison en cours',
  idCardFooter: 'Fédération Tunisienne de Football · Elite Squad Manager',
};

const ar: S = {
  career: 'مسيرتي', notLinked: 'حسابك غير مرتبط بلاعبة بعد. اطلبي من الطاقم ربطه على المنصة.',
  nationalTeam: 'المنتخب الوطني', clubSeason: 'الموسم مع النادي (هذا الموسم)',
  caps: 'المباريات الدولية', goals: 'الأهداف', assists: 'التمريرات الحاسمة', matches: 'المباريات', minutes: 'الدقائق',
  ratingTrend: 'تطور التقييم', avg: 'المعدل', noRatings: 'قيّمي مبارياتك مع النادي لرؤية التطور هنا.',
  highlights: 'أبرز اللحظات', noHighlights: 'لا توجد لحظات بارزة بعد. أضيفي رابطاً عند تسجيل مباراة نادٍ.',
  watchHighlights: 'مشاهدة أبرز اللحظات', viewAllHighlights: 'عرض كل اللحظات البارزة',
  injuryTimeline: 'سجل الإصابات', noInjuries: 'لا توجد إصابات مسجّلة. نتمنى أن يستمر ذلك.',
  currentlyOut: 'غائبة حالياً', recovering: 'في مرحلة التعافي', pastInjury: 'تعافت',
  addToCalendar: 'إضافة إلى التقويم', addedToCalendar: 'أُضيفت إلى تقويمك',
  calendarFailed: 'تعذّرت الإضافة إلى التقويم',
  calendarDenied: 'فعّلي إذن التقويم من الإعدادات لمزامنة المباريات',
  syncAllMatches: 'إضافة كل المباريات القادمة', allSynced: 'أُضيفت المباريات القادمة إلى تقويمك',
  idCard: 'بطاقة اللاعبة', idCardSub: 'بطاقة تعريف رقمية رسمية', shareCard: 'مشاركة البطاقة',
  nationality: 'الجنسية', club: 'النادي', category: 'الفئة', position: 'المركز', validThrough: 'صالحة للموسم الحالي',
  idCardFooter: 'الجامعة التونسية لكرة القدم · Elite Squad Manager',
};

export const CS: Record<Language, S> = { en, fr, ar };
