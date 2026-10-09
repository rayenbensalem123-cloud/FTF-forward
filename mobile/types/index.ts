import type { BingoMatch } from '@/lib/bingo-logic';

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';
export type Category = 'Seniors' | 'U-20' | 'U-17';
export type Availability = 'fit' | 'recovery' | 'injured' | 'suspended' | 'unknown';
export type Language = 'en' | 'fr' | 'ar';
export type Role = 'admin' | 'staff' | 'player';
export type FormationId = '4-3-3' | '4-4-2' | '4-2-3-1' | '3-5-2';
export type SyncStatus = 'loading' | 'live' | 'offline';

export interface MedicalLogEntry {
  /** ISO date, YYYY-MM-DD */
  date: string;
  note: string;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: Position;
  category: Category;
  club: string;
  /** Country name as typed on the platform, e.g. "Tunisia". */
  nationality: string;
  /** 0 when the birthdate is missing or unreadable. */
  age: number;
  /** DD/MM/YYYY, as the platform stores it. */
  birthdate: string;
  /** Storage path of the photo in the platform's private bucket. */
  imagePath?: string;
  yellowCards: number;
  redCards: number;
  suspended: boolean;
  /** Optional remote photo. When missing, an initials avatar is drawn. */
  photoUrl?: string;
  caps: number;
  goals: number;
  assists: number;
  /** Height in cm, 0 when not entered. Only used as a clue in Who am I? */
  height?: number;
  /** League region as typed on the platform; stands in for nationality in Who am I? */
  leagueRegion?: string;
  status: Availability;
  /** Id of the open injury (active or recovering), if any. */
  openInjuryId?: number;
  /** Short medical summary shown on the player card. */
  medicalNote: string;
  /** Newest entry first. */
  medicalLog: MedicalLogEntry[];
}

export interface FormResult {
  result: 'W' | 'D' | 'L';
  opponent: string;
  goalsFor: number;
  goalsAgainst: number;
}

export interface AgendaItem {
  time: string;
  title: string;
  place: string;
}

export interface User {
  username: string;
  name: string;
  role: Role;
  /** Permission flags from the platform's profile row. */
  permissions: Record<string, boolean>;
  memberId?: number | null;
}

/** A fixture from the platform's matches table. */
export interface Match {
  id: number;
  opponent: string;
  /** YYYY-MM-DD */
  date: string;
  competition: string;
  category: Category;
  venue: string;
  /** "2-1", Tunisia first, or '' when not played. */
  result: string;
  approved: boolean;
  tunisiaPossession: number | null;
  /** Full recorded details (scorers, cards, subs, minutes, stats) for Match-day Bingo. */
  bingo?: BingoMatch;
}

export interface SquadTemplate {
  id: number;
  name: string;
  formation: FormationId;
  category: Category;
  /** slotKey -> member id */
  slots: Record<string, number | null>;
  createdBy: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body?: string;
  /** Epoch milliseconds */
  time: number;
  read: boolean;
}

export interface FormationSlot {
  /** Same keys the website saves in squad_templates.slots. */
  slotKey: string;
  /** LB, CM, ST ... */
  label: string;
  pos: Position;
  /** 0 (left) to 1 (right) */
  x: number;
  /** 0 (top, attack) to 1 (bottom, own goal) */
  y: number;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  pinned: boolean;
  author: string;
  /** Epoch ms */
  createdAt: number;
}
