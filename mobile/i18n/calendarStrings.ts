import type { Language } from '@/types';

const en = {
  title: 'My camp calendar', desc: 'Camps you are called up to appear in your phone calendar',
  intro: 'Subscribe once and the camps you are called up to show up in your phone calendar and update if dates change. Camps you are not part of never appear.',
  subscribe: 'Add to my calendar', share: 'Share / copy link', reset: 'Reset my link',
  privateNote: 'This link is personal. Anyone who has it can see your camp dates, so do not share it.',
  resetAsk: 'Reset your link? The old one stops working and you will need to subscribe again.', cancel: 'Cancel',
  failed: 'Could not get your calendar link. Check your connection and try again.', openFailed: 'No calendar app could open the link. Use "Share / copy link" and paste it in your calendar app.',
};
const fr: typeof en = {
  title: 'Mon calendrier de stages', desc: 'Les stages où vous êtes convoquée apparaissent dans le calendrier de votre téléphone',
  intro: "Abonnez-vous une fois : les stages pour lesquels vous êtes convoquée apparaissent dans le calendrier de votre téléphone et se mettent à jour si les dates changent. Les stages auxquels vous ne participez pas n'apparaissent jamais.",
  subscribe: 'Ajouter à mon calendrier', share: 'Partager / copier le lien', reset: 'Réinitialiser mon lien',
  privateNote: 'Ce lien est personnel. Toute personne qui le possède peut voir vos dates de stage, ne le partagez pas.',
  resetAsk: "Réinitialiser votre lien ? L'ancien ne fonctionnera plus et vous devrez vous réabonner.", cancel: 'Annuler',
  failed: "Impossible d'obtenir votre lien. Vérifiez votre connexion et réessayez.", openFailed: 'Aucune application calendrier n\'a pu ouvrir le lien. Utilisez « Partager / copier le lien » et collez-le dans votre calendrier.',
};
const ar: typeof en = {
  title: 'تقويم معسكراتي', desc: 'المعسكرات التي تم استدعاؤك إليها تظهر في تقويم هاتفك',
  intro: 'اشتركي مرة واحدة لتظهر المعسكرات التي تم استدعاؤك إليها في تقويم هاتفك وتتحدث إذا تغيرت التواريخ. المعسكرات التي لستِ جزءًا منها لا تظهر أبدًا.',
  subscribe: 'إضافة إلى تقويمي', share: 'مشاركة / نسخ الرابط', reset: 'إعادة تعيين رابطي',
  privateNote: 'هذا الرابط شخصي. أي شخص يملكه يمكنه رؤية تواريخ معسكراتك، فلا تشاركيه.',
  resetAsk: 'هل تريدين إعادة تعيين الرابط؟ سيتوقف القديم عن العمل وستحتاجين إلى الاشتراك من جديد.', cancel: 'إلغاء',
  failed: 'تعذر الحصول على رابط التقويم. تحققي من الاتصال وحاولي مجددًا.', openFailed: 'لم يتمكن أي تطبيق تقويم من فتح الرابط. استخدمي «مشاركة / نسخ الرابط» والصقيه في تطبيق التقويم.',
};
export const CAL: Record<Language, typeof en> = { en, fr, ar };
