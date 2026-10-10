import type { Language } from '@/types';

const en = {
  title: 'Forgot password', intro: 'Enter your username and the recovery email on your account. We send a reset link to that address.',
  username: 'Username', email: 'Recovery email', send: 'Send reset link', back: 'Back to sign in',
  link: 'Forgot password?', need: 'Enter your username and email', network: 'No connection. Try again.',
  sent: 'If that username and email match an account, a reset link has been sent. It expires in 30 minutes.',
  noEmail: "Email isn't set up yet. Ask an admin to reset your password.",
};
const fr: typeof en = {
  title: 'Mot de passe oublié', intro: "Saisissez votre nom d'utilisateur et l'e-mail de récupération de votre compte. Le lien est envoyé à cette adresse.",
  username: "Nom d'utilisateur", email: 'E-mail de récupération', send: 'Envoyer le lien', back: 'Retour à la connexion',
  link: 'Mot de passe oublié ?', need: "Saisissez le nom d'utilisateur et l'e-mail", network: 'Pas de connexion. Réessayez.',
  sent: "Si ce nom et cet e-mail correspondent à un compte, un lien a été envoyé. Il expire dans 30 minutes.",
  noEmail: "L'envoi d'e-mails n'est pas encore configuré. Demandez à un admin de réinitialiser votre mot de passe.",
};
const ar: typeof en = {
  title: 'نسيتُ كلمة المرور', intro: 'أدخلي اسم المستخدم وبريد الاسترداد المسجّل في حسابك. سنرسل رابط إعادة التعيين إلى ذلك البريد.',
  username: 'اسم المستخدم', email: 'بريد الاسترداد', send: 'إرسال الرابط', back: 'العودة لتسجيل الدخول',
  link: 'نسيتِ كلمة المرور؟', need: 'أدخلي اسم المستخدم والبريد', network: 'لا يوجد اتصال. حاولي مجددًا.',
  sent: 'إذا تطابق الاسم والبريد مع حساب، فقد أُرسل رابط. تنتهي صلاحيته خلال 30 دقيقة.',
  noEmail: 'خدمة البريد غير مفعّلة بعد. اطلبي من المشرف إعادة تعيين كلمة المرور.',
};
export const FG: Record<Language, typeof en> = { en, fr, ar };
