import { getJson, KEYS, removeKey, setJson } from '@/lib/storage';

/**
 * Minimal Supabase client for the same project the website uses.
 *
 * It talks to PostgREST (/rest/v1), GoTrue (/auth/v1) and Storage (/storage/v1)
 * with plain fetch, so the app adds no dependency. Only the public anon key is
 * ever shipped. Every request carries the signed-in user's own JWT, so the
 * database's row-level security decides what that person can read and write,
 * exactly as it does on the website. There is no service-role key in the app.
 */
export const SUPABASE_URL: string | undefined = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const ANON_KEY: string | undefined = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const isConfigured = !!SUPABASE_URL && !!ANON_KEY;

const TIMEOUT_MS = 12000;

export interface Session {
  accessToken: string;
  refreshToken: string;
  /** Epoch seconds */
  expiresAt: number;
  userId: string;
}

let session: Session | null = null;
/** Called when the refresh token is rejected, so the app can return to sign-in. */
let onSessionLost: (() => void) | null = null;
export const setSessionLostHandler = (fn: (() => void) | null) => {
  onSessionLost = fn;
};

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function toSession(body: any): Session {
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: body.expires_at ?? Math.floor(Date.now() / 1000) + (body.expires_in ?? 3600),
    userId: body.user?.id ?? session?.userId ?? '',
  };
}

async function timedFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function need(): { url: string; key: string } {
  if (!SUPABASE_URL || !ANON_KEY) throw new ApiError('Supabase is not configured', 0);
  return { url: SUPABASE_URL, key: ANON_KEY };
}

// ───────── Session ─────────
export async function loadSession(): Promise<Session | null> {
  session = await getJson<Session>(KEYS.session);
  return session;
}

export const currentSession = () => session;

async function saveSession(s: Session | null) {
  session = s;
  if (s) await setJson(KEYS.session, s);
  else await removeKey(KEYS.session);
}

let refreshing: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!session) return false;
  if (refreshing) return refreshing;
  const { url, key } = need();
  const token = session.refreshToken;
  refreshing = (async () => {
    try {
      const res = await timedFetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { apikey: key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: token }),
      });
      if (res.status === 400 || res.status === 401) {
        // The refresh token is dead: the session is over.
        await saveSession(null);
        onSessionLost?.();
        return false;
      }
      if (!res.ok) return false; // transient (offline, 5xx): keep the session and try later
      await saveSession(toSession(await res.json()));
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

// ───────── Auth ─────────
/** Username -> login email, using the same RPC as the website's login form. */
async function emailForUsername(username: string): Promise<string | null> {
  const { url, key } = need();
  const res = await timedFetch(`${url}/rest/v1/rpc/get_login_email`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_username: username.trim().toLowerCase() }),
  });
  if (!res.ok) return null;
  const email = await res.json();
  return typeof email === 'string' && email ? email : null;
}

export type SignInError = 'not_found' | 'wrong_password' | 'network';

export async function signInWithUsername(username: string, password: string): Promise<{ error: SignInError | null }> {
  const { url, key } = need();
  try {
    const email = await emailForUsername(username);
    if (!email) return { error: 'not_found' };
    const res = await timedFetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return { error: 'wrong_password' };
    await saveSession(toSession(await res.json()));
    return { error: null };
  } catch {
    return { error: 'network' };
  }
}

export async function signOutRemote(): Promise<void> {
  const s = session;
  await saveSession(null);
  if (!s || !isConfigured) return;
  try {
    const { url, key } = need();
    await timedFetch(`${url}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${s.accessToken}` },
    });
  } catch {
    // The local session is already gone; a failed revoke is not worth surfacing.
  }
}

// ───────── Requests ─────────
async function authed(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const { url, key } = need();
  if (!session) throw new ApiError('Not signed in', 401);
  // Renew a little early so a request never goes out with a token about to lapse.
  if (session.expiresAt - 30 < Date.now() / 1000) await refreshSession();
  if (!session) throw new ApiError('Not signed in', 401);
  const res = await timedFetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 401 && retry && (await refreshSession())) return authed(path, init, false);
  return res;
}

async function fail(res: Response): Promise<never> {
  let msg = `HTTP ${res.status}`;
  try {
    const body = await res.json();
    msg = body?.message || body?.error_description || body?.hint || msg;
  } catch {
    // keep the status text
  }
  throw new ApiError(msg, res.status);
}

export async function select<T = any>(table: string, query: string): Promise<T[]> {
  const res = await authed(`/rest/v1/${table}?${query}`);
  if (!res.ok) return fail(res);
  return (await res.json()) as T[];
}

/**
 * Row-level security answers a refused write with success and zero rows, not an
 * error. Asking for the changed rows back lets us tell "saved" from "not allowed".
 */
export async function update<T = any>(table: string, filter: string, patch: Record<string, unknown>): Promise<T[]> {
  const res = await authed(`/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) return fail(res);
  const rows = (await res.json()) as T[];
  if (rows.length === 0) throw new ApiError('Not allowed or not found', 403);
  return rows;
}

export async function insert<T = any>(table: string, row: Record<string, unknown>): Promise<T> {
  const res = await authed(`/rest/v1/${table}`, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  if (!res.ok) return fail(res);
  const rows = (await res.json()) as T[];
  if (!rows[0]) throw new ApiError('Not allowed', 403);
  return rows[0];
}

/** Insert, or update the row that already has the same values in `onConflict` (comma-separated columns). */
export async function upsert(table: string, row: Record<string, unknown>, onConflict: string): Promise<void> {
  const res = await authed(`/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(row),
  });
  if (!res.ok) return fail(res);
  const rows = (await res.json()) as unknown[];
  if (rows.length === 0) throw new ApiError('Not allowed', 403);
}

export async function remove(table: string, filter: string): Promise<void> {
  const res = await authed(`/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' },
  });
  if (!res.ok) return fail(res);
  const rows = (await res.json()) as unknown[];
  if (rows.length === 0) throw new ApiError('Not allowed or not found', 403);
}

// ───────── Photos (private "members" bucket) ─────────
const SIGN_TTL_S = 3600;
const signed = new Map<string, { url: string; at: number }>();

/** Short-lived signed URLs for storage paths, cached for 50 minutes. */
export async function signedPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const todo: string[] = [];
  for (const p of new Set(paths.filter(Boolean))) {
    const hit = signed.get(p);
    if (hit && Date.now() - hit.at < 50 * 60 * 1000) out[p] = hit.url;
    else todo.push(p);
  }
  if (todo.length === 0 || !SUPABASE_URL) return out;
  try {
    const res = await authed('/storage/v1/object/sign/members', {
      method: 'POST',
      body: JSON.stringify({ expiresIn: SIGN_TTL_S, paths: todo }),
    });
    if (!res.ok) return out;
    const items = (await res.json()) as { path: string; signedURL: string | null }[];
    for (const it of items) {
      if (!it.signedURL) continue;
      const full = `${SUPABASE_URL}/storage/v1${it.signedURL.startsWith('/') ? '' : '/'}${it.signedURL}`;
      signed.set(it.path, { url: full, at: Date.now() });
      out[it.path] = full;
    }
  } catch {
    // Photos are decoration: initials avatars take over.
  }
  return out;
}
