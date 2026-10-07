/**
 * Dark theme taken from the website (app/globals.css, the FTF palette):
 * --c-bg, --c-panel3, --c-panel, --line-rgb, --c-text, --c-textFaint, --acc-gold.
 * Keep these in step with the platform so both look like one product.
 */
export const colors = {
  red: '#E30613',
  navy: '#0C1F3D', // --c-bg: page background
  navyDeep: '#0B111E', // --c-deep
  card: '#101B33', // --c-panel3: cards
  cardRaised: '#112950', // --c-panel: raised panels
  gold: '#F6C744', // --acc-gold
  goldBorder: 'rgba(148, 170, 210, 0.18)', // platform card border: rgba(var(--line-rgb), .18)
  white: '#EDEFF4', // --c-text
  muted: '#8FA0BD', // --c-textFaint
  green: '#22C55E',
  amber: '#F59E0B',
  redSoft: 'rgba(227, 6, 19, 0.18)',
  greenSoft: 'rgba(34, 197, 94, 0.16)',
  amberSoft: 'rgba(245, 158, 11, 0.16)',
  goldSoft: 'rgba(246, 199, 68, 0.14)',
  line: 'rgba(148, 170, 210, 0.14)',
  scrim: 'rgba(3, 8, 20, 0.7)',
} as const;

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

export const FTF_LOGO_URL = 'https://tunisia-wnt.vercel.app/ftf-logo.png';
