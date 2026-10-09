import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Player } from '@/types';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function buildRosterHtml(players: Player[]): string {
  const rows = [...players]
    .sort((a, b) => a.category.localeCompare(b.category) || a.number - b.number)
    .map(
      (p) => `<tr>
        <td>${p.number}</td><td>${esc(p.name)}</td><td>${p.position}</td><td>${p.category}</td>
        <td>${esc(p.club)}</td><td>${p.age}</td><td>${p.caps}</td><td>${p.goals}</td><td>${p.status}</td>
      </tr>`,
    )
    .join('');

  return `<html><head><meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; color: #0A1C38; }
      h1 { margin: 0 0 4px; color: #E30613; }
      p { margin: 0 0 16px; color: #555; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { text-align: left; background: #0A1C38; color: #fff; padding: 8px; }
      td { padding: 7px 8px; border-bottom: 1px solid #ddd; }
    </style></head><body>
    <h1>Tunisia WNT: Squad roster</h1>
    <p>Fédération Tunisienne de Football · ${players.length} players</p>
    <table>
      <tr><th>#</th><th>Name</th><th>Pos</th><th>Category</th><th>Club</th><th>Age</th><th>Caps</th><th>Goals</th><th>Status</th></tr>
      ${rows}
    </table></body></html>`;
}

/** Renders the roster to a PDF and opens the native share sheet. Returns false when sharing is unavailable. */
export async function exportRosterPdf(players: Player[]): Promise<boolean> {
  const { uri } = await Print.printToFileAsync({ html: buildRosterHtml(players) });
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Squad roster' });
  return true;
}
