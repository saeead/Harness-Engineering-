/**
 * Architecture Inspector Component
 * Visualizes the 5-layer Clean Architecture contract and layer boundary isolation.
 */

import React, { useState } from 'react';
import { useI18n } from '../../i18n/i18n-context';
import { Card } from '../primitives/Card';
import { StatusIndicator } from '../primitives/StatusIndicator';

interface LayerInfo {
  id: string;
  nameKey: string;
  descKey: string;
  path: string;
  inwardDependencies: string[];
  outwardDependencies: string[];
  guarantees: string[];
}

export const ArchitectureInspector: React.FC = () => {
  const { t } = useI18n();
  const [selectedLayerId, setSelectedLayerId] = useState<string>('domain');

  const layers: LayerInfo[] = [
    {
      id: 'presentation',
      nameKey: t.layers.presentation,
      descKey: t.layers.presentationDesc,
      path: 'src/components/*',
      inwardDependencies: ['None (Top level)'],
      outwardDependencies: ['Application Layer', 'Domain Layer', 'UI Primitives'],
      guarantees: [
        'Zero direct coupling to remote AI or GitHub endpoints',
        'Strict WCAG AA contrast & keyboard accessibility',
        'Bidirectional RTL/LTR support without layout regressions',
      ],
    },
    {
      id: 'application',
      nameKey: t.layers.application,
      descKey: t.layers.applicationDesc,
      path: 'src/state/*, src/services/*',
      inwardDependencies: ['Presentation Layer'],
      outwardDependencies: ['Domain Layer', 'Infrastructure Interfaces'],
      guarantees: [
        'Orchestrates state and workflow execution',
        'Coordinates validation pipelines before submission',
        'Handles error normalization into AppError models',
      ],
    },
    {
      id: 'domain',
      nameKey: t.layers.domain,
      descKey: t.layers.domainDesc,
      path: 'src/domain/models/*',
      inwardDependencies: ['Presentation', 'Application', 'Infrastructure', 'Providers'],
      outwardDependencies: ['Zero external dependencies (Pure TypeScript)'],
      guarantees: [
        'Pure business rules: ProjectSpecification, HarnessPlan, Artifacts',
        'Independent of UI frameworks, databases, and third-party SDKs',
        'Deterministic serialization & schema compliance',
      ],
    },
    {
      id: 'infrastructure',
      nameKey: t.layers.infrastructure,
      descKey: t.layers.infrastructureDesc,
      path: 'src/config/*, src/core/*',
      inwardDependencies: ['Application Layer'],
      outwardDependencies: ['Browser APIs (LocalStorage, SessionStorage)'],
      guarantees: [
        'Local-first privacy: no remote telemetry or unprompted sync',
        'In-memory credential caching; keys never persisted in Git or unencrypted state',
        'Strict error categorization and recoverable boundary wrappers',
      ],
    },
    {
      id: 'providers',
      nameKey: t.layers.providers,
      descKey: t.layers.providersDesc,
      path: 'src/services/providers/*',
      inwardDependencies: ['Application Layer via Registry Interfaces'],
      outwardDependencies: ['AIProvider, RepositoryProvider, StorageProvider, Exporter'],
      guarantees: [
        'Provider Inversion: Core app never depends on vendor-specific code',
        'Offline fallback to deterministic local engine',
        'Isolated secrets management during export operations',
      ],
    },
  ];

  const activeLayer = layers.find((l) => l.id === selectedLayerId) || layers[2];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
          {t.foundation.inspectArchitecture}
        </h2>
        <p className="text-sm text-neutral-400">
          Strict separation of concerns across 5 architectural layers. No circular dependencies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Layer Stack Navigation */}
        <div className="lg:col-span-5 space-y-2">
          {layers.map((layer, index) => {
            const isSelected = layer.id === selectedLayerId;
            return (
              <button
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                className={`w-full text-start p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-900 border-neutral-600 text-neutral-100 shadow-md'
                    : 'bg-neutral-900/40 border-neutral-800/80 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-neutral-500 tabular-nums">
                      0{index + 1}.
                    </span>
                    <span className="text-sm font-medium">{layer.nameKey}</span>
                  </div>
                  <StatusIndicator
                    status={isSelected ? 'active' : 'ready'}
                    label={isSelected ? 'Inspecting' : 'Isolated'}
                    showDot={isSelected}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Layer Details Panel */}
        <div className="lg:col-span-7">
          <Card padding="md" className="space-y-6">
            <div className="space-y-2 border-b border-neutral-800 pb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-neutral-100">
                  {activeLayer.nameKey}
                </h3>
                <span className="font-mono text-xs text-neutral-400 bg-neutral-800/60 px-2 py-0.5 rounded">
                  {activeLayer.path}
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {activeLayer.descKey}
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-semibold text-neutral-300 mb-1.5">
                  Architectural Guarantees
                </h4>
                <ul className="space-y-1.5 text-neutral-400">
                  {activeLayer.guarantees.map((g, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5" aria-hidden="true">✓</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/60">
                  <span className="text-neutral-500 text-[11px] uppercase tracking-wider block mb-1">
                    Inward Callers
                  </span>
                  <p className="text-neutral-300 font-mono text-xs">
                    {activeLayer.inwardDependencies.join(', ')}
                  </p>
                </div>
                <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/60">
                  <span className="text-neutral-500 text-[11px] uppercase tracking-wider block mb-1">
                    Outward Dependencies
                  </span>
                  <p className="text-neutral-300 font-mono text-xs">
                    {activeLayer.outwardDependencies.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
