# Lovable design — extracted spec

Source: <https://lovable.dev/preview/hLksdIRpN43S6DZr8pEuYVwoR1mH9Fab>
Project: `lovp_2anckrhpda86srqj7c8ypjedva` (`6e31316b-108d-42f6-922a-ffec699ff4bc`)
App title: **FTF Forward — Équipe Nationale Féminine de Tunisie**

Extracted by rendering the preview in a browser and reading the computed styles
off the live frame, so every value below is what the design actually renders,
not what its source claims. The preview link expires after 7 days; this file is
the durable copy.

The design covers three routes only — `/` (home), `/squad`, `/coaches`. The app
has ~30 screens, so this is a **design language**, not a screen-for-screen
spec: the value is in the type scale and the shared primitives.

---

## 1. The palette finding

The stylesheet carries two palettes side by side, and only one of them is
actually painted:

| Set | State | Notes |
| --- | --- | --- |
| `--c-*` | fully defined | **byte-identical to this repo** — see below |
| `--ftf-*` | defined but **empty** | `--ftf-navy`, `--ftf-gold`, `--ftf-red`, `--ftf-line`, `--ftf-panel`, `--ftf-panel-2`, `--ftf-blue` were declared and never assigned |

The `--c-*` set is the same design system as `docs/mobile-redesign-interactive.html`
and this repo's `mobile/constants/theme.ts`:

| Lovable | `theme.ts` | Match |
| --- | --- | --- |
| `--c-bg: #0c1f3d` | `colors.navy` | ✅ |
| `--c-deep: #0b111e` | `colors.navyDeep` | ✅ |
| `--c-panel3: #101b33` | `colors.card` | ✅ |
| `--c-panel: #112950` | `colors.cardRaised` | ✅ |
| `--acc-gold: #f6c744` | `colors.gold` | ✅ |
| `--c-text: #edeff4` | `colors.white` | ✅ |
| `--c-textFaint: #8fa0bd` | `colors.muted` | ✅ |
| `--line-rgb: 148,170,210` | `colors.goldBorder` | ✅ |

So the Lovable project was built **from this repo's design system**. What the
current Lovable build adds on top is the *shadcn* token layer (`--primary:
oklch(55% .22 25)` = red, `--radius: .75rem`) plus a red header and a warm-dark
page background, which is why the render looks redder than `theme.ts`.

**Applied decision:** keep the FTF palette (navy base, gold accent, red for
danger) and take the Lovable **structure** — type scale, tracking, and the
display face. No new hues were introduced.

## 2. Typography — the actual signature

The whole visual identity is one condensed display face. Two families:

- **Oswald** — every heading, team code, brand and score. Always weight 700.
- **Geist** (Inter fallback) — body and micro-labels.

The app had **no font library at all** before this (`expo-font` was absent and
the only `fontFamily` in the codebase was `'monospace'`), so everything
rendered in the platform default. That gap is why the two looks read as so
different, and it is the single highest-leverage change.

### Measured type scale

| Face | Size | Weight | Tracking | Case | Example |
| --- | --- | --- | --- | --- | --- |
| Geist | 10 | 400 | normal | upper | `SAM 24 OCT` |
| Geist | 10 | 600 | normal | — | `Accueil` (tab label) |
| Geist | 10 | 700 | **2.5px** | upper | `Prochain match` |
| Geist | 11 | 400 | normal | — | `SAM 24 OCT · Radès` |
| Geist | 12 | 400 | normal | — | `CAN Féminine · Qualif.` |
| Geist | 12 | 600 | normal | — | `Tout voir` |
| Geist | 12 | 700 | normal | — | `16:00` |
| Geist | 12 | 700 | normal | upper | `Séniors` |
| Oswald | 14 | 700 | normal | — | `TUNISIE` |
| Oswald | 16 | 700 | normal | — | `TUN` |
| Oswald | 18 | 700 | 0.45px | upper | `FTF Forward`, `Calendrier` |
| Oswald | 24 | 700 | normal | upper | `Séniors` |
| Oswald | 30 | 700 | normal | — | `16:00` (hero) |

The discipline worth copying: **everything ≤12px is body or an uppercase
micro-label; Oswald only starts at 18px.** There is no 13–17px heading tier at
all. The widest tracking in the whole design is reserved for the smallest text.

Mapped into `theme.ts` as `typeScale.{micro, navLabel, meta, body, link,
time, teamCode, brand, feature, hero}` and `fonts.display`.

## 3. Radii and elevation

| Token | Value | Tailwind |
| --- | --- | --- |
| small | 8 | `rounded-sm` |
| md | 10 | `rounded-md` |
| card | 16 | `rounded-2xl` |
| pill | full | `rounded-full` |

Elevation is a hairline ring rather than a soft shadow — `ring-1 ring-white/20`
and `0 0 0 1px` borders. The one shadow seen was `rgba(0,0,0,.88) 0 0 0 1px`,
i.e. a border drawn by a shadow, exactly the `--shadow-card` idea already in
`theme.ts`.

*Not applied*: `radius` in `theme.ts` was left alone. The current `20` card
radius comes from the approved prototype, and 16 vs 20 is a smaller difference
than the type change and riskier to sweep across every card.

## 4. Component anatomy

**Header** — `sticky z-20 px-4 py-3`, red background. Logo 36×36 `rounded-full`
on white with 2px padding; brand Oswald 18/700 uppercase, 0.45px tracking;
avatar button 36×36 `rounded-full bg-black/20`.

**Section header** — Oswald 18/700 uppercase title on the left, see-all link on
the right at Geist 12/600 in the accent colour (`Tout voir`).

**Match card** — `rounded-2xl`, `overflow-hidden`. Anatomy top to bottom:
competition eyebrow (Geist 12/400, white/80) → flag + team code + kick-off
pill + team code + flag → date and venue (Geist 11/400). Cards scroll
horizontally.

**Quick-action grid** — `grid grid-cols-4`, rounded-square icon tiles with the
icon in the accent colour, label below at Geist 11/600.

**Selection cards** — full-bleed photo, `rounded-2xl`, `overflow-hidden`, title
overlaid bottom-left in Oswald 24/700 uppercase (SÉNIORS / U20 / U17).

**Bottom nav** — 4 tabs, `flex flex-col items-center gap-1.5`, label Geist
10/600. Inactive `text-white/55`, active full white.

## 5. What was applied, and what was not

Applied in the typography commit:

- `expo-font` + `@expo-google-fonts/oswald` installed; `Oswald_700Bold` loaded
  in `app/_layout.tsx` behind a navy holding frame so headings never paint in
  the platform face and then swap.
- `theme.ts` gained `fonts.display` and the `typeScale` table above — added,
  with every existing token left intact.
- `sectionTitle` moved 13/800 system → 18/700 Oswald, **colour stays gold**.
- `AppHeader` title moved 17/800 sentence case → `typeScale.brand`.
- Tab bar labels set in the display face.

Deliberately not applied:

- The red header and warm-dark page background. The brief was to keep the FTF
  palette, so navy stays the base and gold stays the accent.
- The radii change (see §3).
- Any screen beyond the shared primitives — the Lovable design only specifies
  three routes, so screens are taken one at a time.

## 6. Caveat for Arabic

Oswald is Latin-only. Arabic headings fall back to the platform face per glyph,
which is correct behaviour and needs no code — but it does mean the display
face is a French/English treatment only. If Arabic typographic parity ever
matters, that needs a separate Arabic display face, not more weights of Oswald.
