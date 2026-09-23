/**
 * Step 2: Project Requirements & Verification Gates
 * Captures product goals, key capabilities, tech stack, and progressive disclosure for:
 * Constraints, Security, Testing Expectations, Definition of Done, and Multi-Agent support.
 */

import React, { useState } from 'react';
import { useProjectInput } from '../../state/project-input.context';
import { useI18n } from '../../i18n/i18n-context';
import { Card } from '../primitives/Card';
import { Input } from '../primitives/Input';
import { Button } from '../primitives/Button';

export const Step2ProjectRequirements: React.FC = () => {
  const { spec, updateField } = useProjectInput();
  const { t } = useI18n();

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Helper to sync multiline strings to arrays
  const handleMultilineChange = (
    field:
      | 'primaryGoals'
      | 'constraints'
      | 'technicalRequirements'
      | 'securityRequirements'
      | 'testingExpectations'
      | 'definitionOfDone',
    text: string,
  ) => {
    const lines = text.split('\n');
    updateField(field, lines);
  };

  const getMultilineValue = (arr?: string[]) => {
    return Array.isArray(arr) ? arr.join('\n') : '';
  };

  const getFeaturesString = () => {
    if (!spec.coreFeatures || !Array.isArray(spec.coreFeatures)) return '';
    return spec.coreFeatures
      .map((f: any) => (typeof f === 'string' ? f : f.title || ''))
      .join('\n');
  };

  const handleFeaturesStringChange = (text: string) => {
    const lines = text.split('\n');
    const features = lines.map((title, idx) => ({
      id: `feat-${idx + 1}`,
      title: title,
      description: title,
      priority: 'high' as const,
      status: 'planned' as const,
      verificationCriteria: [],
    }));
    updateField('coreFeatures', features);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Step Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span className="text-sky-400 font-semibold">{t.common.step} 02</span>
          <span aria-hidden="true">/</span>
          <span>{t.wizard.stepList[2].title}</span>
        </div>
        <h2 className="text-xl font-bold text-neutral-100 sm:text-2xl">
          {t.wizard.stepList[2].title}
        </h2>
        <p className="text-xs text-neutral-400 leading-relaxed">
          {t.wizard.stepList[2].desc}
        </p>
      </div>

      <Card className="p-6 space-y-6 bg-neutral-900/60 border-neutral-800">
        {/* Preferred Stack */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-200">
            {t.workflow.form.preferredTechnology}
          </label>
          <Input
            value={spec.preferredTechnology || ''}
            onChange={(e) => updateField('preferredTechnology', e.target.value)}
            placeholder={t.workflow.form.preferredTechnologyPlaceholder}
            className="w-full bg-neutral-950 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus:border-sky-500"
          />
          <p className="text-[11px] text-neutral-500">
            {t.workflow.form.preferredTechnologyHelp}
          </p>
        </div>

        {/* Primary Goals */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-200">
            {t.workflow.form.primaryGoals}
          </label>
          <textarea
            rows={3}
            value={getMultilineValue(spec.primaryGoals)}
            onChange={(e) => handleMultilineChange('primaryGoals', e.target.value)}
            placeholder={t.workflow.form.primaryGoalsPlaceholder}
            className="w-full p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-sky-500 text-xs font-mono leading-relaxed"
          />
          <p className="text-[11px] text-neutral-500">
            {t.workflow.form.primaryGoalsHelp}
          </p>
        </div>

        {/* Core Features */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-200">
            {t.workflow.form.coreFeatures}
          </label>
          <textarea
            rows={3}
            value={getFeaturesString()}
            onChange={(e) => handleFeaturesStringChange(e.target.value)}
            placeholder={t.workflow.form.coreFeaturesPlaceholder}
            className="w-full p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-sky-500 text-xs font-mono leading-relaxed"
          />
          <p className="text-[11px] text-neutral-500">
            {t.workflow.form.coreFeaturesHelp}
          </p>
        </div>

        {/* Progressive Disclosure Toggle */}
        <div className="pt-4 border-t border-neutral-800/80">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-neutral-200">
                {t.workflow.form.advancedSectionTitle}
              </span>
              <p className="text-[11px] text-neutral-400">
                {t.wizard.expertSettingsNote}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs cursor-pointer"
            >
              {showAdvanced
                ? t.wizard.progressiveDisclosureToggleHide
                : t.wizard.progressiveDisclosureToggleShow}
            </Button>
          </div>

          {/* Advanced Section Content */}
          {showAdvanced && (
            <div className="mt-6 space-y-6 pt-6 border-t border-neutral-850">
              {/* Constraints */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-200">
                  {t.workflow.form.constraints}
                </label>
                <textarea
                  rows={3}
                  value={getMultilineValue(spec.constraints)}
                  onChange={(e) => handleMultilineChange('constraints', e.target.value)}
                  placeholder={t.workflow.form.constraintsPlaceholder}
                  className="w-full p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-sky-500 text-xs font-mono leading-relaxed"
                />
                <p className="text-[11px] text-neutral-500">
                  {t.workflow.form.constraintsHelp}
                </p>
              </div>

              {/* Technical Requirements */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-200">
                  {t.workflow.form.technicalRequirements}
                </label>
                <textarea
                  rows={2}
                  value={getMultilineValue(spec.technicalRequirements)}
                  onChange={(e) => handleMultilineChange('technicalRequirements', e.target.value)}
                  placeholder={t.workflow.form.technicalRequirementsPlaceholder}
                  className="w-full p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-sky-500 text-xs font-mono leading-relaxed"
                />
                <p className="text-[11px] text-neutral-500">
                  {t.workflow.form.technicalRequirementsHelp}
                </p>
              </div>

              {/* Security Requirements */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-200">
                  {t.workflow.form.securityRequirements}
                </label>
                <textarea
                  rows={2}
                  value={getMultilineValue(spec.securityRequirements)}
                  onChange={(e) => handleMultilineChange('securityRequirements', e.target.value)}
                  placeholder={t.workflow.form.securityRequirementsPlaceholder}
                  className="w-full p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-sky-500 text-xs font-mono leading-relaxed"
                />
                <p className="text-[11px] text-neutral-500">
                  {t.workflow.form.securityRequirementsHelp}
                </p>
              </div>

              {/* Testing Expectations */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-200">
                  {t.workflow.form.testingExpectations}
                </label>
                <textarea
                  rows={2}
                  value={getMultilineValue(spec.testingExpectations)}
                  onChange={(e) => handleMultilineChange('testingExpectations', e.target.value)}
                  placeholder={t.workflow.form.testingExpectationsPlaceholder}
                  className="w-full p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-sky-500 text-xs font-mono leading-relaxed"
                />
                <p className="text-[11px] text-neutral-500">
                  {t.workflow.form.testingExpectationsHelp}
                </p>
              </div>

              {/* Definition of Done */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-200">
                  {t.workflow.form.definitionOfDone}
                </label>
                <textarea
                  rows={3}
                  value={getMultilineValue(spec.definitionOfDone)}
                  onChange={(e) => handleMultilineChange('definitionOfDone', e.target.value)}
                  placeholder={t.workflow.form.definitionOfDonePlaceholder}
                  className="w-full p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-sky-500 text-xs font-mono leading-relaxed"
                />
                <p className="text-[11px] text-neutral-500">
                  {t.workflow.form.definitionOfDoneHelp}
                </p>
              </div>

              {/* Multi-Agent Collaboration Switch */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-950 border border-neutral-850">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-neutral-200">
                    {t.workflow.form.multiAgent}
                  </span>
                  <p className="text-[11px] text-neutral-400 max-w-lg">
                    {t.workflow.form.multiAgentDesc}
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
          )}
        </div>
      </Card>
    </div>
  );
};
