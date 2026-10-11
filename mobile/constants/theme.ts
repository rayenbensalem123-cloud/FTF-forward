/**
 * Dark theme taken from the website (app/globals.css, the FTF palette):
 * --c-bg, --c-panel3, --c-panel, --line-rgb, --c-text, --c-textFaint.
 * Keep these in step with the platform so both look like one product.
 *
 * There is deliberately no gold in this theme: every accent that used to be
 * gold is white now, and actions are federation red. Do not reintroduce a
 * gold token without checking with the design owner first.
 *
 * The redesign prototype (docs/mobile-redesign-interactive.html) adds `line`
 * at .18 alpha, a 20px card radius and one card shadow -- see `radius.card`
 * and `shadow.card` below.
 */
export const colors = {
  red: '#E30613',
  navy: '#0C1F3D', // --c-bg: page background
  navyDeep: '#0B111E', // --c-deep
  card: '#101B33', // --c-panel3: cards, tab bar
  cardRaised: '#112950', // --c-panel: avatars, icon tiles, crests
  white: '#EDEFF4', // --c-text (never pure white)
  muted: '#8FA0BD', // --c-textFaint
  green: '#22C55E',
  amber: '#F59E0B',
  redSoft: 'rgba(227, 6, 19, 0.18)',
  greenSoft: 'rgba(34, 197, 94, 0.16)',
  amberSoft: 'rgba(245, 158, 11, 0.16)',
  whiteSoft: 'rgba(255, 255, 255, 0.10)',
  line: 'rgba(148, 170, 210, 0.14)',
  // The prototype draws every divider at .18.
  hairline: 'rgba(148, 170, 210, 0.18)',
  scrim: 'rgba(3, 8, 20, 0.7)',
} as const;

export const radius = { sm: 10, md: 16, lg: 22, card: 20, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

/** Prototype `--shadow-card`: a soft lift plus a hairline ring drawn by the shadow itself. */
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  hero: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

/**
 * The Lovable design's whole visual signature is one condensed display face:
 * every heading, team code and score is Oswald 700. The app had no display
 * face at all before this, so all of it rendered in the platform default.
 *
 * Loaded in app/_layout.tsx with expo-font. Oswald ships Latin only, so
 * Arabic headings fall back to the system face per glyph -- the layout is
 * unaffected because neither face is condensed enough to change a line break.
 */
export const fonts = { display: 'Oswald_700Bold' } as const;

/**
 * The design's type scale, deliberately small: everything 12px and below is
 * a body or a micro-label in the platform face, and Oswald only starts at
 * `section`. Screens pick a role here rather than restating raw numbers, so a
 * label reads the same on every screen.
 */
export const typeScale = {
  /** 10/700 uppercase, wide tracking -- "PROCHAIN MATCH". */
  micro: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 2.5, textTransform: 'uppercase' as const },
  /** 10/600 -- the bottom tab bar's label. */
  navLabel: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.5 },
  /** 11/400 -- "SAM 24 OCT · Radès". */
  meta: { fontSize: 11, fontWeight: '400' as const },
  /** 12/400 -- "CAN Féminine · Qualif.". */
  body: { fontSize: 12, fontWeight: '400' as const },
  /** 12/600 -- the "Tout voir" see-all link. */
  link: { fontSize: 12, fontWeight: '600' as const },
  /** 12/700 -- a kick-off time inside a card. */
  time: { fontSize: 12, fontWeight: '700' as const },
  /** Oswald 16/700 -- "TUN". */
  teamCode: { fontFamily: fonts.display, fontSize: 16, fontWeight: '700' as const },
  /** Oswald 18/700 uppercase -- a screen title or the app name in the header. */
  brand: { fontFamily: fonts.display, fontSize: 18, fontWeight: '700' as const, letterSpacing: 0.45, textTransform: 'uppercase' as const },
  /** Oswald 24/700 uppercase -- "SÉNIORS" on a feature card. */
  feature: { fontFamily: fonts.display, fontSize: 24, fontWeight: '700' as const, textTransform: 'uppercase' as const },
  /** Oswald 30/700 -- the hero number on a match card. */
  hero: { fontFamily: fonts.display, fontSize: 30, fontWeight: '700' as const },
} as const;

/**
 * The single strongest repeated motif of the redesign: uppercase, above every
 * section, set in the display face. Screens reuse this so the eyebrow looks
 * identical everywhere.
 *
 * White: that is how the model heads every section (its "CALENDRIER" is white
 * Oswald over a near-black page).
 */
export const sectionTitle = {
  fontFamily: fonts.display,
  color: colors.white,
  fontSize: 18,
  fontWeight: '700' as const,
  letterSpacing: 0.45,
  textTransform: 'uppercase' as const,
  marginBottom: 12,
} as const;

/**
 * The interactive accent. White: it carries the see-all links, the tile
 * icons and the active tab. Red is reserved for primary actions and the
 * staff badge dot.
 */
export const accent = colors.white;

