/**
 * Removes the leftover test accounts. Run with --apply to actually delete.
 *
 * The list is explicit on purpose: a wildcard over "player" accounts would be
 * one regex mistake away from deleting the 24 real ones. Nothing is deleted
 * unless its username is named here.
 *
 * Deleting the auth user cascades into profiles (profiles.id references
 * auth.users(id) ON DELETE CASCADE), but login_emails has no such foreign key,
 * so those rows are removed explicitly or they linger as orphans.
 */
import { readFileSync } from 'node:fs'

const APPLY = process.argv.includes('--apply')

const env = {}
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '')
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

// Keep: admin, iyed (real staff) and the 24 accounts created for the roster.
const DELETE = [
  'salma', // superseded by salmamarzouki on the same card #9
  'vlmv29dk8xaccent',
  'vlmv29dk8xsoulaima',
  'vlmv29dk8xmessy',
  'vlmv29dk8xsalma',
  'zz_probe_test',
  'chk_player_0d973762',
  'chk_staff_1ed7201d',
  'live_player_213742b725',
  'live_staff_213742f54d',
  'final_231156',
  'nesrine', // auth user with no profile and no login mapping - cannot sign in
  'samia', // same
]

const call = async (path, method = 'GET', body) => {
  const res = await fetch(`${URL}${path}`, {
    method,
    headers: H,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  let data = null
  try { data = await res.json() } catch { data = null }
  return { status: res.status, data }
}

console.log(`${APPLY ? 'APPLYING' : 'DRY RUN - nothing deleted. Re-run with --apply.'}\n`)

// Resolve each username to its auth user, so we delete by id and never by
// matching on an email that might have drifted.
const users = (await call('/auth/v1/admin/users?page=1&per_page=200')).data?.users ?? []
const targets = DELETE.map((u) => {
  const found = users.find((x) => x.user_metadata?.username === u || x.email === `${u}@placeholder.tunisia-wnt.local`)
  return { username: u, id: found?.id ?? null, email: found?.email ?? null }
})

console.log('will delete:')
for (const t of targets) {
  console.log(`  ${t.id ? 'auth+profile' : 'no auth user '}  ${t.username.padEnd(26)} ${t.email ?? '(none found)'}`)
}
const missing = targets.filter((t) => !t.id)
if (missing.length) console.log(`  (${missing.length} have no auth user - only a login_emails row to clear)`)

const profiles = (await call('/rest/v1/profiles?select=username,member_id')).data ?? []
const linked = profiles.filter((p) => DELETE.includes(p.username) && p.member_id !== null)
if (linked.length) {
  console.log('\nnote: these are linked to a real player card, which the new account also covers:')
  linked.forEach((p) => console.log(`  ${p.username} -> card #${p.member_id}`))
}

if (!APPLY) {
  console.log('\nDry run only. Run again with --apply to delete.')
  process.exit(0)
}

console.log('')
let deletedUsers = 0
for (const t of targets) {
  if (t.id) {
    const r = await call(`/auth/v1/admin/users/${t.id}`, 'DELETE')
    const ok = r.status >= 200 && r.status < 300
    if (ok) deletedUsers++
    console.log(`  [${ok ? 'ok' : r.status}] auth user ${t.username}${ok ? '' : ` ${JSON.stringify(r.data).slice(0, 80)}`}`)
  }
  const le = await call(`/rest/v1/login_emails?username=eq.${encodeURIComponent(t.username)}`, 'DELETE')
  const n = Array.isArray(le.data) ? le.data.length : 0
  if (n) console.log(`         cleared ${n} login_emails row(s)`)
}

// profiles go with the auth user via ON DELETE CASCADE; this only confirms.
const after = (await call('/rest/v1/profiles?select=username')).data ?? []
const leaked = after.filter((p) => DELETE.includes(p.username))
console.log(`\nauth users removed: ${deletedUsers}/${targets.filter((t) => t.id).length}`)
console.log(`profiles still present from the list: ${leaked.length}${leaked.length ? ' -> ' + leaked.map((p) => p.username).join(', ') : ''}`)

const usersAfter = (await call('/auth/v1/admin/users?page=1&per_page=200')).data?.users ?? []
const profilesAfter = (await call('/rest/v1/profiles?select=username,role,status')).data ?? []
console.log(`\nremaining auth users: ${usersAfter.length}`)
console.log(`remaining profiles   : ${profilesAfter.length}`)
console.log('  ' + profilesAfter.map((p) => `${p.username}(${p.role}/${p.status})`).sort().join(' '))
