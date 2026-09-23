/**
 * Home Dashboard Component
 * Clean, focused overview displaying:
 * - Current project status & active stage
 * - Harness level & validation health
 * - Active engines & data isolation
 * - 8-Step Harness Lifecycle Journey
 * - Quick actions to resume workflow or audit an existing repository
 */

import React from 'react';
import { useProjectInput, WorkflowStep } from '../../state/project-input.context';
import { useUIState } from '../../state/ui.context';
import { useProviderState } from '../../state/provider.context';
import { useI18n } from '../../i18n/i18n-context';
import { Button } from '../primitives/Button';
import { Card } from '../primitives/Card';
import { StatusIndicator } from '../primitives/StatusIndicator';

export const HomeDashboard: React.FC = () => {
  const { t } = useI18n();
  const { setActiveTab } = useUIState();
  const {
    spec,
    harnessPlan,
    generatedFiles,
    harnessValidation,
    activeStep,
    goToStep,
  } = useProjectInput();

  const { activeAIProviderId, activeRepoProviderId } = useProviderState();

  const hasProject = Boolean(spec.name && spec.name.trim().length > 0);
  const projectName = hasProject ? spec.name : t.home.untitledProject;
  const projectType = spec.projectType || 'web';

  const handleResumeWorkflow = () => {
    setActiveTab('workflow');
  };

  const handleStartNewProject = () => {
    goToStep(1);
    setActiveTab('workflow');
  };

  const handleOpenRepoAuditor = () => {
    setActiveTab('repoAnalysis');
  };

  const handleOpenSettings = () => {
    setActiveTab('settings');
  };

  const stepsList: WorkflowStep[] = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-850">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
            <span>{t.home.badgePrefix}</span>
            <span aria-hidden="true">·</span>
            <span>{t.home.badgeSuffix}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100 sm:text-3xl">
            {hasProject ? projectName : t.home.readyTitle}
          </h1>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            {t.home.readySubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            size="md"
            variant="outline"
            onClick={handleOpenRepoAuditor}
            className="cursor-pointer"
          >
            {t.home.auditExistingRepo}
          </Button>

          <Button
            size="md"
            variant="primary"
            onClick={hasProject ? handleResumeWorkflow : handleStartNewProject}
            className="cursor-pointer bg-sky-600 hover:bg-sky-500 border-sky-500 text-white"
          >
            {hasProject
              ? `${t.home.resumeStage} ${activeStep} →`
              : `${t.home.startNewHarness} →`}
          </Button>
        </div>
      </div>

      {/* Primary Project Status & Stage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Active Project Overview */}
        <Card padding="md" className="space-y-3 bg-neutral-900/40 border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">
              {t.home.currentProjectOverview}
            </span>
            <StatusIndicator
              status={hasProject ? 'ready' : 'pending'}
              label={hasProject ? t.common.ready : t.common.unconfigured}
            />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-neutral-100 truncate">
              {projectName}
            </h2>
            <div className="text-xs text-neutral-400 flex items-center gap-2">
              <span className="uppercase font-mono text-[11px] text-sky-400">{projectType}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{spec.preferredTechnology || 'Full-Stack Standard'}</span>
            </div>
          </div>

          <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
            {spec.description || t.home.readySubtitle}
          </p>

          <div className="pt-2 border-t border-neutral-850 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
            <span>
              {t.home.stage}: {activeStep} / 8
            </span>
            <button
              onClick={handleResumeWorkflow}
              className="text-sky-400 hover:text-sky-300 underline cursor-pointer"
            >
              {t.common.viewDetails} →
            </button>
          </div>
        </Card>

        {/* Card 2: Harness Architecture & Invariants */}
        <Card padding="md" className="space-y-3 bg-neutral-900/40 border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">
              {t.home.harnessLevel}
            </span>
            <StatusIndicator
              status={
                harnessValidation?.isValid
                  ? 'ready'
                  : harnessPlan
                  ? 'warning'
                  : 'pending'
              }
              label={
                harnessValidation?.isValid
                  ? t.home.validationPassed
                  : harnessPlan
                  ? t.home.validationStatus
                  : t.home.validationIssues
              }
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-semibold text-neutral-100 uppercase font-mono">
                {harnessPlan?.level || spec.targetHarnessLevel || 'Medium'}
              </span>
              <span className="text-xs font-mono text-neutral-400">
                {generatedFiles.length > 0 ? `${generatedFiles.length} ${t.workflow.planReview.selectedArtifactsTitle}` : `0 ${t.workflow.planReview.selectedArtifactsTitle}`}
              </span>
            </div>

            <p className="text-xs text-neutral-400">
              {harnessPlan
                ? t.workflow.harnessConfig.subsystemsDesc
                : t.workflow.harnessConfig.levelSelectionTitle}
            </p>
          </div>

          <div className="pt-2 border-t border-neutral-850 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
            <span>
              {t.common.status}: {harnessValidation?.isValid ? t.common.ready : t.common.pending}
            </span>
            <span>{t.workflow.planReview.generationOrderTitle}</span>
          </div>
        </Card>

        {/* Card 3: Active Engines & Destination Target */}
        <Card padding="md" className="space-y-3 bg-neutral-900/40 border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">
              {t.home.activeEngines}
            </span>
            <button
              onClick={handleOpenSettings}
              className="text-[11px] text-neutral-400 hover:text-white font-mono underline cursor-pointer"
            >
              {t.home.changeSettings}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-neutral-850">
              <span className="text-neutral-400">{t.settings.tabs.aiProviders}:</span>
              <span className="font-mono text-neutral-200 uppercase font-medium">
                {activeAIProviderId}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-neutral-850">
              <span className="text-neutral-400">{t.settings.tabs.github}:</span>
              <span className="font-mono text-emerald-400 uppercase font-medium">
                {activeRepoProviderId === 'github' ? 'GitHub (Git Trees)' : 'Local FS / ZIP'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-neutral-400">{t.settings.tabs.privacy}:</span>
              <span className="font-mono text-neutral-300">{t.home.localFirstNotice}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Stepper Journey Visualizer (8 Steps) */}
      <Card padding="md" className="space-y-4 bg-neutral-900/30 border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-850 pb-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-neutral-200">
              {t.home.quickWorkflowOverview}
            </h2>
            <p className="text-xs text-neutral-400">
              {t.wizard.subtitle}
            </p>
          </div>
          <span className="text-xs font-mono text-sky-400">
            {t.common.step} {activeStep} {t.common.of} 8
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {stepsList.map((step) => {
            const isCurrent = activeStep === step;
            const isPassed = activeStep > step;
            const stepData = t.wizard.stepList[step];

            return (
              <button
                key={step}
                type="button"
                onClick={() => {
                  goToStep(step);
                  setActiveTab('workflow');
                }}
                className={`p-3 rounded-lg border text-start transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-sky-500 bg-sky-950/20 text-neutral-100 ring-1 ring-sky-500/40'
                    : isPassed
                    ? 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 text-neutral-300'
                    : 'border-neutral-850 bg-neutral-950/40 text-neutral-500'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-mono font-semibold ${isCurrent ? 'text-sky-400' : isPassed ? 'text-emerald-400' : 'text-neutral-500'}`}>
                    0{step}
                  </span>
                  {isPassed && <span className="text-emerald-400 font-mono text-[10px]">✓</span>}
                  {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />}
                </div>
                <p className="text-[11px] font-medium truncate">
                  {stepData?.title || `Step ${step}`}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Secondary Row: Repo Auditor & Notices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Repo Auditor Callout */}
        <Card padding="md" className="space-y-3 bg-neutral-900/40 border-neutral-800 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span>{t.home.badgePrefix}</span>
              <span aria-hidden="true">·</span>
              <span>{t.home.noTelemetryNotice}</span>
            </div>
            <h3 className="text-base font-semibold text-neutral-100">
              {t.home.auditExistingRepo}
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t.repoAnalysis.title}: {t.repoAnalysis.subtitle}
            </p>
          </div>

          <div className="pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenRepoAuditor}
              className="cursor-pointer"
            >
              {t.home.auditExistingRepo} →
            </Button>
          </div>
        </Card>

        {/* Multi-Agent Notice & Principles Reference */}
        <Card padding="md" className="space-y-3 bg-neutral-900/40 border-neutral-800">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider font-mono">
            {t.home.multiAgentNotice}
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850 space-y-0.5">
              <span className="font-mono text-[11px] text-sky-400">1. {t.harness.principles.instructions}</span>
              <p className="text-neutral-400 text-[11px]">{t.wizard.stepList[1].title}</p>
            </div>
            <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850 space-y-0.5">
              <span className="font-mono text-[11px] text-emerald-400">2. {t.harness.principles.state}</span>
              <p className="text-neutral-400 text-[11px]">{t.wizard.stepList[2].title}</p>
            </div>
            <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850 space-y-0.5">
              <span className="font-mono text-[11px] text-amber-400">3. {t.harness.principles.scope}</span>
              <p className="text-neutral-400 text-[11px]">{t.wizard.stepList[4].title}</p>
            </div>
            <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850 space-y-0.5">
              <span className="font-mono text-[11px] text-purple-400">4. {t.harness.principles.verification}</span>
              <p className="text-neutral-400 text-[11px]">{t.wizard.stepList[5].title}</p>
            </div>
            <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850 space-y-0.5">
              <span className="font-mono text-[11px] text-teal-400">5. {t.harness.principles.sessionLifecycle}</span>
              <p className="text-neutral-400 text-[11px]">{t.wizard.stepList[7].title}</p>
            </div>
            <div className="p-2 rounded bg-neutral-950/60 border border-neutral-850 space-y-0.5">
              <span className="font-mono text-[11px] text-rose-400">6. {t.harness.principles.observability}</span>
              <p className="text-neutral-400 text-[11px]">{t.wizard.stepList[8].title}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
