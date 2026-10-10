/**
 * Creates a Supabase account for every player in `members`, links it to that
 * player's card, and prints the credentials once.
 *
 *   node scripts/create-player-accounts.mjs           # DRY RUN - prints, writes nothing
 *   node scripts/create-player-accounts.mjs --apply   # actually creates them
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (see .env.local.example).
 * The anon key cannot be used: creating a user needs the Admin API.
 *
 * THREE writes are needed per player, because nothing links them for us:
 *
 *   1. auth.users          - the login itself, via POST /auth/v1/admin/users
 *   2. login_emails        - username -> email, which get_login_email() reads
 *                            to turn a typed username into an email
 *   3. profiles            - role='player', which is what row-level security
 *                            and autolink_player_card() key off
 *
 * Then a fourth PATCH, and this one is easy to miss: trg_guard_profile_insert
 * forces status := 'pending' unless the caller is an active admin
 * (current_active_admin() reads auth.uid(), which is NULL for a service-role
 * call). current_active_user() requires status = 'active', so a profile left
 * at 'pending' belongs to a player who can read nothing at all.
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const APPLY = process.argv.includes('--apply')

// ───────── env ─────────
const env = {}
const envFile = resolve(root, '.env.local')
try {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  /* fall through to process.env */
}

const URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || ''

// The publishable anon key is public by design (it ships to every browser and
// is already hardcoded as a fallback in mobile/lib/supabase.ts), so the roster
// can be read with it - that is what makes the dry run work with no secrets.
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_uWKPc6v72wsGENQ6G6D02Q_nrUqRhR3'

if (!URL) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL.')
  process.exit(1)
}
if (APPLY && !KEY) {
  console.error('Creating accounts needs SUPABASE_SERVICE_ROLE_KEY in .env.local')
  console.error('(Supabase Dashboard > Settings > API). The anon key cannot create users.')
  process.exit(1)
}

// Same email domain the app's own sign-up path uses. These addresses are never
// sent anywhere - they exist because auth.users.email is NOT NULL and
// get_login_email() hands this one back to the login call.
const EMAIL_DOMAIN = 'placeholder.tunisia-wnt.local'

// ───────── naming rules ─────────
// Mirrors public.norm_person_name(): fold accents to ASCII, then keep a-z only.
// Matching the database exactly is what makes autolink_player_card() find the
// card - if this drifts, every account comes out unlinked.
const ACCENTS = 'àáâãäåèéêëìíîïòóôõöùúûüýÿçñ'
const FOLDED = 'aaaaaaeeeeiiiiooooouuuuyycn'
const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .split('')
    .map((c) => {
      const i = ACCENTS.indexOf(c)
      return i === -1 ? c : FOLDED[i]
    })
    .join('')
    .replace(/[^a-z]/g, '')

const usernameFor = (name) => norm(name)
const firstNameOf = (name) => String(name).trim().split(/\s+/)[0]
const lastNameOf = (name) => String(name).trim().split(/\s+/).slice(1).join(' ')

/**
 * "FTF" + first name + "2026".
 *
 * Salma and Yasmine each appear twice on this roster, so the bare first name
 * would hand two different players the same password. Only on a collision, the
 * last name's initial is appended: FTFSalmaM2026 / FTFSalmaZ2026.
 */
function passwordFor(name, taken) {
  const base = `FTF${firstNameOf(name)}2026`
  if (!taken.has(base.toLowerCase())) {
    taken.add(base.toLowerCase())
    return base
  }
  const initial = lastNameOf(name).charAt(0).toUpperCase() || 'X'
  const withInitial = `FTF${firstNameOf(name)}${initial}2026`
  taken.add(withInitial.toLowerCase())
  return withInitial
}

// ───────── http ─────────
async function call(path, { method = 'GET', body, anon = false } = {}) {
  const key = anon ? ANON : KEY
  const res = await fetch(`${URL}${path}`, {
    method,
    headers: {
      apikey: key,
      // New-style publishable keys (sb_publishable_...) are not JWTs and go in
      // apikey only - same rule as emailForUsername() in mobile/lib/supabase.ts.
      // The service-role key IS a JWT and needs the Bearer form.
      ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}),
      'Content-Type': 'application/json',
      ...(method === 'GET' ? {} : { Prefer: 'return=representation' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  return { ok: res.ok, status: res.status, data }
}

// ───────── main ─────────
console.log(`\n${APPLY ? 'APPLYING' : 'DRY RUN - nothing will be written. Re-run with --apply to create.'}`)
console.log(`project: ${URL.replace('https://', '')}\n`)

// squad_public is the column-limited roster view that is deliberately readable
// with the anon key (see scripts/public-squad-view.sql). Reading it here means
// the dry run needs no secret at all.
const rosterRes = await call('/rest/v1/squad_public?select=id,name,role&role=eq.PLAYERS&order=id', { anon: true })
if (!rosterRes.ok) {
  console.error('Could not read the roster:', rosterRes.status, rosterRes.data)
  process.exit(1)
}
const players = rosterRes.data
console.log(`Found ${players.length} players on the roster.\n`)

// Build every credential up front so password collisions are resolved across
// the WHOLE roster, not just within one row at a time.
const seenPasswords = new Map()
const taken = new Set()
const plan = players.map((p) => {
  const username = usernameFor(p.name)
  let password = passwordFor(p.name, taken)
  // Two players can only collide on username if their names normalise the same
  // way (e.g. "Salma Marzouki" vs "Salma  Marzouki"). Flag rather than guess.
  const usernameClash = seenPasswords.has(username)
  seenPasswords.set(username, p.name)
  return {
    id: p.id,
    name: p.name,
    firstName: firstNameOf(p.name),
    lastName: lastNameOf(p.name),
    username,
    password,
    email: `${username}@${EMAIL_DOMAIN}`,
    usernameClash,
  }
})

const width = Math.max(...plan.map((r) => r.name.length))
console.log('  name'.padEnd(width + 4) + 'username'.padEnd(28) + 'password')
console.log('  ' + '-'.repeat(width + 30))
for (const r of plan) {
  console.log(`  ${r.name.padEnd(width)}${r.username.padEnd(28)}${r.password}`)
}

const clashes = plan.filter((r) => r.usernameClash)
if (clashes.length) {
  console.log('\n!! Username collision - these normalise to the same login:')
  clashes.forEach((c) => console.log(`   ${c.name} -> ${c.username}`))
  console.log('   Resolve by hand; the script will not guess between them.')
}

if (!APPLY) {
  console.log(`\nDry run only. Run again with --apply to create these ${plan.length} accounts.`)
  process.exit(0)
}

// ───────── create ─────────
const results = []
for (const r of plan) {
  const row = { ...r, created: false, linked: null, error: null }

  try {
    // 1. the auth account
    const user = await call('/auth/v1/admin/users', {
      method: 'POST',
      body: {
        email: r.email,
        password: r.password,
        email_confirm: true, // no confirmation email - staff hands these out
        user_metadata: { username: r.username, role: 'player' },
      },
    })

    let userId = user.data?.id ?? null
    if (!user.ok && user.status === 422 && /already/i.test(String(user.data?.msg || user.data?.message || ''))) {
      const existing = await call(`/auth/v1/admin/users?email=${encodeURIComponent(r.email)}`)
      userId = existing.data?.users?.[0]?.id ?? null
    } else if (!user.ok && !userId) {
      row.error = `auth ${user.status}: ${JSON.stringify(user.data).slice(0, 120)}`
      results.push(row)
      continue
    } else {
      row.created = true
    }

    if (!userId) {
      row.error = 'no user id'
      results.push(row)
      continue
    }

    // 2. username -> email, which is how the app resolves a login
    await call('/rest/v1/login_emails', {
      method: 'POST',
      body: { username: r.username, email: r.email },
    })

    // 3. the profile. status is forced to 'pending' by the insert trigger.
    await call('/rest/v1/profiles', {
      method: 'POST',
      body: {
        id: userId,
        username: r.username,
        first_name: r.firstName,
        last_name: r.lastName,
        role: 'player',
      },
    })

    // 4. ...so activate it explicitly. Without this the player can sign in
    //    and then read nothing, because current_active_user() is false.
    await call(`/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      body: { status: 'active' },
    })

    // 5. did autolink_player_card() find the card?
    const check = await call(`/rest/v1/profiles?id=eq.${userId}&select=member_id`)
    row.linked = check.data?.[0]?.member_id ?? null
    if (row.linked === null) row.error = 'UNLINKED - set the card by hand in Manage Users'
  } catch (e) {
    row.error = e.message
  }

  results.push(row)
  const mark = row.error ? '!' : 'ok'
  const link = row.linked === null ? 'unlinked' : `card #${row.linked}`
  console.log(`  [${mark}] ${row.name.padEnd(width)} ${link}${row.error ? `  (${row.error})` : ''}`)
}

// ───────── summary ─────────
const ok = results.filter((r) => !r.error)
const unlinked = results.filter((r) => r.error && /UNLINKED/.test(r.error))
const failed = results.filter((r) => r.error && !/UNLINKED/.test(r.error))

console.log(`\n${'-'.repeat(50)}`)
console.log(`created : ${results.filter((r) => r.created).length}/${plan.length}`)
console.log(`linked  : ${results.filter((r) => r.linked !== null).length}/${plan.length}`)
if (unlinked.length) {
  console.log(`\nNeeds a manual link (name matched no single card):`)
  unlinked.forEach((r) => console.log(`   ${r.username}  (${r.name})`))
}
if (failed.length) {
  console.log(`\nFailed:`)
  failed.forEach((r) => console.log(`   ${r.name}: ${r.error}`))
}
if (ok.length === plan.length) {
  console.log('\nAll accounts created and linked. Credentials above are shown once - save them.')
}
