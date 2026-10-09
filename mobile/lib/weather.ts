import { getJson, setJson } from '@/lib/storage';
import { BASE, distanceKm, FORECAST_DAYS, daysUntil, flightMinutes, placeCandidates, timeDifferenceHours, type WeatherKind, weatherKind } from '@/lib/travel';

/**
 * Weather and travel facts for the match city, from Open-Meteo (free, no API key).
 * The platform stores a venue name, not coordinates, so the city is looked up by name.
 * Everything here is best effort: a failure just hides the card.
 */
export interface Place {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export interface Forecast {
  kind: WeatherKind;
  maxC: number;
  minC: number;
  rainChance: number | null;
  windKmh: number | null;
}

export interface MatchInfo {
  place: Place;
  distanceKm: number;
  flightMinutes: number;
  /** Hours ahead of Tunis; 0 for the same time. */
  timeDiffHours: number;
  /** null when the match is further away than the forecast reaches. */
  forecast: Forecast | null;
}

const TIMEOUT_MS = 10000;
const TTL_MS = 3 * 3600 * 1000;

async function getJsonUrl(url: string): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function geocode(venue: string): Promise<Place | null> {
  for (const name of placeCandidates(venue)) {
    const data = await getJsonUrl(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`,
    );
    const r = data?.results?.[0];
    if (r) return { name: r.name, country: r.country ?? '', lat: r.latitude, lon: r.longitude };
  }
  return null;
}

export async function loadMatchInfo(venue: string, date: string, today: string): Promise<MatchInfo | null> {
  const key = `wnt.weather.v1:${venue}|${date}`;
  const cached = await getJson<{ at: number; info: MatchInfo }>(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.info;

  const place = await geocode(venue);
  if (!place) return null;

  let forecast: Forecast | null = null;
  let offsetSeconds = BASE.utcOffsetHours * 3600;
  const ahead = daysUntil(date, today);
  const inRange = ahead >= 0 && ahead <= FORECAST_DAYS - 1;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max` +
    `&timezone=auto` + (inRange ? `&start_date=${date}&end_date=${date}` : `&forecast_days=1`);
  const data = await getJsonUrl(url);
  if (typeof data?.utc_offset_seconds === 'number') offsetSeconds = data.utc_offset_seconds;
  const d = data?.daily;
  if (inRange && d?.time?.[0] === date) {
    forecast = {
      kind: weatherKind(d.weather_code[0]),
      maxC: Math.round(d.temperature_2m_max[0]),
      minC: Math.round(d.temperature_2m_min[0]),
      rainChance: d.precipitation_probability_max?.[0] ?? null,
      windKmh: d.wind_speed_10m_max?.[0] != null ? Math.round(d.wind_speed_10m_max[0]) : null,
    };
  }

  const km = Math.round(distanceKm(BASE.lat, BASE.lon, place.lat, place.lon));
  const info: MatchInfo = {
    place,
    distanceKm: km,
    flightMinutes: flightMinutes(km),
    timeDiffHours: timeDifferenceHours(offsetSeconds),
    forecast,
  };
  await setJson(key, { at: Date.now(), info });
  return info;
}
