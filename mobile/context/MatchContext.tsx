import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { FORMATIONS, MAX_CALL_UPS } from '@/data/formations';
import { usePlayers } from '@/context/PlayersContext';
import { getJson, KEYS, setJson } from '@/lib/storage';
import type { FormationId, FormationSlot, Player, Position, SquadTemplate } from '@/types';

type Lineup = (string | null)[];

interface MatchValue {
  formation: FormationId;
  slots: FormationSlot[];
  /** Ids of the players called up for the match (max 23). */
  callUps: string[];
  /** One entry per formation slot: a player id or null. */
  lineup: Lineup;
  /** Same as `lineup` but resolved to players (null when empty or the player no longer exists). */
  lineupPlayers: (Player | null)[];
  setFormation: (id: FormationId) => void;
  assign: (slot: number, playerId: string) => void;
  clearSlot: (slot: number) => void;
  clearLineup: () => void;
  /** Returns false when the 23-player limit blocks adding another call-up. */
  toggleCallUp: (playerId: string) => boolean;
  autoPick: () => void;
  /** The lineup in the website's format: slot key -> member id. */
  toSlots: () => Record<string, number | null>;
  /** Puts a lineup saved on the platform (or by a colleague) onto the pitch. */
  loadTemplate: (t: SquadTemplate) => void;
}

interface Saved {
  formation: FormationId;
  callUps: string[] | null;
  lineup: Lineup;
}

const MatchContext = createContext<MatchValue | null>(null);
const empty = (n: number): Lineup => Array.from({ length: n }, () => null);
/** Fit players first, then the most capped. The platform has no daily readiness score to rank by. */
const rank = (a: Player, b: Player) => (a.status === 'fit' ? 0 : 1) - (b.status === 'fit' ? 0 : 1) || b.caps - a.caps;

export function MatchProvider({ children }: { children: React.ReactNode }) {
  const { players } = usePlayers();
  const [formation, setFormationState] = useState<FormationId>('4-3-3');
  const [savedCallUps, setSavedCallUps] = useState<string[] | null>(null);
  const [lineup, setLineup] = useState<Lineup>(() => empty(11));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    getJson<Saved>(KEYS.match).then((saved) => {
      if (!alive) return;
      if (saved && FORMATIONS[saved.formation]) {
        setFormationState(saved.formation);
        setSavedCallUps(saved.callUps);
        if (Array.isArray(saved.lineup) && saved.lineup.length === FORMATIONS[saved.formation].length) setLineup(saved.lineup);
      }
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (loaded) void setJson(KEYS.match, { formation, callUps: savedCallUps, lineup } satisfies Saved);
  }, [formation, savedCallUps, lineup, loaded]);

  // Until the staff change it, the call-up list is every senior player.
  const callUps = useMemo(() => {
    const base = savedCallUps ?? players.filter((p) => p.category === 'Seniors').map((p) => p.id);
    return base.filter((id) => players.some((p) => p.id === id));
  }, [savedCallUps, players]);

  const slots = FORMATIONS[formation];

  const lineupPlayers = useMemo(
    () => lineup.map((id) => (id ? players.find((p) => p.id === id) ?? null : null)),
    [lineup, players],
  );

  const setFormation = useCallback(
    (id: FormationId) => {
      if (id === formation) return;
      // Keep players in their line when the shape changes.
      const byPos: Record<Position, string[]> = { GK: [], DEF: [], MID: [], FWD: [] };
      lineup.forEach((pid, i) => {
        if (pid) byPos[FORMATIONS[formation][i].pos].push(pid);
      });
      setLineup(FORMATIONS[id].map((s) => byPos[s.pos].shift() ?? null));
      setFormationState(id);
    },
    [formation, lineup],
  );

  const assign = useCallback((slot: number, playerId: string) => {
    setLineup((prev) => prev.map((x, i) => (i === slot ? playerId : x === playerId ? null : x)));
  }, []);

  const clearSlot = useCallback((slot: number) => {
    setLineup((prev) => prev.map((x, i) => (i === slot ? null : x)));
  }, []);

  const clearLineup = useCallback(() => setLineup(empty(slots.length)), [slots.length]);

  const toggleCallUp = useCallback(
    (playerId: string) => {
      if (callUps.includes(playerId)) {
        setSavedCallUps(callUps.filter((x) => x !== playerId));
        setLineup((prev) => prev.map((x) => (x === playerId ? null : x)));
        return true;
      }
      if (callUps.length >= MAX_CALL_UPS) return false;
      setSavedCallUps([...callUps, playerId]);
      return true;
    },
    [callUps],
  );

  /** Fills each slot with the most ready fit player of the right position, then fills gaps with the best remaining outfield players. */
  const autoPick = useCallback(() => {
    const pool = players
      .filter((p) => callUps.includes(p.id) && p.status === 'fit')
      .sort(rank);
    const used = new Set<string>();
    const next = empty(slots.length);

    slots.forEach((s, i) => {
      const pick = pool.find((p) => !used.has(p.id) && p.position === s.pos);
      if (pick) {
        next[i] = pick.id;
        used.add(pick.id);
      }
    });
    slots.forEach((s, i) => {
      if (next[i] || s.pos === 'GK') return;
      const pick = pool.find((p) => !used.has(p.id) && p.position !== 'GK');
      if (pick) {
        next[i] = pick.id;
        used.add(pick.id);
      }
    });
    setLineup(next);
  }, [players, callUps, slots]);

  const toSlots = useCallback(() => {
    const out: Record<string, number | null> = {};
    slots.forEach((s, i) => {
      const id = lineup[i];
      out[s.slotKey] = id ? Number(id) : null;
    });
    return out;
  }, [slots, lineup]);

  const loadTemplate = useCallback(
    (t: SquadTemplate) => {
      const known = new Set(players.map((p) => p.id));
      const next = FORMATIONS[t.formation].map((s) => {
        const id = t.slots[s.slotKey];
        return id != null && known.has(String(id)) ? String(id) : null;
      });
      setFormationState(t.formation);
      setLineup(next);
      // Anyone placed on the pitch is by definition called up.
      setSavedCallUps((prev) => {
        const base = prev ?? players.filter((p) => p.category === 'Seniors').map((p) => p.id);
        const add = next.filter((x): x is string => !!x && !base.includes(x));
        return [...base, ...add].slice(0, MAX_CALL_UPS);
      });
    },
    [players],
  );

  const value = useMemo(
    () => ({ formation, slots, callUps, lineup, lineupPlayers, setFormation, assign, clearSlot, clearLineup, toggleCallUp, autoPick, toSlots, loadTemplate }),
    [formation, slots, callUps, lineup, lineupPlayers, setFormation, assign, clearSlot, clearLineup, toggleCallUp, autoPick, toSlots, loadTemplate],
  );
  return <MatchContext.Provider value={value}>{children}</MatchContext.Provider>;
}

export function useMatch(): MatchValue {
  const ctx = useContext(MatchContext);
  if (!ctx) throw new Error('useMatch must be used inside MatchProvider');
  return ctx;
}
