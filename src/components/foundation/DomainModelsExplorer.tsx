/**
 * Domain Models Explorer Component
 * Visualizes the core domain entities, Harness levels, and artifact categories.
 */

import React, { useState } from 'react';
import { HARNESS_LEVEL_DEFINITIONS } from '../../config/app-config';
import { HarnessLevel } from '../../domain/models';
import { Card } from '../primitives/Card';
import { useI18n } from '../../i18n/i18n-context';

export const DomainModelsExplorer: React.FC = () => {
  const { t } = useI18n();
  const [selectedLevel, setSelectedLevel] = useState<HarnessLevel>('medium');

  const harnessLevels: HarnessLevel[] = ['basic', 'medium', 'advanced', 'dynamic'];

  const domainEntities = [
    {
      name: 'Project',
      description: 'Primary aggregate root containing the Specification, durable State, and generated HarnessPlan.',
      keyFields: ['id', 'specification', 'state', 'plan', 'createdAt', 'updatedAt'],
    },
    {
      name: 'ProjectSpecification',
      description: 'Strict user requirements, target platform, stack, core objectives, features, and DoD.',
      keyFields: ['name', 'targetPlatform', 'primaryLanguage', 'coreObjectives', 'definitionOfDone'],
    },
    {
      name: 'HarnessPlan',
      description: 'Topology of chosen artifacts, architectural pattern, rationale, and custom agent rules.',
      keyFields: ['projectId', 'level', 'selectedArtifacts', 'architecturePattern', 'rationale'],
    },
    {
      name: 'HarnessArtifact',
      description: 'Individual specification file, agent prompt, state schema, or verification test script.',
      keyFields: ['path', 'filename', 'category', 'purpose', 'fileType', 'isRequired'],
    },
    {
      name: 'ProjectState',
      description: 'Machine-readable durable project progression tracking, active phase, and handoff notes.',
      keyFields: ['phase', 'completionPercentage', 'blockers', 'lastHandoffNote', 'updatedAt'],
    },
    {
      name: 'GenerationJob',
      description: 'Lifecycle coordinator tracking progress, sequential steps, and validation gates.',
      keyFields: ['id', 'status', 'progress', 'steps', 'currentStepIndex', 'startedAt'],
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
          {t.foundation.inspectDomain}
        </h2>
        <p className="text-sm text-neutral-400">
          Strongly-typed entity models ensuring consistency across AI models, coding agents, and long-running sessions.
        </p>
      </div>

      {/* Harness Levels Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-200">
            Harness Levels & Topology Presets
          </h3>
          <span className="text-xs text-neutral-500 font-mono">
            Proportional to project complexity
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {harnessLevels.map((lvl) => {
            const def = HARNESS_LEVEL_DEFINITIONS[lvl];
            const isSelected = selectedLevel === lvl;
            const levelTitles: Record<HarnessLevel, string> = {
              basic: t.harness.levels.basic.title,
              medium: t.harness.levels.medium.title,
              advanced: t.harness.levels.advanced.title,
              dynamic: t.harness.levels.dynamic.title,
            };
            const levelDescs: Record<HarnessLevel, string> = {
              basic: t.harness.levels.basic.desc,
              medium: t.harness.levels.medium.desc,
              advanced: t.harness.levels.advanced.desc,
              dynamic: t.harness.levels.dynamic.desc,
            };

            return (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`p-4 rounded-xl border text-start transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-900 border-neutral-500 shadow-md'
                    : 'bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-100">
                      {levelTitles[lvl]}
                    </span>
                    <span className="font-mono text-[11px] text-neutral-400">
                      {def.recommendedFileCount}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">
                    {levelDescs[lvl]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Level Capabilities */}
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Key Capabilities for {selectedLevel.toUpperCase()}
            </h4>
            <span className="text-xs font-mono text-neutral-500">
              Complexity: {HARNESS_LEVEL_DEFINITIONS[selectedLevel].targetComplexity}
            </span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-300">
            {HARNESS_LEVEL_DEFINITIONS[selectedLevel].keyCapabilities.map((cap, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-neutral-500 font-mono">0{idx + 1}.</span>
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Core Domain Entities Table */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-200">
          Core TypeScript Entities (`src/domain/models/*`)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {domainEntities.map((entity) => (
            <Card key={entity.name} padding="sm" className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-neutral-100">
                  {entity.name}
                </span>
                <span className="text-[11px] text-neutral-500 font-mono">Entity</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed min-h-[36px]">
                {entity.description}
              </p>
              <div className="pt-2 border-t border-neutral-800/80">
                <span className="text-[11px] text-neutral-500 block mb-1">Key Fields:</span>
                <div className="flex flex-wrap gap-1 text-[11px] font-mono text-neutral-300">
                  {entity.keyFields.map((f) => (
                    <span key={f} className="bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
