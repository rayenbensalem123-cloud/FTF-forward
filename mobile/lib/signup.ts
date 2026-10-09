import { ApiError, currentSession, insert, rpc, signOutRemote, signUpWithUsername } from '@/lib/supabase';

export interface CardSuggestion {
  memberId: number;
  name: string;
  number: string;
  position: string;
  category: string;
  club: string;
}

export type SignUpRole = 'staff' | 'player';
export type SignUpError = 'taken' | 'confirm' | 'weak' | 'network' | 'username' | 'password' | 'name' | 'role' | 'email' | 'emailTaken';

export interface SignUpOutcome {
  error: SignUpError | null;
  /** True when the database already matched her name to a card (exact spelling). */
  linked: boolean;
  /** The card the account is already linked to (exact name match), when the database can tell us. */
  card: CardSuggestion | null;
  suggestions: CardSuggestion[];
}

const USERNAME_RE = /^[a-z0-9._-]{3,32}$/;

/** Same rules as the website's registerUser. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function checkSignUp(first: string, last: string, username: string, password: string, role: SignUpRole | '' = 'player', email = ''): SignUpError | null {
  if (!first.trim() || !last.trim()) return 'name';
  if (!role) return 'role';
  if (email.trim() && !EMAIL_RE.test(email.trim())) return 'email';
  if (!USERNAME_RE.test(username.trim().toLowerCase())) return 'username';
  if (password.length < 6) return 'password';
  return null;
}

/**
 * Creates a pending player account. The signed-in session is kept just long enough
 * to ask the database for card suggestions and confirm one, then finishSignUp() ends it.
 */
export async function createAccount(first: string, last: string, usernameRaw: string, password: string, role: SignUpRole | '', email = ''): Promise<SignUpOutcome> {
  const bad = checkSignUp(first, last, usernameRaw, password, role, email);
  if (bad || !role) return { error: bad ?? 'role', linked: false, card: null, suggestions: [] };
  const username = usernameRaw.trim().toLowerCase();

  const up = await signUpWithUsername(username, password);
  if (up.error) return { error: up.error, linked: false, card: null, suggestions: [] };

  try {
    const row = await insert('profiles', { id: currentSession()?.userId ?? '', username, first_name: first.trim(), last_name: last.trim(), role, ...(email.trim() ? { email: email.trim().toLowerCase() } : {}) });
    const linked = row?.member_id != null;
    let suggestions: CardSuggestion[] = [];
    let card: CardSuggestion | null = null;
    if (linked && role === 'player') card = await myCard();
    if (!linked && role === 'player') {
      try {
        const list = await rpc<any[]>('suggest_player_cards');
        suggestions = (list ?? []).map((c) => ({
          memberId: c.member_id, name: c.name ?? '', number: c.jersey_number ?? '', position: c.card_position ?? '', category: c.category ?? '', club: c.club ?? '',
        }));
      } catch {
        // The suggestion function is optional: without it she is simply linked by an admin later.
      }
    }
    return { error: null, linked, card, suggestions };
  } catch (e) {
    await signOutRemote();
    const dup = e instanceof ApiError && /duplicate|already exists/i.test(e.message);
    const emailDup = dup && /email/i.test((e as ApiError).message);
    return { error: emailDup ? 'emailTaken' : dup ? 'taken' : 'network', linked: false, card: null, suggestions: [] };
  }
}

/** The card the new account is linked to, if the optional supabase-card-summary.sql function exists. */
async function myCard(): Promise<CardSuggestion | null> {
  try {
    const rows = await rpc<any[]>('my_linked_card');
    const c = rows?.[0];
    return c ? { memberId: c.member_id, name: c.name ?? '', number: c.jersey_number ?? '', position: c.card_position ?? '', category: c.category ?? '', club: c.club ?? '' } : null;
  } catch {
    return null;
  }
}

/** "Yes, that's me": links the account to the card. Returns false when the database refuses. */
export async function confirmCard(memberId: number): Promise<boolean> {
  try {
    return (await rpc<boolean>('claim_player_card', { p_member_id: memberId })) === true;
  } catch {
    return false;
  }
}

/** A pending account must not look signed in. */
export const finishSignUp = signOutRemote;
