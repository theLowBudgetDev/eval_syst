
"use client";

import * as React from 'react';
import type { AppUser, Notification } from '@/types';
import { useToast } from './use-toast';

export function useNotifications(user: AppUser | null) {
  const { toast } = useToast();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchNotifications = React.useCallback(async () => {
    if (!user) return;
    try {
      const headers = new Headers();
      headers.append('X-User-Id', user.id);
      headers.append('X-User-Role', user.role);

      const res = await fetch('/api/notifications', { headers });
      if (!res.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data: Notification[] = await res.json();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (error) {
      // We don't toast here to avoid spamming the user on polling failures
      console.error("useNotifications hook error:", (error as Error).message);
    } finally {
        setIsLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (user) {
      fetchNotifications(); // Initial fetch
      const interval = setInterval(fetchNotifications, 20000); // Poll every 20 seconds
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;

    // Optimistically update the UI
    const previousNotifications = notifications;
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      const headers = new Headers();
      headers.append('X-User-Id', user.id);
      headers.append('X-User-Role', user.role);
      const res = await fetch('/api/notifications/mark-as-read', { method: 'POST', headers });

      if (!res.ok) {
        throw new Error('Failed to mark notifications as read');
      }
    } catch (error) {
      // Revert UI on failure
      setNotifications(previousNotifications);
      setUnreadCount(previousNotifications.filter(n => !n.isRead).length);
      toast({
        title: 'Error',
        description: 'Could not mark notifications as read.',
        variant: 'destructive',
      });
    }
  };

  return { notifications, unreadCount, isLoading, markAllAsRead };
}
