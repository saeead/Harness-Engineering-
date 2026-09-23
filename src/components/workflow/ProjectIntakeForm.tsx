/**
 * Project Intake Form
 * Collects project specifications using progressive disclosure to prevent cognitive overload.
 */

import React, { useState } from 'react';
import { useProjectInput } from '../../state/project-input.context';
import { useI18n } from '../../i18n/i18n-context';
import { useNotification } from '../../state/notification.context';
import { useUIState } from '../../state/ui.context';
import { ProjectType, Feature } from '../../domain/models';

import { Card } from '../primitives/Card';
import { Input } from '../primitives/Input';
import { Textarea } from '../primitives/Textarea';
import { Select } from '../primitives/Select';
import { Button } from '../primitives/Button';

export const ProjectIntakeForm: React.FC = () => {
  const {
    spec,
    validation,
    updateField,
    runAnalysis,
    isAnalyzing,
    resetDraft,
    saveProjectDraft,
  } = useProjectInput();

  const { t } = useI18n();
  const { notifySuccess, notifyError } = useNotification();
  const { setActiveTab } = useUIState();


  // Progressive disclosure section toggles
  const [showScopeSection, setShowScopeSection] = useState<boolean>(true);
  const [showQualitySection, setShowQualitySection] = useState<boolean>(false);

  // Helper for multi-line textarea string to array
  const linesToArray = (text: string): string[] =>
    text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

  const arrayToLines = (arr?: string[]): string => (arr ? arr.join('\n') : '');

  // Features parsing
  const handleFeaturesChange = (text: string) => {
    const lines = linesToArray(text);
    const parsedFeatures: Feature[] = lines.map((line, idx) => ({
      id: `feat_${idx + 1}`,
      title: line,
      description: line,
      priority: idx === 0 ? 'critical' : idx < 3 ? 'high' : 'medium',
      status: 'planned',
      verificationCriteria: [`Feature "${line}" passes implementation tests`],
    }));
    updateField('coreFeatures', parsedFeatures);
  };

  const handleSaveDraft = async () => {
    try {
      const id = await saveProjectDraft();
      notifySuccess(t.common.success, `${t.workflow.specification.savedNotice} (ID: ${id})`);
    } catch {
      notifyError(t.common.error, 'Failed to persist draft to local storage.');
    }
  };

  const handlePreFillExample = () => {
    updateField('name', 'Distributed Task Orchestrator');
    updateField('projectType', 'service');
    updateField(
      'description',
      'A resilient, distributed job orchestrator coordinating batch tasks and background workers across heterogeneous nodes with local-first state persistence.',
    );
    updateField('targetUsers', 'Infrastructure engineers, DevOps teams, and high-throughput data processing systems.');
    updateField('preferredTechnology', 'TypeScript, Node.js, Express, Vitest');
    updateField('primaryGoals', [
      'Zero-latency job distribution and queue synchronization',
      'Local-first persistent journal for disaster recovery',
      'Deterministic execution guarantees across agent sessions',
    ]);
    handleFeaturesChange(
      'Atomic task queue with retry backoff\nDead-letter queue handling\nHeartbeat monitor for worker nodes\nREST API for job submission and status polling',
    );
    updateField('constraints', [
      'No heavy distributed databases (rely on local journal and file state)',
      'Zero external cloud telemetry without user permission',
      'Memory consumption under 256MB per worker process',
    ]);
    updateField('technicalRequirements', [
      'Node.js >= 20.0.0 ESM',
      'Strict type checking without any',
    ]);
    updateField('securityRequirements', [
      'In-memory credential vault',
      'Sanitize all incoming task payloads',
    ]);
    updateField('testingExpectations', [
      'Unit tests for scheduler with 90% branch coverage',
      'Integration tests for concurrency limits',
    ]);
    updateField('definitionOfDone', [
      'Clean build with zero type errors',
      'Passing unit and integration suites',
      'Session handoff updated in state.json',
    ]);
    setShowScopeSection(true);
    setShowQualitySection(true);
    notifySuccess('Sample Loaded', 'Loaded architectural example. Ready for AI Analysis.');
  };

  const handleAnalyze = async () => {
    if (!validation.isValid) {
      notifyError(
        t.errors.validationFailed,
        validation.errors[0]?.message || 'Please complete required fields before analysis.',
      );
      return;
    }
    try {
      await runAnalysis();
      notifySuccess('Analysis Complete', 'AI analysis generated structured insights and clarification questions.');
    } catch (err) {
      notifyError(t.common.error, `Analysis failed: ${String(err)}`);
    }
  };

  const projectTypeOptions: Array<{ value: ProjectType; label: string }> = [
    { value: 'web', label: t.workflow.projectTypes.web },
    { value: 'desktop', label: t.workflow.projectTypes.desktop },
    { value: 'mobile', label: t.workflow.projectTypes.mobile },
    { value: 'api', label: t.workflow.projectTypes.api },
    { value: 'cli', label: t.workflow.projectTypes.cli },
    { value: 'library', label: t.workflow.projectTypes.library },
    { value: 'service', label: t.workflow.projectTypes.service },
    { value: 'other', label: t.workflow.projectTypes.other },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Quick Pre-fill / Instructions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/60 p-4 rounded-xl border border-neutral-800/80">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-neutral-100">
            {t.workflow.title}
          </h2>
          <p className="text-xs text-neutral-400">
            {t.workflow.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveTab('repoAnalysis')}
            className="border-sky-800 text-sky-300 hover:bg-sky-950/60"
            title="Inspect an existing project or GitHub repository"
          >
            Audit Existing Repo →
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePreFillExample}
            title="Pre-fill with a production-grade distributed system example"
          >
            Load Example Template
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={resetDraft}
          >
            {t.common.reset}
          </Button>
        </div>

      </div>

      {/* SECTION 1: Project Identity & Natural Language Brief (Always Visible) */}
      <Card padding="md" className="space-y-4">
        <div className="border-b border-neutral-800/80 pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-200">
              01. Project Identity & Idea Brief
            </h3>
            <span className="text-[11px] font-mono text-neutral-500">Required Fundamentals</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t.workflow.form.projectName}
            placeholder={t.workflow.form.projectNamePlaceholder}
            value={spec.name}
            onChange={(e) => updateField('name', e.target.value)}
            errorText={validation.errors.find((e) => e.field === 'name')?.message}
            required
          />

          <Select
            label={t.workflow.form.projectType}
            options={projectTypeOptions}
            value={spec.projectType}
            onChange={(e) => updateField('projectType', e.target.value as ProjectType)}
            required
          />
        </div>

        <Textarea
          label={t.workflow.form.description}
          placeholder={t.workflow.form.descriptionPlaceholder}
          value={spec.description}
          onChange={(e) => updateField('description', e.target.value)}
          rows={3}
          errorText={validation.errors.find((e) => e.field === 'description')?.message}
          helperText="Explain the primary problem, core utility, and domain logic."
          required
        />

        <Input
          label={t.workflow.form.targetUsers}
          placeholder={t.workflow.form.targetUsersPlaceholder}
          value={spec.targetUsers}
          onChange={(e) => updateField('targetUsers', e.target.value)}
          helperText="Personas, roles, or consuming services interacting with this software."
        />
      </Card>

      {/* SECTION 2: Scope, Architecture & Technology (Progressive Disclosure) */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-neutral-200">
              02. Scope, Architecture & Tech Stack
            </h3>
            <p className="text-xs text-neutral-400">
              Core goals, feature breakdown, and language preferences.
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowScopeSection(!showScopeSection)}
          >
            {showScopeSection ? t.common.hideDetails : t.common.viewDetails}
          </Button>
        </div>

        {showScopeSection && (
          <div className="space-y-4 pt-2">
            <Input
              label={t.workflow.form.preferredTechnology}
              placeholder={t.workflow.form.preferredTechnologyPlaceholder}
              value={spec.preferredTechnology}
              onChange={(e) => updateField('preferredTechnology', e.target.value)}
              errorText={validation.errors.find((e) => e.field === 'preferredTechnology')?.message}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label={t.workflow.form.primaryGoals}
                placeholder={t.workflow.form.primaryGoalsPlaceholder}
                value={arrayToLines(spec.primaryGoals)}
                onChange={(e) => updateField('primaryGoals', linesToArray(e.target.value))}
                rows={4}
                helperText="One goal per line. Guides agent priorities."
              />

              <Textarea
                label={t.workflow.form.coreFeatures}
                placeholder={t.workflow.form.coreFeaturesPlaceholder}
                value={spec.coreFeatures.map((f) => f.title).join('\n')}
                onChange={(e) => handleFeaturesChange(e.target.value)}
                rows={4}
                helperText="One key feature per line. Synthesizes formal Feature models."
              />
            </div>

            {/* Multi-Agent Support Toggle */}
            <div className="bg-neutral-950/60 p-3.5 rounded-lg border border-neutral-800/80 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-neutral-200 block">
                  {t.workflow.form.multiAgent}
                </span>
                <p className="text-xs text-neutral-400">
                  {t.workflow.form.multiAgentDesc}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={spec.multiAgentEnabled}
                onClick={() => updateField('multiAgentEnabled', !spec.multiAgentEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 ${
                  spec.multiAgentEnabled ? 'bg-sky-600' : 'bg-neutral-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    spec.multiAgentEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* SECTION 3: Engineering Discipline, Quality Gates & Security (Progressive Disclosure) */}
      <Card padding="md" className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-neutral-200">
              03. Engineering Discipline & Verification Gates
            </h3>
            <p className="text-xs text-neutral-400">
              Prohibitions, security guardrails, test runners, and Definition of Done.
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowQualitySection(!showQualitySection)}
          >
            {showQualitySection ? t.common.hideDetails : t.common.viewDetails}
          </Button>
        </div>

        {showQualitySection && (
          <div className="space-y-4 pt-2">
            <Textarea
              label={t.workflow.form.constraints}
              placeholder={t.workflow.form.constraintsPlaceholder}
              value={arrayToLines(spec.constraints)}
              onChange={(e) => updateField('constraints', linesToArray(e.target.value))}
              rows={3}
              helperText="Strict anti-patterns, forbidden packages, or memory/network limits."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Textarea
                label={t.workflow.form.securityRequirements}
                placeholder={t.workflow.form.securityRequirementsPlaceholder}
                value={arrayToLines(spec.securityRequirements)}
                onChange={(e) => updateField('securityRequirements', linesToArray(e.target.value))}
                rows={3}
                helperText="Secrets isolation, input sanitization, and auth boundaries."
              />

              <Textarea
                label={t.workflow.form.testingExpectations}
                placeholder={t.workflow.form.testingExpectationsPlaceholder}
                value={arrayToLines(spec.testingExpectations)}
                onChange={(e) => updateField('testingExpectations', linesToArray(e.target.value))}
                rows={3}
                helperText="Evidence required by agents before finishing a task."
              />
            </div>

            <Textarea
              label={t.workflow.form.definitionOfDone}
              placeholder={t.workflow.form.definitionOfDonePlaceholder}
              value={arrayToLines(spec.definitionOfDone)}
              onChange={(e) => updateField('definitionOfDone', linesToArray(e.target.value))}
              rows={3}
              helperText="Concrete checklist an agent must verify before completing work."
            />
          </div>
        )}
      </Card>

      {/* Validation Summary Warning (if errors exist) */}
      {!validation.isValid && (
        <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 space-y-1">
          <span className="font-semibold block">Missing Required Information:</span>
          <ul className="list-disc ps-5 space-y-0.5">
            {validation.errors.map((err, idx) => (
              <li key={idx}>{err.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800/80">
        <div className="flex items-center gap-2">
          <Button
            size="md"
            variant="ghost"
            onClick={() => setActiveTab('home')}
          >
            ← {t.navigation.home}
          </Button>
          <Button
            size="md"
            variant="secondary"
            onClick={handleSaveDraft}
          >
            {t.workflow.form.saveDraftBtn}
          </Button>
        </div>


        <Button
          size="md"
          variant="primary"
          isLoading={isAnalyzing}
          onClick={handleAnalyze}
          disabled={!validation.isValid}
          className="w-full sm:w-auto"
        >
          {t.workflow.form.runAnalysisBtn} →
        </Button>
      </div>
    </div>
  );
};
