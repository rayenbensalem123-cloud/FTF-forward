import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Player } from '@/types';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function cardCode(player: Player): string {
  return `TN-WNT-${player.id}`;
}

export function buildIdCardHtml(player: Player, username: string): string {
  const photo = player.photoUrl
    ? `<img src="${esc(player.photoUrl)}" style="width:120px;height:120px;border-radius:60px;object-fit:cover;border:3px solid #F6C744;" />`
    : `<div style="width:120px;height:120px;border-radius:60px;background:#0C1F3D;border:3px solid #F6C744;display:flex;align-items:center;justify-content:center;color:#fff;font-size:34px;font-weight:800;">${esc(
        player.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase(),
      )}</div>`;

  return `<html><head><meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 0; margin: 0; background: #0C1F3D; }
      .card { width: 480px; margin: 40px auto; background: linear-gradient(135deg,#0C1F3D,#15284d); border: 2px solid #F6C744; border-radius: 24px; padding: 28px; color: #EDEFF4; }
      .top { text-align: center; color: #F6C744; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 800; }
      .federation { text-align: center; color: #8FA0BD; font-size: 11px; margin-top: 2px; margin-bottom: 18px; }
      .head { display: flex; align-items: center; gap: 18px; }
      .name { font-size: 22px; font-weight: 800; margin: 0; }
      .number { color: #F6C744; font-size: 13px; font-weight: 800; margin: 4px 0 0; }
      .grid { margin-top: 22px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .label { color: #8FA0BD; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; }
      .value { color: #fff; font-size: 14px; font-weight: 700; margin-top: 2px; }
      .footer { margin-top: 22px; text-align: center; color: #8FA0BD; font-size: 9px; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 12px; }
      .code { text-align: center; color: #F6C744; font-size: 11px; font-weight: 800; letter-spacing: 1px; margin-top: 4px; }
    </style></head><body>
    <div class="card">
      <div class="top">Tunisia WNT</div>
      <div class="federation">Fédération Tunisienne de Football · Elite Squad Manager</div>
      <div class="head">
        ${photo}
        <div>
          <p class="name">${esc(player.name)}</p>
          <p class="number">#${player.number || '—'} · ${esc(player.position)}</p>
        </div>
      </div>
      <div class="grid">
        <div><div class="label">Category</div><div class="value">${esc(player.category)}</div></div>
        <div><div class="label">Nationality</div><div class="value">${esc(player.nationality || '—')}</div></div>
        <div><div class="label">Club</div><div class="value">${esc(player.club || '—')}</div></div>
        <div><div class="label">Caps</div><div class="value">${player.caps}</div></div>
      </div>
      <div class="code">${esc(cardCode(player))}</div>
      <div class="footer">Issued to ${esc(username)} · Valid for the current season</div>
    </div>
  </body></html>`;
}

/** Renders the ID card to a PDF and opens the native share sheet. Returns false when sharing is unavailable. */
export async function shareIdCard(player: Player, username: string): Promise<boolean> {
  const { uri } = await Print.printToFileAsync({ html: buildIdCardHtml(player, username) });
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Squad ID card' });
  return true;
}
