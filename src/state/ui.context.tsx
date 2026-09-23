/**
 * UI State Context
 * Manages active foundation view, theme, sidebar state, and layout preferences.
 */

import React, { createContext, useContext, useState, useMemo } from 'react';
import { AppTheme, PreferencesStore } from '../config/user-preferences';

export type FoundationTab =
  | 'home'
  | 'workflow'
  | 'repoAnalysis'
  | 'settings'
  | 'architecture'
  | 'domain'
  | 'health'
  | 'providers'
  | 'scope';

interface UIContextValue {
  activeTab: FoundationTab;
  setActiveTab: (tab: FoundationTab) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<FoundationTab>('home');


  const [theme, setThemeState] = useState<AppTheme>(() => {
    const prefs = PreferencesStore.getPreferences();
    return prefs.theme || 'dark';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    PreferencesStore.savePreferences({ theme: newTheme });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      theme,
      setTheme,
      isSidebarOpen,
      toggleSidebar,
    }),
    [activeTab, theme, isSidebarOpen],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUIState(): UIContextValue {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIState must be used within a UIProvider');
  }
  return context;
}
