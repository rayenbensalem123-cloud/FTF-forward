import { ApiError, currentSession, insert, rpc, signOutRemote, signUpWithUsername } from '@/lib/supabase';

export interface CardSuggestion {
  memberId: number;
  name: string;
  number: string;
  position: string;
  category: string;
  club: string;
}

export type SignUpError = 'taken' | 'confirm' | 'weak' | 'network' | 'username' | 'password' | 'name';

export interface SignUpOutcome {
  error: SignUpError | null;
  /** True when the database already matched her name to a card (exact spelling). */
  linked: boolean;
  suggestions: CardSuggestion[];
}

const USERNAME_RE = /^[a-z0-9._-]{3,32}$/;

/** Same rules as the website's registerUser. */
export function checkSignUp(first: string, last: string, username: string, password: string): SignUpError | null {
  if (!first.trim() || !last.trim()) return 'name';
  if (!USERNAME_RE.test(username.trim().toLowerCase())) return 'username';
  if (password.length < 6) return 'password';
  return null;
}

/**
 * Creates a pending player account. The signed-in session is kept just long enough
 * to ask the database for card suggestions and confirm one, then finishSignUp() ends it.
 */
export async function createPlayerAccount(first: string, last: string, usernameRaw: string, password: string): Promise<SignUpOutcome> {
  const bad = checkSignUp(first, last, usernameRaw, password);
  if (bad) return { error: bad, linked: false, suggestions: [] };
  const username = usernameRaw.trim().toLowerCase();

  const up = await signUpWithUsername(username, password);
  if (up.error) return { error: up.error, linked: false, suggestions: [] };

  try {
    const row = await insert('profiles', { id: currentSession()?.userId ?? '', username, first_name: first.trim(), last_name: last.trim(), role: 'player' });
    const linked = row?.member_id != null;
    let suggestions: CardSuggestion[] = [];
    if (!linked) {
      try {
        const list = await rpc<any[]>('suggest_player_cards');
        suggestions = (list ?? []).map((c) => ({
          memberId: c.member_id, name: c.name ?? '', number: c.jersey_number ?? '', position: c.card_position ?? '', category: c.category ?? '', club: c.club ?? '',
        }));
      } catch {
        // The suggestion function is optional: without it she is simply linked by an admin later.
      }
    }
    return { error: null, linked, suggestions };
  } catch (e) {
    await signOutRemote();
    const taken = e instanceof ApiError && /duplicate|already exists/i.test(e.message);
    return { error: taken ? 'taken' : 'network', linked: false, suggestions: [] };
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
