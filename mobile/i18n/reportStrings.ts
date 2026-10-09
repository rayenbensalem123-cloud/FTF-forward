import type { Language } from '@/types';

/** Wording for the club match reports, matching the platform's own translations. */
const en = {
  title: 'Match reports', sub: 'Club matches logged by the players',
  tab: 'Club', logMatch: 'Log club match', none: 'No club matches logged yet',
  unknownOpponent: 'Unknown opponent', mins: 'mins', goals: 'goals', assists: 'assists',
  confirmDelete: 'Delete this match report?', opponentPh: 'Opponent club',
  competitionPh: 'Competition (optional)', resultPh: 'Result (e.g. 2-1)',
  notesPh: 'Notes (optional)', needOpponent: 'Enter the opponent club',
  startingQuestion: 'Did you start the match?', startedLabel: 'Started (XI)', benchLabel: 'Came off bench',
  ratingLabel: 'Rating out of 10 (optional)', ratingPh: 'e.g. 7.5',
  highlightsLabel: 'Highlights link (optional)', highlightsPh: 'YouTube or Vimeo link',
  watchHighlights: 'Watch highlights',
  playedQuestion: 'Did you play in this match?', playedYes: 'I played', playedNo: "Didn't feature",
  didNotPlay: 'Did not feature in this match', positionPh: 'Position played (optional)',
  injuryQuestion: 'Did you get injured during this match?', injuryNotesPh: 'What happened? (optional)',
  injuryFlag: 'Injury reported in this match', yesLabel: 'Yes', noLabel: 'No',
  verified: 'Verified', verify: 'Verify', unverify: 'Unverify', verifiedBy: 'Verified by',
  // app-only wording
  datePh: 'Match date DD/MM/YYYY (blank = today)', needDate: 'Use the date format DD/MM/YYYY',
  cancel: 'Cancel', save: 'Save report', remove: 'Remove', failed: 'Could not save',
  pending: 'To verify', all: 'All', mine: 'My matches', started: 'Started', bench: 'Bench',
  notLinked: 'Your account is not linked to a player yet. Ask staff to link it on the platform.',
  noAccess: 'You can only see your own club matches.', ratingShort: 'Rating', yc: 'YC', rc: 'RC',
  matches: 'matches', waiting: 'waiting for verification',
};
type S = typeof en;

const fr: S = {
  title: 'Rapports de match', sub: 'Matchs de club saisis par les joueuses',
  tab: 'Club', logMatch: 'Ajouter un match de club', none: 'Aucun match de club enregistré',
  unknownOpponent: 'Adversaire inconnu', mins: 'min', goals: 'buts', assists: 'passes',
  confirmDelete: 'Supprimer ce rapport de match ?', opponentPh: 'Club adverse',
  competitionPh: 'Compétition (optionnel)', resultPh: 'Résultat (ex. 2-1)',
  notesPh: 'Notes (optionnel)', needOpponent: 'Entrez le club adverse',
  startingQuestion: 'Avez-vous débuté le match ?', startedLabel: 'Titulaire', benchLabel: 'Entrée en jeu',
  ratingLabel: 'Note sur 10 (optionnel)', ratingPh: 'ex. 7.5',
  highlightsLabel: 'Lien des temps forts (optionnel)', highlightsPh: 'Lien YouTube ou Vimeo',
  watchHighlights: 'Voir les temps forts',
  playedQuestion: 'Avez-vous joué ce match ?', playedYes: "J'ai joué", playedNo: 'Pas joué',
  didNotPlay: "N'a pas joué ce match", positionPh: 'Poste joué (optionnel)',
  injuryQuestion: 'Avez-vous été blessée pendant ce match ?', injuryNotesPh: "Que s'est-il passé ? (optionnel)",
  injuryFlag: 'Blessure signalée lors de ce match', yesLabel: 'Oui', noLabel: 'Non',
  verified: 'Vérifié', verify: 'Vérifier', unverify: 'Annuler la vérification', verifiedBy: 'Vérifié par',
  datePh: 'Date du match JJ/MM/AAAA (vide = aujourd’hui)', needDate: 'Utilisez le format JJ/MM/AAAA',
  cancel: 'Annuler', save: 'Enregistrer le rapport', remove: 'Supprimer', failed: 'Enregistrement impossible',
  pending: 'À vérifier', all: 'Tous', mine: 'Mes matchs', started: 'Titulaire', bench: 'Remplaçante',
  notLinked: 'Votre compte n’est pas encore lié à une joueuse. Demandez au staff de le lier sur la plateforme.',
  noAccess: 'Vous ne voyez que vos propres matchs de club.', ratingShort: 'Note', yc: 'CJ', rc: 'CR',
  matches: 'matchs', waiting: 'en attente de vérification',
};

const ar: S = {
  title: 'تقارير المباريات', sub: 'مباريات النادي التي سجّلتها اللاعبات',
  tab: 'النادي', logMatch: 'تسجيل مباراة نادي', none: 'لا توجد مباريات نادٍ مسجلة',
  unknownOpponent: 'خصم غير معروف', mins: 'دقيقة', goals: 'أهداف', assists: 'تمريرات',
  confirmDelete: 'حذف تقرير هذه المباراة؟', opponentPh: 'نادي الخصم',
  competitionPh: 'البطولة (اختياري)', resultPh: 'النتيجة (مثال 2-1)',
  notesPh: 'ملاحظات (اختياري)', needOpponent: 'أدخل نادي الخصم',
  startingQuestion: 'هل بدأتِ المباراة أساسية؟', startedLabel: 'أساسية', benchLabel: 'دخلت بديلة',
  ratingLabel: 'التقييم من 10 (اختياري)', ratingPh: 'مثال 7.5',
  highlightsLabel: 'رابط أبرز اللحظات (اختياري)', highlightsPh: 'رابط يوتيوب أو فيميو',
  watchHighlights: 'مشاهدة أبرز اللحظات',
  playedQuestion: 'هل لعبتِ هذه المباراة؟', playedYes: 'لعبتُ', playedNo: 'لم ألعب',
  didNotPlay: 'لم تشارك في هذه المباراة', positionPh: 'المركز الذي لعبتِه (اختياري)',
  injuryQuestion: 'هل أُصبتِ خلال هذه المباراة؟', injuryNotesPh: 'ماذا حدث؟ (اختياري)',
  injuryFlag: 'تم الإبلاغ عن إصابة في هذه المباراة', yesLabel: 'نعم', noLabel: 'لا',
  verified: 'موثّق', verify: 'توثيق', unverify: 'إلغاء التوثيق', verifiedBy: 'وثّقه',
  datePh: 'تاريخ المباراة يوم/شهر/سنة (فارغ = اليوم)', needDate: 'استخدم الصيغة يوم/شهر/سنة',
  cancel: 'إلغاء', save: 'حفظ التقرير', remove: 'حذف', failed: 'تعذّر الحفظ',
  pending: 'بانتظار التوثيق', all: 'الكل', mine: 'مبارياتي', started: 'أساسية', bench: 'بديلة',
  notLinked: 'حسابك غير مرتبط بلاعبة بعد. اطلب من الطاقم ربطه على المنصة.',
  noAccess: 'يمكنك رؤية مبارياتك فقط.', ratingShort: 'التقييم', yc: 'صفراء', rc: 'حمراء',
  matches: 'مباريات', waiting: 'بانتظار التوثيق',
};

export const RS: Record<Language, S> = { en, fr, ar };
