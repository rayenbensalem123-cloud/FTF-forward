/**
 * Dark theme taken from the website (app/globals.css, the FTF palette):
 * --c-bg, --c-panel3, --c-panel, --line-rgb, --c-text, --c-textFaint, --acc-gold.
 * Keep these in step with the platform so both look like one product.
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
  gold: '#F6C744', // --acc-gold: primary accent (titles, CTAs, active state)
  goldBorder: 'rgba(148, 170, 210, 0.18)', // platform card border: rgba(var(--line-rgb), .18)
  white: '#EDEFF4', // --c-text (never pure white)
  muted: '#8FA0BD', // --c-textFaint
  green: '#22C55E',
  amber: '#F59E0B',
  redSoft: 'rgba(227, 6, 19, 0.18)',
  greenSoft: 'rgba(34, 197, 94, 0.16)',
  amberSoft: 'rgba(245, 158, 11, 0.16)',
  goldSoft: 'rgba(246, 199, 68, 0.14)',
  line: 'rgba(148, 170, 210, 0.14)',
  // The prototype draws every divider at .18 -- same value as goldBorder.
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
 * The single strongest repeated motif of the redesign: gold, uppercase,
 * 13px/800 with 0.12em tracking, above every section. Screens reuse this so
 * the eyebrow looks identical everywhere.
 */
export const sectionTitle = {
  color: colors.gold,
  fontSize: 13,
  fontWeight: '800' as const,
  letterSpacing: 1.5,
  textTransform: 'uppercase' as const,
  marginBottom: 12,
} as const;

