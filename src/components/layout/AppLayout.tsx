/**
 * AppLayout Component
 * Master layout container enforcing spatial math, responsive baseline, and notification toasts.
 */

import React from 'react';
import { Header } from './Header';
import { useNotification } from '../../state/notification.context';
import { useUIState } from '../../state/ui.context';
import { useI18n } from '../../i18n/i18n-context';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { notifications, dismiss } = useNotification();
  const { activeTab, setActiveTab } = useUIState();
  const { t } = useI18n();

  const tabLabels: Record<string, string> = {
    home: t.navigation.home,
    workflow: t.navigation.workflow,
    repoAnalysis: t.navigation.repoAnalysis,
    settings: t.navigation.settings,
    health: t.navigation.systemHealth,
    architecture: t.navigation.architecture,
    domain: t.navigation.domainModels,
    providers: t.navigation.providerStatus,
    scope: t.navigation.phase1Scope,
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      <Header />

      {/* Subheader Breadcrumb & Mobile Tab Bar */}
      <div className="border-b border-neutral-900 bg-neutral-950/60 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-neutral-400">
            <span
              onClick={() => setActiveTab('home')}
              className="hover:text-neutral-200 cursor-pointer"
            >
              {t.common.appName}
            </span>
            <span aria-hidden="true">/</span>
            <span className="text-neutral-200 font-medium">{tabLabels[activeTab] || activeTab}</span>
          </div>

          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto py-1">
            {(['home', 'workflow', 'repoAnalysis', 'settings', 'health', 'architecture'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === tab ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-neutral-900 py-6 px-4 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>{t.common.footerCopyright}</span>
          <span className="font-mono text-neutral-500">{t.common.footerHighlights}</span>
        </div>
      </footer>


      {/* Toast Notification Container */}
      <div
        className="fixed bottom-4 end-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
      >
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-xl transition-all ${
              notif.type === 'error'
                ? 'bg-neutral-900 border-rose-800/80 text-rose-200'
                : notif.type === 'warning'
                ? 'bg-neutral-900 border-amber-800/80 text-amber-200'
                : notif.type === 'success'
                ? 'bg-neutral-900 border-emerald-800/80 text-emerald-200'
                : 'bg-neutral-900 border-neutral-800 text-neutral-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold">{notif.title}</p>
                <p className="text-xs opacity-90">{notif.message}</p>
              </div>
              <button
                onClick={() => dismiss(notif.id)}
                className="text-neutral-400 hover:text-white p-1 text-xs cursor-pointer"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
