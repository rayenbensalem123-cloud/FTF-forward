import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePlayers } from '@/context/PlayersContext';
import { fetchCamps } from '@/lib/camps';
import { fetchMeetings } from '@/lib/meetings';
import { cancelMatchReminders, ensurePermission, presentNow, syncReminders } from '@/lib/notifications';
import { buildReminderPlan } from '@/lib/remindersLogic';
import { getJson, KEYS, setJson } from '@/lib/storage';
import type { AppNotification } from '@/types';

export interface NotificationSettings {
  matchReminders: boolean;
  availabilityAlerts: boolean;
}

interface NotificationsValue {
  feed: AppNotification[];
  unread: number;
  settings: NotificationSettings;
  /** Adds an entry to the in-app feed. */
  add: (title: string, body?: string) => void;
  /** Adds a feed entry and, if alerts are on, shows a notification on this device. */
  notifyAvailability: (title: string, body: string) => void;
  markAllRead: () => void;
  /** Returns false when the phone's permission was refused. */
  setSetting: (key: keyof NotificationSettings, value: boolean) => Promise<boolean>;
}

interface Saved {
  feed: AppNotification[];
  settings: NotificationSettings;
}

const DEFAULT_SETTINGS: NotificationSettings = { matchReminders: true, availabilityAlerts: true };

const NotificationsContext = createContext<NotificationsValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [feed, setFeed] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const { nextMatch, onChange } = usePlayers();
  const [loaded, setLoaded] = useState(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    let alive = true;
    getJson<Saved>(KEYS.notifications).then((saved) => {
      if (!alive) return;
      if (saved) {
        if (Array.isArray(saved.feed)) setFeed(saved.feed);
        if (saved.settings) setSettings({ ...DEFAULT_SETTINGS, ...saved.settings });
      }
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (loaded) void setJson(KEYS.notifications, { feed, settings } satisfies Saved);
  }, [feed, settings, loaded]);

  // Keep the scheduled reminders in step with the setting and with the fixture on the platform.
  const matchDate = nextMatch?.date;
  const matchOpponent = nextMatch?.opponent;
  // The reminder list also covers meetings and camps; they are read here, and any failure just leaves them out.
  useEffect(() => {
    if (!loaded) return;
    let alive = true;
    if (!settings.matchReminders) {
      void cancelMatchReminders();
      return;
    }
    (async () => {
      const [ok, meetings, camps] = await Promise.all([
        ensurePermission(),
        fetchMeetings().catch(() => []),
        fetchCamps().catch(() => []),
      ]);
      if (!ok || !alive) return;
      const plan = buildReminderPlan({
        match: matchDate && matchOpponent ? { date: matchDate, opponent: matchOpponent } : null,
        meetings: meetings.map((m) => ({ title: m.title, at: m.at })),
        camps: camps.map((c) => ({ name: c.name, start: c.start })),
      });
      if (alive) await syncReminders(plan);
    })();
    return () => {
      alive = false;
    };
  }, [loaded, settings.matchReminders, matchDate, matchOpponent]);

  const add = useCallback((title: string, body?: string) => {
    setFeed((prev) => [{ id: `n${Date.now()}`, title, body, time: Date.now(), read: false }, ...prev].slice(0, 50));
  }, []);

  const notifyAvailability = useCallback(
    (title: string, body: string) => {
      add(title, body);
      if (settingsRef.current.availabilityAlerts) void presentNow(title, body);
    },
    [add],
  );

  // Changes made by colleagues on the platform (or another phone) show up here.
  useEffect(
    () => onChange((e) => notifyAvailability(e.title, e.body)),
    [onChange, notifyAvailability],
  );

  const markAllRead = useCallback(() => setFeed((prev) => prev.map((n) => ({ ...n, read: true }))), []);

  const setSetting = useCallback(async (key: keyof NotificationSettings, value: boolean) => {
    if (value) {
      const ok = await ensurePermission();
      if (!ok) return false;
    }
    setSettings((prev) => ({ ...prev, [key]: value }));
    return true;
  }, []);

  const unread = useMemo(() => feed.filter((n) => !n.read).length, [feed]);
  const value = useMemo(
    () => ({ feed, unread, settings, add, notifyAvailability, markAllRead, setSetting }),
    [feed, unread, settings, add, notifyAvailability, markAllRead, setSetting],
  );
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider');
  return ctx;
}
