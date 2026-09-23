/**
 * Step 4: Harness Configuration View
 * Guided selection of Harness topology level (Basic, Medium, Advanced, Dynamic)
 * and allocation of the 6 core governance subsystems.
 */

import React from 'react';
import { useProjectInput } from '../../state/project-input.context';
import { useI18n } from '../../i18n/i18n-context';
import { Card } from '../primitives/Card';
import { HarnessLevel } from '../../domain/models';

export const Step4HarnessConfig: React.FC = () => {
  const { spec, analysis, selectHarnessLevel, updateField } = useProjectInput();
  const { t } = useI18n();

  const currentLevel: HarnessLevel = spec.targetHarnessLevel || 'medium';
  const aiRecommended: HarnessLevel = (analysis?.recommendedLevel as HarnessLevel) || 'medium';

  const levels: Array<{ id: HarnessLevel; title: string; desc: string }> = [
    {
      id: 'basic',
      title: t.harness.levels.basic.title,
      desc: t.harness.levels.basic.desc,
    },
    {
      id: 'medium',
      title: t.harness.levels.medium.title,
      desc: t.harness.levels.medium.desc,
    },
    {
      id: 'advanced',
      title: t.harness.levels.advanced.title,
      desc: t.harness.levels.advanced.desc,
    },
    {
      id: 'dynamic',
      title: t.harness.levels.dynamic.title,
      desc: t.harness.levels.dynamic.desc,
    },
  ];

  const subsystems = [
    { title: t.harness.principles.instructions, num: '01' },
    { title: t.harness.principles.state, num: '02' },
    { title: t.harness.principles.scope, num: '03' },
    { title: t.harness.principles.verification, num: '04' },
    { title: t.harness.principles.sessionLifecycle, num: '05' },
    { title: t.harness.principles.observability, num: '06' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Step Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span className="text-sky-400 font-semibold">{t.common.step} 04</span>
          <span aria-hidden="true">/</span>
          <span>{t.wizard.stepList[4].title}</span>
        </div>
        <h2 className="text-xl font-bold text-neutral-100 sm:text-2xl">
          {t.workflow.harnessConfig.title}
        </h2>
        <p className="text-xs text-neutral-400 leading-relaxed">
          {t.workflow.harnessConfig.subtitle}
        </p>
      </div>

      {/* Level Selection Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            {t.workflow.harnessConfig.levelSelectionTitle}
          </h3>
          <span className="text-xs text-neutral-500 font-mono">
            {t.workflow.harnessConfig.recommendedTag}: {aiRecommended.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {levels.map((lvl) => {
            const isSelected = currentLevel === lvl.id;
            const isRec = aiRecommended === lvl.id;

            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => selectHarnessLevel(lvl.id)}
                className={`p-4 rounded-xl border text-start transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-neutral-900 border-sky-500 shadow-md ring-1 ring-sky-500/50'
                    : 'bg-neutral-950/60 border-neutral-850 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${isSelected ? 'text-sky-300' : 'text-neutral-200'}`}>
                    {lvl.title}
                  </span>
                  {isRec && (
                    <span className="text-[11px] font-mono font-medium text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      ★ {t.workflow.harnessConfig.recommendedTag}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {lvl.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subsystem Allocation Matrix */}
      <Card padding="md" className="space-y-4 bg-neutral-900/40 border-neutral-800">
        <div className="space-y-0.5 border-b border-neutral-800 pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
            {t.workflow.harnessConfig.subsystemsTitle}
          </h3>
          <p className="text-[11px] text-neutral-400">
            {t.workflow.harnessConfig.subsystemsDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {subsystems.map((sub) => (
            <div
              key={sub.num}
              className="p-3 rounded-lg bg-neutral-950 border border-neutral-850 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-neutral-500 text-xs">{sub.num}</span>
                <span className="text-xs text-neutral-300 font-medium">{sub.title}</span>
              </div>
              <span className="text-emerald-400 text-xs font-bold">✓</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Multi-Agent Protocol */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-neutral-200">
            {t.workflow.harnessConfig.multiAgentTitle}
          </span>
          <p className="text-[11px] text-neutral-400 max-w-lg">
            {t.workflow.harnessConfig.multiAgentDesc}
          </p>
        </div>
        <input
          type="checkbox"
          checked={Boolean(spec.multiAgentEnabled)}
          onChange={(e) => updateField('multiAgentEnabled', e.target.checked)}
          className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-sky-600 focus:ring-sky-500 cursor-pointer"
        />
      </div>
    </div>
  );
};
