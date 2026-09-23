/**
 * App Providers Composition
 * Composes all isolated sub-state contexts into a single provider hierarchy.
 */

import React from 'react';
import { I18nProvider } from '../i18n/i18n-context';
import { UIProvider } from './ui.context';
import { NotificationProvider } from './notification.context';
import { ProviderStateProvider } from './provider.context';
import { ProjectInputProvider } from './project-input.context';
import { GenerationProvider } from './generation.context';
import { RepositoryStateProvider } from './repository.context';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <UIProvider>
        <NotificationProvider>
          <ProviderStateProvider>
            <ProjectInputProvider>
              <GenerationProvider>
                <RepositoryStateProvider>
                  {children}
                </RepositoryStateProvider>
              </GenerationProvider>
            </ProjectInputProvider>
          </ProviderStateProvider>
        </NotificationProvider>
      </UIProvider>
    </I18nProvider>
  );
}

export * from './project-input.context';
export * from './generation.context';
export * from './provider.context';
export * from './repository.context';
export * from './ui.context';
export * from './notification.context';
