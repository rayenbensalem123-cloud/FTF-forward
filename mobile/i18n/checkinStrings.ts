import type { Language } from '@/types';
const en = {
  ask: 'How do you feel today?', fit: 'Fit', tired: 'Tired', sore: 'Sore', unwell: 'Unwell', saved: 'Sent to staff',
  failed: 'Could not send. Try again.', title: 'Daily check-ins', answered: 'answered', needsAttention: 'Needs attention',
  notYet: 'Not answered yet', none: 'No check-ins yet today',
};
const fr: typeof en = {
  ask: 'Comment vous sentez-vous aujourd’hui ?', fit: 'En forme', tired: 'Fatiguée', sore: 'Courbatures', unwell: 'Pas bien', saved: 'Envoyé au staff',
  failed: 'Envoi impossible. Réessayez.', title: 'Bilans du jour', answered: 'réponses', needsAttention: 'À surveiller',
  notYet: 'Pas encore répondu', none: "Aucun bilan aujourd'hui",
};
const ar: typeof en = {
  ask: 'كيف تشعرين اليوم؟', fit: 'بخير', tired: 'متعبة', sore: 'آلام عضلية', unwell: 'لست بخير', saved: 'أُرسل إلى الطاقم',
  failed: 'تعذّر الإرسال. حاولي مجددًا.', title: 'تقييم اليوم', answered: 'ردّت', needsAttention: 'تحتاج متابعة',
  notYet: 'لم تردّ بعد', none: 'لا توجد تقييمات اليوم',
};
export const CK: Record<Language, typeof en> = { en, fr, ar };
