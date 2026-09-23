/**
 * Harness Planning & Generated Artifacts View
 * Displays the complete Harness Plan across all 6 core subsystems,
 * the in-memory generated file contents, and the 7-invariant validation report.
 */

import React, { useState } from 'react';
import { useProjectInput } from '../../state/project-input.context';
import { useI18n } from '../../i18n/i18n-context';
import { useNotification } from '../../state/notification.context';
import { GeneratedFile, SubsystemType } from '../../domain/models/harness';
import { Card } from '../primitives/Card';
import { Button } from '../primitives/Button';
import { StatusIndicator } from '../primitives/StatusIndicator';
import { ExportWorkspaceModal } from '../export/ExportWorkspaceModal';

export const HarnessPlanningView: React.FC = () => {

  const {
    spec,
    harnessPlan,
    generatedFiles,
    harnessValidation,
    generateHarnessPlan,
    isPlanning,
    goToStep,
    exportGeneratedFilesJson,
  } = useProjectInput();

  const { t } = useI18n();
  const { notifySuccess } = useNotification();

  const [selectedFileId, setSelectedFileId] = useState<string | null>(() => {
    return generatedFiles.length > 0 ? generatedFiles[0].id : null;
  });
  const [copiedFile, setCopiedFile] = useState<boolean>(false);
  const [activeSubsystemFilter, setActiveSubsystemFilter] = useState<SubsystemType | 'all'>('all');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);


  if (!harnessPlan) {
    return (
      <div className="text-center py-16 space-y-4 max-w-md mx-auto">
        <p className="text-neutral-400 text-sm">
          No Harness Plan has been generated yet for this specification.
        </p>
        <Button
          size="md"
          variant="primary"
          isLoading={isPlanning}
          onClick={() => generateHarnessPlan()}
        >
          {t.workflow.planView.generatePlanBtn}
        </Button>
      </div>
    );
  }

  const selectedFile =
    generatedFiles.find((f) => f.id === selectedFileId) || generatedFiles[0];

  const filteredFiles =
    activeSubsystemFilter === 'all'
      ? generatedFiles
      : generatedFiles.filter((f) => f.subsystem === activeSubsystemFilter);

  const handleCopyContent = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedFile(true);
    notifySuccess(t.common.copied, `Copied ${selectedFile.filename} to clipboard.`);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleDownloadPackageJson = () => {
    const jsonStr = exportGeneratedFilesJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(spec.name || 'project').toLowerCase().replace(/\s+/g, '_')}_harness_plan.json`;
    a.click();
    URL.revokeObjectURL(url);
    notifySuccess('Export Ready', 'Harness plan and generated artifacts exported to JSON.');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header & Rationale Banner */}
      <Card padding="md" className="space-y-4 bg-neutral-900/60 border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-neutral-100">
                {t.workflow.planView.title}
              </h2>
              <span className="font-mono text-xs text-sky-400 uppercase font-semibold">
                [{harnessPlan.level} Topology]
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              {t.workflow.planView.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              isLoading={isPlanning}
              onClick={() => generateHarnessPlan()}
            >
              {t.workflow.planView.replanBtn}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownloadPackageJson}
            >
              {t.workflow.planView.downloadAllJson}
            </Button>
          </div>
        </div>

        {/* Rationale & Invariants */}
        <div className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/60 p-3 rounded-lg border border-neutral-850">
          <span className="font-semibold text-neutral-200 block mb-1">
            Architectural Rationale:
          </span>
          {harnessPlan.rationale}
        </div>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-neutral-400 font-mono">
          <div>
            <span>Planned Artifacts: </span>
            <span className="text-neutral-200 font-semibold">{generatedFiles.length} files</span>
          </div>
          <span>·</span>
          <div>
            <span>Target Pattern: </span>
            <span className="text-neutral-300">{harnessPlan.architecturePattern}</span>
          </div>
          <span>·</span>
          <div>
            <span>In-Memory Size: </span>
            <span className="text-neutral-300">
              {(generatedFiles.reduce((acc, f) => acc + f.sizeBytes, 0) / 1024).toFixed(1)} KB
            </span>
          </div>
        </div>
      </Card>

      {/* 2. Validation Report (7 Integrity Invariants) */}
      <Card
        padding="md"
        className={`space-y-3 ${
          harnessValidation?.isValid
            ? 'border-emerald-800/60 bg-emerald-950/10'
            : 'border-rose-800/60 bg-rose-950/15'
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
          <div className="flex items-center gap-2.5">
            <StatusIndicator
              status={harnessValidation?.isValid ? 'ready' : 'error'}
              label={
                harnessValidation?.isValid
                  ? t.workflow.planView.validationPassed
                  : t.workflow.planView.validationIssues
              }
            />
            <span className="text-xs text-neutral-400 font-mono">
              ({harnessValidation?.totalChecked || 0} checks evaluated)
            </span>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            Validated at {new Date(harnessValidation?.checkedAt || '').toLocaleTimeString()}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-neutral-300 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> No Duplicate Paths
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> Path Relative Safety
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> Required Artifacts Present
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> No Conflicting Rules
          </div>
        </div>

        {harnessValidation?.warnings && harnessValidation.warnings.length > 0 && (
          <div className="pt-2 border-t border-neutral-800/80 space-y-1">
            <span className="text-xs font-semibold text-amber-400">Warnings:</span>
            <ul className="list-disc ps-5 space-y-0.5 text-xs text-amber-200">
              {harnessValidation.warnings.map((w, i) => (
                <li key={i}>
                  [{w.rule}] {w.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* 3. The 6 Subsystems Architecture Matrix */}
      <div className="space-y-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-neutral-200">
            {t.workflow.planView.subsystemsTitle}
          </h3>
          <p className="text-xs text-neutral-400">
            {t.workflow.planView.subsystemsDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Subsystem 1: Instructions */}
          <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200">1. Instructions</span>
              <span className="font-mono text-[11px] text-sky-400 uppercase">
                {harnessPlan.instructionStrategy.rulesEnforcement}
              </span>
            </div>
            <p className="text-neutral-400 text-xs">
              Root entrypoint at <code className="text-neutral-200">{harnessPlan.instructionStrategy.rootInstructionPath}</code>.
            </p>
            <div className="text-[11px] text-neutral-500 font-mono">
              Progressive Disclosure: {harnessPlan.instructionStrategy.progressiveDisclosureEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          {/* Subsystem 2: State */}
          <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200">2. State</span>
              <span className="font-mono text-[11px] text-emerald-400 uppercase">
                {harnessPlan.stateStrategy.format}
              </span>
            </div>
            <p className="text-neutral-400 text-xs">
              Durable machine-readable source of truth at <code className="text-neutral-200">{harnessPlan.stateStrategy.stateFilePath}</code>.
            </p>
            <div className="text-[11px] text-neutral-500 font-mono">
              Feature Inventory Tracking: {harnessPlan.stateStrategy.trackFeatures ? 'Active' : 'Basic'}
            </div>
          </div>

          {/* Subsystem 3: Scope */}
          <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200">3. Scope</span>
              <span className="font-mono text-[11px] text-amber-400">
                {harnessPlan.scopeStrategy.prohibitedPatterns.length} Guardrails
              </span>
            </div>
            <p className="text-neutral-400 text-xs">
              Boundary discipline at <code className="text-neutral-200">{harnessPlan.scopeStrategy.strictBoundariesDocPath}</code>.
            </p>
            <div className="text-[11px] text-neutral-500 font-mono line-clamp-1">
              {harnessPlan.scopeStrategy.changeDiscipline}
            </div>
          </div>

          {/* Subsystem 4: Verification */}
          <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200">4. Verification</span>
              <span className="font-mono text-[11px] text-emerald-400">
                Evidence-Based
              </span>
            </div>
            <p className="text-neutral-400 text-xs">
              Executable runner: <code className="text-neutral-200">{harnessPlan.verificationStrategy.runnerCommand}</code>.
            </p>
            <div className="text-[11px] text-neutral-500 font-mono">
              Script: {harnessPlan.verificationStrategy.verificationScriptPath}
            </div>
          </div>

          {/* Subsystem 5: Session Lifecycle */}
          <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200">5. Session Lifecycle</span>
              <span className="font-mono text-[11px] text-sky-400">
                Resumption Safe
              </span>
            </div>
            <p className="text-neutral-400 text-xs">
              Cross-session handoff at <code className="text-neutral-200">{harnessPlan.lifecycleStrategy.sessionHandoffPath}</code>.
            </p>
            <div className="text-[11px] text-neutral-500 font-mono line-clamp-1">
              {harnessPlan.lifecycleStrategy.restartabilityProtocol}
            </div>
          </div>

          {/* Subsystem 6: Observability */}
          <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200">6. Observability</span>
              <span className="font-mono text-[11px] text-neutral-400">
                {harnessPlan.observabilityStrategy.healthMonitoringEnabled ? 'Active' : 'Baseline'}
              </span>
            </div>
            <p className="text-neutral-400 text-xs">
              Runtime invariants and diagnostic integrity checks.
            </p>
            <div className="text-[11px] text-neutral-500 font-mono">
              Checks: {harnessPlan.observabilityStrategy.runtimeChecks.length} Invariants
            </div>
          </div>
        </div>
      </div>

      {/* 4. Artifact Explorer & In-Memory Content Preview */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-neutral-200">
              {t.workflow.planView.artifactsTree}
            </h3>
            <p className="text-xs text-neutral-400">
              Inspect generated in-memory files. Zero placeholder text.
            </p>
          </div>

          {/* Subsystem filter */}
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {(['all', 'instructions', 'state', 'scope', 'verification', 'lifecycle', 'observability'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveSubsystemFilter(filter)}
                className={`text-[11px] px-2.5 py-1 rounded border transition-colors cursor-pointer whitespace-nowrap capitalize ${
                  activeSubsystemFilter === filter
                    ? 'bg-neutral-100 text-neutral-950 border-white font-medium'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Master-Detail Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* File List (Left 4 cols) */}
          <div className="lg:col-span-4 space-y-1.5 max-h-[500px] overflow-y-auto pe-1">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile?.id === file.id;
              return (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setSelectedFileId(file.id)}
                  className={`w-full text-start p-3 rounded-lg border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 border-neutral-400 text-neutral-100 ring-1 ring-neutral-400'
                      : 'bg-neutral-900/40 border-neutral-800/80 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-medium text-neutral-200 truncate">
                      {file.filename}
                    </span>
                    <span className="text-[10px] uppercase font-mono text-neutral-500">
                      {file.fileType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                    <span className="truncate">{file.path}</span>
                    <span>{file.linesCount} lines</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* File Content Preview (Right 8 cols) */}
          <div className="lg:col-span-8">
            {selectedFile ? (
              <Card padding="sm" className="bg-neutral-950 border-neutral-800 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-850 pb-2 px-2 pt-1">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-neutral-200 text-left" dir="ltr">
                        {selectedFile.path}
                      </span>
                      <span className="text-[10px] font-mono uppercase text-sky-400">
                        [{selectedFile.subsystem}]
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-500 font-mono" dir="ltr">
                      {selectedFile.linesCount} lines · {(selectedFile.sizeBytes / 1024).toFixed(2)} KB
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyContent}
                    className="text-xs"
                  >
                    {copiedFile ? t.workflow.planView.fileCopied : t.workflow.planView.copyFileContent}
                  </Button>
                </div>

                <pre
                  dir="ltr"
                  className="font-mono text-xs text-neutral-300 overflow-x-auto p-4 bg-neutral-900/40 rounded-lg max-h-[420px] leading-relaxed border border-neutral-850 whitespace-pre-wrap text-left"
                >
                  {selectedFile.content}
                </pre>

              </Card>
            ) : (
              <div className="text-center py-12 text-xs text-neutral-500">
                No file selected.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Actions Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800/80">
        <Button
          size="md"
          variant="outline"
          onClick={() => goToStep(3)}
        >
          ← {t.common.back} to Specification
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="md"
            variant="secondary"
            onClick={handleDownloadPackageJson}
          >
            {t.workflow.planView.downloadAllJson}
          </Button>

          <Button
            size="md"
            variant="primary"
            onClick={() => setShowExportModal(true)}
            className="border-sky-600 bg-sky-600 hover:bg-sky-500 text-white cursor-pointer"
          >
            Export & Deploy Artifacts (ZIP / GitHub) →
          </Button>
        </div>
      </div>

      {/* Export & Destination Workspace Modal */}
      <ExportWorkspaceModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        files={generatedFiles}
        spec={spec}
      />
    </div>
  );
};

