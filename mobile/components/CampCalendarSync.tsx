import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { syncCampCalendar } from '@/lib/campCalendar';

/** Invisible: keeps the signed-in person's camps on their phone calendar, on sign-in and whenever the app comes back. */
export function CampCalendarSync() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    const run = () => { syncCampCalendar({ id: user.username, role: user.role, memberId: user.memberId }).catch(() => {}); };
    run();
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') run(); });
    return () => sub.remove();
  }, [user]);
  return null;
}
