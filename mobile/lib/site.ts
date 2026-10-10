/** The website the app shares its backend with; its API routes (password reset, news) live there. */
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL || 'https://tunisia-wnt.vercel.app').replace(/\/$/, '');

/** POST JSON to one of the website's API routes. Never throws: returns `{ error }` on any failure. */
export async function postSite(path: string, body: unknown): Promise<{ ok?: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${SITE_URL}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { error: json?.error || `HTTP ${res.status}` };
    return json;
  } catch {
    return { error: 'network' };
  }
}
