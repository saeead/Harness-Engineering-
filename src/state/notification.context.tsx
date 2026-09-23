/**
 * Notification State Context
 * Non-spamming notification system for user-facing feedback.
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  autoClose?: boolean;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  notify: (type: NotificationType, title: string, message: string, autoClose?: boolean) => void;
  notifySuccess: (title: string, message: string) => void;
  notifyWarning: (title: string, message: string) => void;
  notifyError: (title: string, message: string) => void;
  notifyInfo: (title: string, message: string) => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(
    (type: NotificationType, title: string, message: string, autoClose = true) => {
      const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const newNotif: AppNotification = {
        id,
        type,
        title,
        message,
        timestamp: new Date().toISOString(),
        autoClose,
      };

      setNotifications((prev) => [newNotif, ...prev.slice(0, 4)]); // Keep max 5

      if (autoClose) {
        setTimeout(() => {
          dismiss(id);
        }, 5000);
      }
    },
    [dismiss],
  );

  const notifySuccess = useCallback(
    (title: string, message: string) => notify('success', title, message, true),
    [notify],
  );

  const notifyWarning = useCallback(
    (title: string, message: string) => notify('warning', title, message, true),
    [notify],
  );

  const notifyError = useCallback(
    (title: string, message: string) => notify('error', title, message, false),
    [notify],
  );

  const notifyInfo = useCallback(
    (title: string, message: string) => notify('info', title, message, true),
    [notify],
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      notify,
      notifySuccess,
      notifyWarning,
      notifyError,
      notifyInfo,
      dismiss,
      clearAll,
    }),
    [notifications, notify, notifySuccess, notifyWarning, notifyError, notifyInfo, dismiss, clearAll],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
