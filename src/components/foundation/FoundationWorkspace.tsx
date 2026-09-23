/**
 * Foundation Workspace Component
 * Hosts the project definition workflow as well as architectural and system health inspectors.
 */

import React from 'react';
import { useUIState } from '../../state/ui.context';
import { useI18n } from '../../i18n/i18n-context';
import { HomeDashboard } from '../home/HomeDashboard';
import { SettingsView } from '../settings/SettingsView';
import { ArchitectureInspector } from './ArchitectureInspector';
import { DomainModelsExplorer } from './DomainModelsExplorer';
import { ProvidersExplorer } from './ProvidersExplorer';
import { SystemHealthCheck } from './SystemHealthCheck';
import { Phase1ScopeCard } from './Phase1ScopeCard';
import { ProjectWorkflowRoot } from '../workflow/ProjectWorkflowRoot';
import { RepositoryAnalysisRoot } from '../analysis/RepositoryAnalysisRoot';

export const FoundationWorkspace: React.FC = () => {
  const { activeTab } = useUIState();
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {/* Dynamic Screen View */}
      {activeTab === 'home' && <HomeDashboard />}
      {activeTab === 'workflow' && <ProjectWorkflowRoot />}
      {activeTab === 'repoAnalysis' && <RepositoryAnalysisRoot />}
      {activeTab === 'settings' && <SettingsView />}
      {activeTab === 'health' && <SystemHealthCheck />}
      {activeTab === 'architecture' && <ArchitectureInspector />}
      {activeTab === 'domain' && <DomainModelsExplorer />}
      {activeTab === 'providers' && <ProvidersExplorer />}
      {activeTab === 'scope' && <Phase1ScopeCard />}
    </div>
  );
};

