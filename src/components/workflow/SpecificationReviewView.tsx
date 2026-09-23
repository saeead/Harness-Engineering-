/**
 * Specification Review & Harness Selection View
 * Allows selecting the Harness level, reviewing the final structured specification, and exporting/persisting locally.
 */

import React, { useState } from 'react';
import { useProjectInput } from '../../state/project-input.context';
import { useI18n } from '../../i18n/i18n-context';
import { useNotification } from '../../state/notification.context';
import { HARNESS_LEVEL_DEFINITIONS } from '../../config/app-config';
import { HarnessLevel } from '../../domain/models';
import { Card } from '../primitives/Card';
import { Button } from '../primitives/Button';
import { StatusIndicator } from '../primitives/StatusIndicator';

export const SpecificationReviewView: React.FC = () => {
  const {
    spec,
    selectHarnessLevel,
    goToStep,
    saveProjectDraft,
    lastSavedAt,
    analysis,
    generateHarnessPlan,
    isPlanning,
  } = useProjectInput();


  const { t } = useI18n();
  const { notifySuccess } = useNotification();
  const [copied, setCopied] = useState<boolean>(false);

  const harnessLevels: HarnessLevel[] = ['basic', 'medium', 'advanced', 'dynamic'];

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

  const handleCopyJson = () => {
    const payload = JSON.stringify(spec, null, 2);
    navigator.clipboard.writeText(payload);
    setCopied(true);
    notifySuccess(t.common.copied, 'Specification JSON copied to clipboard.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadJson = () => {
    const payload = JSON.stringify(spec, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(spec.name || 'project').toLowerCase().replace(/\s+/g, '_')}_specification.json`;
    a.click();
    URL.revokeObjectURL(url);
    notifySuccess('Downloaded', 'Project specification downloaded.');
  };

  const handleSaveLocally = async () => {
    const id = await saveProjectDraft();
    notifySuccess(t.common.success, `${t.workflow.specification.savedNotice} (ID: ${id})`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Overview Banner */}
      <Card padding="md" className="space-y-3 bg-neutral-900/60 border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-neutral-100">
              {t.workflow.specification.title}
            </h2>
            <p className="text-xs text-neutral-400">
              {t.workflow.specification.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveLocally}
            >
              {t.common.save} Locally
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownloadJson}
            >
              {t.workflow.specification.downloadSpecBtn}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-neutral-400 font-mono">
          <div className="flex items-center gap-2">
            <StatusIndicator status="ready" label="Structured Spec Ready" />
          </div>
          <span>·</span>
          <div>
            <span>Local Persistence: </span>
            <span className="text-neutral-200">
              {lastSavedAt ? `Saved at ${lastSavedAt}` : 'Auto-cached'}
            </span>
          </div>
          <span>·</span>
          <div>
            <span>AI Independence: </span>
            <span className="text-neutral-300">100% Provider-Agnostic</span>
          </div>
        </div>
      </Card>

      {/* 1. Harness Level Selection */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-neutral-200">
            {t.workflow.specification.harnessSelectionTitle}
          </h3>
          <p className="text-xs text-neutral-400">
            {t.workflow.specification.harnessSelectionDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {harnessLevels.map((lvl) => {
            const isSelected = spec.targetHarnessLevel === lvl;
            const isRecommended = analysis?.recommendedLevel === lvl;
            const def = HARNESS_LEVEL_DEFINITIONS[lvl];

            return (
              <button
                key={lvl}
                type="button"
                onClick={() => selectHarnessLevel(lvl)}
                className={`p-4 rounded-xl border text-start transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-neutral-900 border-neutral-400 shadow-md ring-1 ring-neutral-400'
                    : 'bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                {isRecommended && (
                  <span className="absolute top-2.5 end-2.5 text-[10px] font-mono text-sky-400 font-semibold">
                    AI Pick
                  </span>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-100">
                      {levelTitles[lvl]}
                    </span>
                    <span className="font-mono text-[11px] text-neutral-500">
                      {def.recommendedFileCount}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">
                    {levelDescs[lvl]}
                  </p>
                  <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-500 font-mono">
                    Complexity: {def.targetComplexity}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Structured Invariant Summary */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
            {t.workflow.specification.specOverviewTitle}
          </h3>
          <span className="text-xs text-neutral-400 font-mono">
            {spec.name || 'Unnamed'} ({spec.projectType.toUpperCase()})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-neutral-500 font-mono text-[11px]">Primary Goals:</span>
            <ul className="list-disc ps-4 space-y-0.5 text-neutral-300">
              {spec.primaryGoals?.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-1">
            <span className="text-neutral-500 font-mono text-[11px]">Key Features ({spec.coreFeatures.length}):</span>
            <ul className="list-disc ps-4 space-y-0.5 text-neutral-300">
              {spec.coreFeatures.slice(0, 4).map((f) => (
                <li key={f.id}>{f.title}</li>
              ))}
              {spec.coreFeatures.length > 4 && (
                <li className="text-neutral-500">+{spec.coreFeatures.length - 4} more</li>
              )}
            </ul>
          </div>

          <div className="space-y-1">
            <span className="text-neutral-500 font-mono text-[11px]">Security & Data Isolation:</span>
            <ul className="list-disc ps-4 space-y-0.5 text-neutral-300">
              {spec.securityRequirements?.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-1">
            <span className="text-neutral-500 font-mono text-[11px]">Testing Expectations & DoD:</span>
            <ul className="list-disc ps-4 space-y-0.5 text-neutral-300">
              {spec.testingExpectations?.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* 3. Exportable JSON Viewer */}
      <Card padding="md" className="space-y-3 bg-neutral-950 border-neutral-850">
        <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-neutral-300">
              project_specification.json
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">
              (Durable Schema Representation)
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyJson}
            className="text-xs"
          >
            {copied ? t.common.copied : t.common.copy}
          </Button>
        </div>

        <pre
          dir="ltr"
          className="font-mono text-xs text-neutral-300 overflow-x-auto p-3 bg-neutral-900/60 rounded-lg max-h-72 border border-neutral-800/80 leading-relaxed text-left"
        >
          {JSON.stringify(spec, null, 2)}
        </pre>

      </Card>

      {/* Navigation Actions Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800/80">
        <Button
          size="md"
          variant="outline"
          onClick={() => goToStep(2)}
        >
          ← {t.common.back} to AI Analysis
        </Button>

        <div className="flex items-center gap-3">
          <Button
            size="md"
            variant="secondary"
            onClick={handleSaveLocally}
          >
            {t.common.save} Draft
          </Button>
          <Button
            size="md"
            variant="primary"
            isLoading={isPlanning}
            onClick={() => generateHarnessPlan()}
          >
            {t.workflow.planView.generatePlanBtn} →
          </Button>
        </div>
      </div>
    </div>
  );
};

