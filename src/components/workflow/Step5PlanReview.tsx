/**
 * Step 5: Review Generated Plan View
 * Inspect planned directory structure, artifact manifest, generation order,
 * and customize engineering rules before in-memory synthesis.
 */

import React, { useState, useEffect } from 'react';
import { useProjectInput } from '../../state/project-input.context';
import { useI18n } from '../../i18n/i18n-context';
import { Card } from '../primitives/Card';
import { Button } from '../primitives/Button';

export const Step5PlanReview: React.FC = () => {
  const { spec, harnessPlan, generateHarnessPlan, isPlanning } = useProjectInput();
  const { t } = useI18n();

  const [newRule, setNewRule] = useState('');
  const [customRules, setCustomRules] = useState<string[]>([]);

  // Automatically plan if not planned yet
  useEffect(() => {
    if (!harnessPlan && !isPlanning) {
      generateHarnessPlan();
    }
  }, [harnessPlan, isPlanning]);

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setCustomRules([...customRules, newRule.trim()]);
    setNewRule('');
  };

  const handleRemoveRule = (idx: number) => {
    setCustomRules(customRules.filter((_, i) => i !== idx));
  };

  if (!harnessPlan) {
    return (
      <div className="text-center py-12 space-y-4 max-w-xl mx-auto">
        <h3 className="text-base font-semibold text-neutral-200">
          {t.workflow.planReview.title}
        </h3>
        <p className="text-neutral-400 text-xs leading-relaxed">
          {t.wizard.generatingPlan}
        </p>
        <div className="pt-2">
          <Button
            size="md"
            variant="primary"
            isLoading={isPlanning}
            onClick={() => generateHarnessPlan()}
            className="cursor-pointer bg-sky-600 hover:bg-sky-500 text-white"
          >
            {t.workflow.planReview.overviewTitle}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Step Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span className="text-sky-400 font-semibold">{t.common.step} 05</span>
          <span aria-hidden="true">/</span>
          <span>{t.wizard.stepList[5].title}</span>
        </div>
        <h2 className="text-xl font-bold text-neutral-100 sm:text-2xl">
          {t.workflow.planReview.title}
        </h2>
        <p className="text-xs text-neutral-400 leading-relaxed">
          {t.workflow.planReview.subtitle}
        </p>
      </div>

      {/* Plan Meta Card */}
      <Card padding="md" className="space-y-3 bg-neutral-900/60 border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
              {t.workflow.planReview.overviewTitle}
            </h3>
            <p className="text-xs text-neutral-400">
              {harnessPlan.rationale}
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-sky-950/80 text-sky-300 border border-sky-800 rounded">
            {harnessPlan.level.toUpperCase()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-neutral-400 font-mono">
          <div>
            <span>{t.workflow.planReview.artifactCountLabel}: </span>
            <span className="text-neutral-100 font-semibold">{harnessPlan.selectedArtifacts.length}</span>
          </div>
          <span>·</span>
          <div>
            <span>Subsystems: </span>
            <span className="text-neutral-100 font-semibold">6</span>
          </div>
          <span>·</span>
          <div>
            <span>Multi-Agent: </span>
            <span className="text-neutral-100 font-semibold">
              {spec.multiAgentEnabled ? 'Active' : 'Single'}
            </span>
          </div>
        </div>
      </Card>

      {/* Planned Artifacts Manifest */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            {t.workflow.planReview.selectedArtifactsTitle}
          </h3>
          <span className="text-xs text-neutral-500 font-mono">
            {harnessPlan.selectedArtifacts.length} files
          </span>
        </div>

        <div className="space-y-2">
          {harnessPlan.selectedArtifacts.map((art) => (
            <div
              key={art.path}
              className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-neutral-200">
                    {art.path}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-neutral-800 text-neutral-400 rounded">
                    {art.subsystem}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  {art.purpose || art.description}
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold shrink-0">
                ● Planned
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Generation Order */}
      <Card padding="md" className="space-y-3 bg-neutral-900/40 border-neutral-800">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 border-b border-neutral-800 pb-2">
          {t.workflow.planReview.generationOrderTitle}
        </h3>
        <ol className="list-decimal list-inside space-y-1.5 text-xs text-neutral-300 font-mono">
          {harnessPlan.generationOrder.map((path, idx) => (
            <li key={idx} className="leading-relaxed">
              <span className="text-neutral-200">{path}</span>
            </li>
          ))}
        </ol>
      </Card>

      {/* Custom Engineering Rules */}
      <Card padding="md" className="space-y-3 bg-neutral-900/40 border-neutral-800">
        <div className="space-y-0.5 border-b border-neutral-800 pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
            {t.workflow.planReview.customRulesTitle}
          </h3>
          <p className="text-[11px] text-neutral-400">
            {t.wizard.expertSettingsNote}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
            placeholder={t.workflow.planReview.addRulePlaceholder}
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-sky-500"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAddRule}
            disabled={!newRule.trim()}
            className="cursor-pointer text-xs"
          >
            {t.workflow.planReview.addRuleBtn}
          </Button>
        </div>

        {customRules.length > 0 ? (
          <ul className="space-y-1.5 pt-2">
            {customRules.map((rule, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-850 text-xs text-neutral-300"
              >
                <span>• {rule}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRule(idx)}
                  className="text-neutral-500 hover:text-rose-400 text-xs cursor-pointer p-1"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-neutral-500 italic pt-1">
            {t.workflow.planReview.rulesEmptyState}
          </p>
        )}
      </Card>
    </div>
  );
};
