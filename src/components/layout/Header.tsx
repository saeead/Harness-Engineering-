/**
 * Header Component
 * Implements the strict 3-zone Top Bar Contract:
 * [Brand title, single text element] — [4-5 clean text nav links] — [Language switcher & actions]
 */

import React from 'react';
import { useI18n } from '../../i18n/i18n-context';
import { FoundationTab, useUIState } from '../../state/ui.context';
import { Button } from '../primitives/Button';
import { StatusIndicator } from '../primitives/StatusIndicator';

export const Header: React.FC = () => {
  const { t, locale, toggleLocale } = useI18n();
  const { activeTab, setActiveTab } = useUIState();

  const navItems: Array<{ id: FoundationTab; label: string }> = [
    { id: 'home', label: t.navigation.home },
    { id: 'workflow', label: t.navigation.workflow },
    { id: 'repoAnalysis', label: t.navigation.repoAnalysis },
    { id: 'settings', label: t.navigation.settings },
    { id: 'health', label: t.navigation.systemHealth },
    { id: 'architecture', label: t.navigation.architecture },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 shrink-0 cursor-pointer"
        >
          <span className="text-base font-semibold tracking-tight text-neutral-100 select-none">
            {t.common.appName}
          </span>
          <span className="hidden sm:inline-block text-neutral-600 text-xs" aria-hidden="true">
            /
          </span>
          <span className="hidden sm:inline-block text-[11px] text-neutral-400 font-mono">
            {t.common.aiStudioSubhead}
          </span>
        </div>



        {/* Zone 2: Clean text navigation links with active state */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-1 transition-colors whitespace-nowrap cursor-pointer select-none ${
                  isActive
                    ? 'text-neutral-100 border-b-2 border-neutral-100 -mb-[2px] font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary actions & language switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <StatusIndicator status="ready" label={t.common.foundationReady} className="hidden lg:inline-flex" />

          {/* Language Toggle: EN / فارسی */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLocale}
            className="text-xs px-2.5 py-1 min-h-[32px] font-medium"
            title={locale === 'en' ? 'تغییر به زبان فارسی' : 'Switch to English'}
          >
            {locale === 'en' ? 'فارسی (FA)' : 'English (EN)'}
          </Button>
        </div>
      </div>
    </header>
  );
};
