import { useState, useEffect, useCallback } from 'react';

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export function useNotifications() {
  const [permission, setPermission] = useState<PermissionState>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission as PermissionState;
  });

  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' as PermissionName }).then(status => {
        status.onchange = () => setPermission(status.state as PermissionState);
      }).catch(() => {});
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) { setPermission('unsupported'); return false; }
    if (Notification.permission === 'granted') { setPermission('granted'); return true; }
    const result = await Notification.requestPermission();
    setPermission(result as PermissionState);
    return result === 'granted';
  }, []);

  const scheduleRatingReminder = useCallback((activityTitle: string, delayMs: number) => {
    if (permission !== 'granted') return;
    setTimeout(() => {
      try {
        new Notification('⭐ How was it?', {
          body: `Rate your experience at "${activityTitle}" to get better recommendations!`,
          icon: '/favicon.ico',
          tag: `rate-${activityTitle}`,
          requireInteraction: true,
        });
      } catch {
        // SW notification fallback not available in this context
      }
    }, delayMs);
  }, [permission]);

  return { permission, requestPermission, scheduleRatingReminder };
}
