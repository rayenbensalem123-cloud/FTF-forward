import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { profileToUser } from '@/lib/mappers';
import { getJson, KEYS, removeKey, setJson } from '@/lib/storage';
import {
  currentSession, isConfigured, loadSession, select, setSessionLostHandler, signInWithUsername, signOutRemote, type SignInError,
} from '@/lib/supabase';
import type { User } from '@/types';

/** What the interface asks about. Each maps to a flag in the website's profiles.permissions. */
export type Permission = 'editPlayer' | 'editMedical' | 'viewMedical' | 'selectSquad' | 'addPlayer';

/** `selectSquad` (saving lineups) is the website's `addCamps` flag: the Squad Lab table is guarded by it. */
const FLAG: Record<Permission, string> = {
  editPlayer: 'editPlayer',
  editMedical: 'editMedical',
  viewMedical: 'viewMedical',
  selectSquad: 'addCamps',
  addPlayer: 'addPlayer',
};

export type SignInResult = SignInError | 'pending' | 'suspended' | 'no_profile' | 'not_configured' | null;

interface AuthValue {
  /** False until the saved session has been read from the device. */
  ready: boolean;
  user: User | null;
  /** Returns null on success, otherwise why it failed. */
  signIn: (username: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

async function fetchProfile(userId: string): Promise<User | 'pending' | 'suspended' | null> {
  const rows = await select('profiles', `id=eq.${userId}&select=*`);
  const p = rows[0];
  if (!p) return null;
  if (p.status === 'pending') return 'pending';
  if (p.status === 'suspended') return 'suspended';
  return profileToUser(p);
}

/**
 * Real login against the same Supabase project as the website: username and
 * password, the person's own permissions, enforced by the database. The role
 * and flags here only decide which buttons to show; they are not the security.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const clear = useCallback(async () => {
    setUser(null);
    await removeKey(KEYS.user);
  }, []);

  useEffect(() => {
    setSessionLostHandler(() => void clear());
    return () => setSessionLostHandler(null);
  }, [clear]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isConfigured) {
        if (alive) setReady(true);
        return;
      }
      const s = await loadSession();
      if (!s) {
        if (alive) setReady(true);
        return;
      }
      // Show the app at once from the saved profile, then confirm it online.
      const cached = await getJson<User>(KEYS.user);
      if (alive && cached) {
        setUser(cached);
        setReady(true);
      }
      try {
        const fresh = await fetchProfile(s.userId);
        if (!alive) return;
        if (fresh && typeof fresh !== 'string') {
          setUser(fresh);
          void setJson(KEYS.user, fresh);
        } else {
          // Account was suspended or removed since the last visit.
          await signOutRemote();
          await clear();
        }
      } catch {
        // Offline: keep the saved profile.
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [clear]);

  const signIn = useCallback(async (username: string, password: string): Promise<SignInResult> => {
    if (!isConfigured) return 'not_configured';
    const { error } = await signInWithUsername(username, password);
    if (error) return error;
    try {
      const sid = currentSession()?.userId;
      const profile = sid ? await fetchProfile(sid) : null;
      if (profile === 'pending' || profile === 'suspended') {
        await signOutRemote();
        return profile;
      }
      if (!profile) {
        await signOutRemote();
        return 'no_profile';
      }
      setUser(profile);
      await setJson(KEYS.user, profile);
      return null;
    } catch {
      await signOutRemote();
      return 'network';
    }
  }, []);

  const signOut = useCallback(async () => {
    await signOutRemote();
    await removeKey(KEYS.players);
    await removeKey(KEYS.match);
    await clear();
  }, [clear]);

  const can = useCallback(
    (p: Permission) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      return user.permissions[FLAG[p]] === true;
    },
    [user],
  );

  const value = useMemo(() => ({ ready, user, signIn, signOut, can }), [ready, user, signIn, signOut, can]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
