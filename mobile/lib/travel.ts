/**
 * Pure helpers for the weather and travel card. No network and no React Native,
 * so they can be tested with plain node. The fetching lives in lib/weather.ts.
 */

/** Tunis, where the team is based. */
export const BASE = { lat: 36.8065, lon: 10.1815, utcOffsetHours: 1 };

export type WeatherKind = 'clear' | 'partly' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'storm';

/** WMO weather interpretation codes, as returned by Open-Meteo. */
export function weatherKind(code: number): WeatherKind {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2) return 'partly';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 80 && code <= 82) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloudy';
}

/** Great-circle distance in kilometres. */
export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLon = rad(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** A rough flight time (cruise 800 km/h plus 45 min of climb and descent), rounded to 15 minutes. Not a schedule. */
export function flightMinutes(km: number): number {
  if (km < 80) return 0;
  const raw = (km / 800) * 60 + 45;
  return Math.round(raw / 15) * 15;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${m}`;
}

/** Hours ahead of (+) or behind (-) Tunis. */
export function timeDifferenceHours(utcOffsetSeconds: number): number {
  return Math.round((utcOffsetSeconds / 3600 - BASE.utcOffsetHours) * 2) / 2;
}

/** Place names to geocode for a venue like "Stade Hammadi Agrebi, Radès": city part first, then the rest. */
export function placeCandidates(venue: string): string[] {
  const parts = venue.split(',').map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  for (const p of [parts[parts.length - 1], ...parts.slice(0, -1).reverse(), venue.trim()]) {
    if (p && !out.includes(p)) out.push(p);
  }
  return out;
}

/** Whole days from `today` to `date`, both YYYY-MM-DD. */
export function daysUntil(date: string, today: string): number {
  const a = Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10));
  const b = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10));
  return Math.round((a - b) / 86400000);
}

/** Open-Meteo only forecasts about 16 days ahead. */
export const FORECAST_DAYS = 16;
