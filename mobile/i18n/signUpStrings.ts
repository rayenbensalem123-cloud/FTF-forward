import type { Language } from '@/types';

const en = {
  link: 'New player? Create an account', title: 'Create your account', sub: 'For players. Staff accounts are created by an admin.',
  first: 'First name', last: 'Last name', username: 'Username', password: 'Password (6+ characters)',
  create: 'Create account', haveAccount: 'Already have an account? Sign in',
  eName: 'Enter your first and last name.', eUsername: 'Username: 3 to 32 letters, digits, dot, dash or underscore.',
  ePassword: 'The password needs at least 6 characters.', eTaken: 'That username is taken.',
  eConfirm: 'Account created, but sign-in is blocked until an admin turns off email confirmation.',
  eNetwork: 'Could not reach the server. Check your connection and try again.', eWeak: 'That password is too weak.',
  areYou: 'Are you {name}?', areYouSub: 'We found a player card that looks like the name you typed.',
  yes: 'Yes, that is me', no: 'No, not me', noneOfThem: 'None of these',
  doneTitle: 'Account created', donePending: 'An admin has to approve your account before you can sign in.',
  doneLinked: 'Your account is linked to your player card.', doneNotLinked: 'We could not match you to a card. An admin will link it when they approve you.',
  back: 'Back to sign in', linkFailed: 'That card could not be linked. An admin will link it when they approve you.',
  joiningAs: "I'm joining as", staff: 'Staff', player: 'Player', emailPh: 'Recovery email (optional)',
  eRole: 'Choose Staff or Player.', eEmail: 'That email address does not look right.', eEmailTaken: 'That email is already used by another account.',
  linkedTo: 'Linked to your card: {name}', emailNote: 'The recovery email is only used if you forget your password.',
};

const fr: typeof en = {
  link: 'Nouvelle joueuse ? Créer un compte', title: 'Créer votre compte', sub: 'Pour les joueuses. Les comptes du staff sont créés par un admin.',
  first: 'Prénom', last: 'Nom', username: 'Identifiant', password: 'Mot de passe (6 caractères min.)',
  create: 'Créer le compte', haveAccount: 'Déjà un compte ? Se connecter',
  eName: 'Entrez votre prénom et votre nom.', eUsername: 'Identifiant : 3 à 32 lettres, chiffres, point, tiret ou underscore.',
  ePassword: 'Le mot de passe doit contenir au moins 6 caractères.', eTaken: 'Cet identifiant est déjà pris.',
  eConfirm: 'Compte créé, mais la connexion reste bloquée tant qu’un admin n’a pas désactivé la confirmation par e-mail.',
  eNetwork: 'Serveur injoignable. Vérifiez votre connexion et réessayez.', eWeak: 'Ce mot de passe est trop faible.',
  areYou: 'Êtes-vous {name} ?', areYouSub: 'Nous avons trouvé une carte de joueuse proche du nom saisi.',
  yes: 'Oui, c’est moi', no: 'Non, ce n’est pas moi', noneOfThem: 'Aucune de celles-ci',
  doneTitle: 'Compte créé', donePending: 'Un admin doit valider votre compte avant que vous puissiez vous connecter.',
  doneLinked: 'Votre compte est lié à votre carte de joueuse.', doneNotLinked: 'Nous n’avons pas trouvé votre carte. Un admin la liera à la validation.',
  back: 'Retour à la connexion', linkFailed: 'Cette carte n’a pas pu être liée. Un admin la liera à la validation.',
  joiningAs: 'Je rejoins en tant que', staff: 'Staff', player: 'Joueuse', emailPh: 'E-mail de récupération (optionnel)',
  eRole: 'Choisissez Staff ou Joueuse.', eEmail: 'Cette adresse e-mail semble incorrecte.', eEmailTaken: 'Cet e-mail est déjà utilisé par un autre compte.',
  linkedTo: 'Liée à votre carte : {name}', emailNote: 'L’e-mail de récupération ne sert que si vous oubliez votre mot de passe.',
};

const ar: typeof en = {
  link: 'لاعبة جديدة؟ أنشئي حسابًا', title: 'إنشاء حسابك', sub: 'للاعبات. حسابات الطاقم ينشئها المسؤول.',
  first: 'الاسم', last: 'اللقب', username: 'اسم المستخدم', password: 'كلمة المرور (6 أحرف على الأقل)',
  create: 'إنشاء الحساب', haveAccount: 'لديك حساب؟ تسجيل الدخول',
  eName: 'أدخلي اسمك ولقبك.', eUsername: 'اسم المستخدم: من 3 إلى 32 حرفًا أو رقمًا أو نقطة أو شرطة.',
  ePassword: 'كلمة المرور يجب ألا تقل عن 6 أحرف.', eTaken: 'اسم المستخدم مستخدم بالفعل.',
  eConfirm: 'تم إنشاء الحساب، لكن الدخول متوقف حتى يوقف المسؤول تأكيد البريد الإلكتروني.',
  eNetwork: 'تعذّر الوصول إلى الخادم. تحقّقي من الاتصال وحاولي مجددًا.', eWeak: 'كلمة المرور ضعيفة جدًا.',
  areYou: 'هل أنتِ {name}؟', areYouSub: 'وجدنا بطاقة لاعبة قريبة من الاسم الذي كتبتِه.',
  yes: 'نعم، هذه أنا', no: 'لا، لست أنا', noneOfThem: 'ليست أي منها',
  doneTitle: 'تم إنشاء الحساب', donePending: 'يجب أن يوافق المسؤول على حسابك قبل أن تتمكني من الدخول.',
  doneLinked: 'تم ربط حسابك ببطاقة لاعبتك.', doneNotLinked: 'لم نجد بطاقتك. سيربطها المسؤول عند الموافقة.',
  back: 'العودة لتسجيل الدخول', linkFailed: 'تعذّر ربط هذه البطاقة. سيربطها المسؤول عند الموافقة.',
  joiningAs: 'أنضم بصفة', staff: 'طاقم', player: 'لاعبة', emailPh: 'بريد الاستعادة (اختياري)',
  eRole: 'اختاري طاقم أو لاعبة.', eEmail: 'عنوان البريد الإلكتروني غير صحيح.', eEmailTaken: 'هذا البريد مستخدم في حساب آخر.',
  linkedTo: 'مرتبط ببطاقتك: {name}', emailNote: 'بريد الاستعادة يُستخدم فقط عند نسيان كلمة المرور.',
};
export const SU: Record<Language, typeof en> = { en, fr, ar };
