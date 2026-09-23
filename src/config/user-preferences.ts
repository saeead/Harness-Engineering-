/**
 * User Preferences Configuration
 * Manages user settings, locale preference, and UI flags.
 */

import { HarnessLevel } from '../domain/models';

export type AppTheme = 'dark' | 'light' | 'system';
export type AppLocale = 'en' | 'fa';

export interface UserPreferences {
  locale: AppLocale;
  theme: AppTheme;
  defaultHarnessLevel: HarnessLevel;
  confirmDestructiveActions: boolean;
  autoSaveDrafts: boolean;
  compactView: boolean;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  locale: 'en',
  theme: 'dark',
  defaultHarnessLevel: 'medium',
  confirmDestructiveActions: true,
  autoSaveDrafts: true,
  compactView: false,
};

const PREFS_STORAGE_KEY = 'harness_gen:user_preferences';

export class PreferencesStore {
  static getPreferences(): UserPreferences {
    if (typeof window === 'undefined' || !window.localStorage) {
      return DEFAULT_USER_PREFERENCES;
    }
    try {
      const stored = window.localStorage.getItem(PREFS_STORAGE_KEY);
      return stored ? { ...DEFAULT_USER_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_USER_PREFERENCES;
    } catch {
      return DEFAULT_USER_PREFERENCES;
    }
  }

  static savePreferences(prefs: Partial<UserPreferences>): UserPreferences {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ...DEFAULT_USER_PREFERENCES, ...prefs };
    }
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...prefs };
      window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return { ...DEFAULT_USER_PREFERENCES, ...prefs };
    }
  }

  static resetPreferences(): UserPreferences {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(PREFS_STORAGE_KEY);
    }
    return DEFAULT_USER_PREFERENCES;
  }
}
