import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import {
  averagePossession, CAT_TO_DB, matchFromDb, memberToPlayer, nextMatch as pickNext, POS_TO_DB, recentForm,
  templateFromDb, upcomingMatches, type InjuryRow,
} from '@/lib/mappers';
import { getJson, KEYS, setJson } from '@/lib/storage';
import { insert, isConfigured, remove, select, signedPhotoUrls, update } from '@/lib/supabase';
import type { Availability, Category, FormResult, FormationId, Match, Player, Position, SquadTemplate, SyncStatus } from '@/types';

/** Poll interval while the app is open. The website pushes over websockets; the app polls. */
const POLL_MS = 30_000;

const MEMBER_COLS = [
  'id', 'role', 'name', 'position', 'team_category', 'club', 'birthdate', 'goals', 'assists', 'yellow_cards',
  'red_cards', 'suspended', 'nat_matches', 'image_url', 'image_path', 'jersey_number', 'updated_at',
].join(',');
// passport_image is deliberately never requested: an identity document has no place on a phone.

export interface PlayerFields {
  name: string;
  number: number;
  position: Position;
  category: Category;
  club: string;
  /** DD/MM/YYYY or '' */
  birthdate: string;
}

export interface ChangeEvent {
  title: string;
  body: string;
}

interface PlayersValue {
  players: Player[];
  matches: Match[];
  templates: SquadTemplate[];
  nextMatch: Match | null;
  /** The fixtures after the next one. */
  upcoming: Match[];
  form: FormResult[];
  avgPossession: number | null;
  status: SyncStatus;
  /** Epoch ms of the last successful sync, or null. */
  lastSynced: number | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
  getPlayer: (id: string) => Player | undefined;
  /** Every write below goes straight to the shared database and throws if it is refused or offline. */
  addPlayer: (f: PlayerFields) => Promise<void>;
  updatePlayer: (id: string, f: Partial<PlayerFields>) => Promise<void>;
  setMedical: (id: string, status: 'fit' | 'recovery' | 'injured', note: string) => Promise<void>;
  saveTemplate: (t: { name: string; formation: FormationId; category: Category; slots: Record<string, number | null> }) => Promise<void>;
  deleteTemplate: (id: number) => Promise<void>;
  /** Called when a sync finds something somebody else changed. Returns an unsubscribe function. */
  onChange: (cb: (e: ChangeEvent) => void) => () => void;
}

interface Cache {
  players: Player[];
  matches: Match[];
  templates: SquadTemplate[];
  lastSynced: number | null;
  owner: string;
}

const PlayersContext = createContext<PlayersValue | null>(null);
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const STATUS_WORD: Record<Availability, string> = {
  fit: 'Match fit', recovery: 'In recovery', injured: 'Injured', suspended: 'Suspended', unknown: 'Unknown',
};

export function PlayersProvider({ children }: { children: React.ReactNode }) {
  const { user, can } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [templates, setTemplates] = useState<SquadTemplate[]>([]);
  const [status, setStatus] = useState<SyncStatus>('loading');
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const playersRef = useRef(players);
  playersRef.current = players;
  const listeners = useRef(new Set<(e: ChangeEvent) => void>());
  const busy = useRef(false);
  const canViewMedical = can('viewMedical');
  const canViewRef = useRef(canViewMedical);
  canViewRef.current = canViewMedical;
  const userRef = useRef(user);
  userRef.current = user;

  const emit = useCallback((e: ChangeEvent) => listeners.current.forEach((cb) => cb(e)), []);
  const onChange = useCallback((cb: (e: ChangeEvent) => void) => {
    listeners.current.add(cb);
    return () => {
      listeners.current.delete(cb);
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!isConfigured || !userRef.current || busy.current) return;
    busy.current = true;
    setRefreshing(true);
    try {
      const [members, injuries, matchRows, templateRows] = await Promise.all([
        select('members', `select=${MEMBER_COLS}&role=eq.PLAYERS&order=jersey_number.asc.nullslast,name.asc`),
        canViewRef.current
          ? select<InjuryRow>('injuries', 'select=id,member_id,status,injury_type,body_part,severity,occurred_on,expected_return,notes,created_at&order=occurred_on.desc.nullslast').catch(() => [] as InjuryRow[])
          : Promise.resolve([] as InjuryRow[]),
        select('matches', 'select=*&order=match_date.asc'),
        select('squad_templates', 'select=*&order=updated_at.desc').catch(() => [] as any[]),
      ]);

      const next = members
        .map((r: any) => memberToPlayer(r, injuries, canViewRef.current))
        .filter((p): p is Player => p !== null);

      const urls = await signedPhotoUrls(next.map((p) => p.imagePath ?? ''));
      for (const p of next) if (p.imagePath && urls[p.imagePath]) p.photoUrl = urls[p.imagePath];

      // Tell the user what other people changed since the last sync.
      const prev = playersRef.current;
      if (prev.length > 0) {
        const before = new Map<string, Player>(prev.map((p): [string, Player] => [p.id, p]));
        for (const p of next) {
          const old = before.get(p.id);
          if (!old) emit({ title: `${p.name} added to the squad`, body: `${p.category} · ${p.position}` });
          else if (old.status !== p.status && p.status !== 'unknown' && old.status !== 'unknown') {
            emit({ title: `${p.name}: ${STATUS_WORD[p.status]}`, body: `Was ${STATUS_WORD[old.status].toLowerCase()}. Updated on the platform.` });
          }
        }
      }

      const nextMatches = matchRows.map(matchFromDb);
      const nextTemplates = templateRows.map(templateFromDb);
      const at = Date.now();
      setPlayers(next);
      setMatches(nextMatches);
      setTemplates(nextTemplates);
      setLastSynced(at);
      setStatus('live');
      if (userRef.current) {
        void setJson(KEYS.players, {
          players: next, matches: nextMatches, templates: nextTemplates, lastSynced: at, owner: userRef.current.username,
        } satisfies Cache);
      }
    } catch {
      setStatus('offline');
    } finally {
      busy.current = false;
      setRefreshing(false);
    }
  }, [emit]);

  // Saved copy first so the app opens instantly and works offline, then sync.
  // A copy that belongs to someone else is never shown (a different login sees different rows).
  useEffect(() => {
    if (!user) {
      setPlayers([]);
      setMatches([]);
      setTemplates([]);
      setStatus('loading');
      setLastSynced(null);
      return;
    }
    let alive = true;
    (async () => {
      const cached = await getJson<Cache>(KEYS.players);
      if (alive && cached && cached.owner === user.username && Array.isArray(cached.players)) {
        setPlayers(cached.players);
        setMatches(cached.matches ?? []);
        setTemplates(cached.templates ?? []);
        setLastSynced(cached.lastSynced ?? null);
        setStatus('offline');
      }
      if (alive) await refresh();
    })();
    return () => {
      alive = false;
    };
  }, [user, refresh]);

  // Near-live: poll while the app is in the foreground, and sync the moment it returns to it.
  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      if (AppState.currentState === 'active') void refresh();
    }, POLL_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void refresh();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [user, refresh]);

  const afterWrite = useCallback(async () => {
    // Read back through the same path as everyone else, so the screen shows what the database holds.
    busy.current = false;
    await refresh();
  }, [refresh]);

  const addPlayer = useCallback(
    async (f: PlayerFields) => {
      await insert('members', {
        role: 'PLAYERS',
        name: f.name,
        position: POS_TO_DB[f.position],
        team_category: CAT_TO_DB[f.category],
        club: f.club,
        foot: 'R',
        nationality: 'Tunisia',
        languages: [],
        birthdate: f.birthdate,
        jersey_number: f.number,
        goals: '0',
        assists: '0',
        nat_matches: '0',
        history: [],
        camps: [],
        updated_at: new Date().toISOString(),
      });
      await afterWrite();
    },
    [afterWrite],
  );

  const updatePlayer = useCallback(
    async (id: string, f: Partial<PlayerFields>) => {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (f.name !== undefined) patch.name = f.name;
      if (f.number !== undefined) patch.jersey_number = f.number;
      if (f.position !== undefined) patch.position = POS_TO_DB[f.position];
      if (f.category !== undefined) patch.team_category = CAT_TO_DB[f.category];
      if (f.club !== undefined) patch.club = f.club;
      if (f.birthdate !== undefined) patch.birthdate = f.birthdate;
      await update('members', `id=eq.${id}`, patch);
      await afterWrite();
    },
    [afterWrite],
  );

  /**
   * The website records availability as injuries (active / recovering / recovered),
   * so the app does the same: nothing is stored on the member row itself.
   */
  const setMedical = useCallback(
    async (id: string, target: 'fit' | 'recovery' | 'injured', note: string) => {
      const p = playersRef.current.find((x) => x.id === id);
      if (!p) return;
      const text = note.trim();
      const now = new Date().toISOString();
      if (target === 'fit') {
        if (!p.openInjuryId) return; // nothing open to close
        await update('injuries', `member_id=eq.${id}&status=in.(active,recovering)`, { status: 'recovered', updated_at: now });
      } else {
        const wanted = target === 'injured' ? 'active' : 'recovering';
        if (p.openInjuryId) {
          const patch: Record<string, unknown> = { status: wanted, updated_at: now };
          if (text !== p.medicalNote) patch.notes = text || null;
          await update('injuries', `id=eq.${p.openInjuryId}`, patch);
        } else {
          const u = userRef.current;
          await insert('injuries', {
            member_id: Number(id),
            status: wanted,
            injury_type: text || 'Injury',
            occurred_on: todayIso(),
            logged_by_username: u?.username ?? null,
          });
        }
      }
      await afterWrite();
    },
    [afterWrite],
  );

  const saveTemplate = useCallback(
    async (t: { name: string; formation: FormationId; category: Category; slots: Record<string, number | null> }) => {
      await insert('squad_templates', {
        team_category: CAT_TO_DB[t.category],
        name: t.name,
        formation: t.formation,
        slots: t.slots,
        created_by_username: userRef.current?.username ?? null,
      });
      await afterWrite();
    },
    [afterWrite],
  );

  const deleteTemplate = useCallback(
    async (id: number) => {
      await remove('squad_templates', `id=eq.${id}`);
      await afterWrite();
    },
    [afterWrite],
  );

  const getPlayer = useCallback((id: string) => playersRef.current.find((p) => p.id === id), []);

  const today = todayIso();
  const nextMatch = useMemo(() => pickNext(matches, today), [matches, today]);
  const upcoming = useMemo(() => upcomingMatches(matches, today).filter((m) => m.id !== nextMatch?.id).slice(0, 3), [matches, today, nextMatch]);
  const form = useMemo(() => recentForm(matches), [matches]);
  const avgPossession = useMemo(() => averagePossession(matches), [matches]);

  const value = useMemo(
    () => ({
      players, matches, templates, nextMatch, upcoming, form, avgPossession, status, lastSynced, refreshing, refresh,
      getPlayer, addPlayer, updatePlayer, setMedical, saveTemplate, deleteTemplate, onChange,
    }),
    [players, matches, templates, nextMatch, upcoming, form, avgPossession, status, lastSynced, refreshing, refresh,
      getPlayer, addPlayer, updatePlayer, setMedical, saveTemplate, deleteTemplate, onChange],
  );
  return <PlayersContext.Provider value={value}>{children}</PlayersContext.Provider>;
}

export function usePlayers(): PlayersValue {
  const ctx = useContext(PlayersContext);
  if (!ctx) throw new Error('usePlayers must be used inside PlayersProvider');
  return ctx;
}
