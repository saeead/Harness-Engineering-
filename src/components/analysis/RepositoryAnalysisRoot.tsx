/**
 * Repository Intelligence & Audit Root View
 * Provides safe read-only repository inspection, 6-subsystem Harness maturity audit,
 * and 1-click remediation adoption into the Harness Generation Engine.
 */

import React, { useState } from 'react';
import { useProjectInput } from '../../state/project-input.context';
import { useI18n } from '../../i18n/i18n-context';
import { useNotification } from '../../state/notification.context';
import { Card } from '../primitives/Card';
import { Button } from '../primitives/Button';
import { StatusIndicator } from '../primitives/StatusIndicator';
import { SAFE_FIXTURES } from '../../services/analysis/safe-fixtures';
import { SubsystemType } from '../../domain/models/harness';
import { AuditDimensionStatus } from '../../domain/models/repository-analysis';

export const RepositoryAnalysisRoot: React.FC = () => {
  const {
    activeReport,
    isAnalyzingRepo,
    analyzeRepository,
    adoptRemediationPlan,
  } = useProjectInput();

  const { t } = useI18n();
  const { notifySuccess, notifyError } = useNotification();

  const [sourceType, setSourceType] = useState<'sample_fixture' | 'github_repo' | 'local_files'>('sample_fixture');
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>('express_monolith');
  const [githubInput, setGithubInput] = useState<string>('facebook/react');
  const [localInput, setLocalInput] = useState<string>(
    'package.json\nsrc/index.ts\nsrc/app.ts\nsrc/services/auth.ts\nREADME.md\n.gitignore',
  );

  const handleRunAnalysis = async () => {
    try {
      if (sourceType === 'sample_fixture') {
        const fixture = SAFE_FIXTURES.find((f) => f.id === selectedFixtureId);
        await analyzeRepository({
          sourceType: 'sample_fixture',
          sourceInput: selectedFixtureId,
        });
        notifySuccess('Analysis Complete', `Audited fixture: ${fixture?.name}`);
      } else if (sourceType === 'github_repo') {
        if (!githubInput.trim()) {
          notifyError('Input Required', 'Please enter a GitHub repository URL or slug (e.g. "owner/repo").');
          return;
        }
        await analyzeRepository({
          sourceType: 'github_repo',
          sourceInput: githubInput.trim(),
        });
        notifySuccess('Analysis Complete', `Audited GitHub repository: ${githubInput}`);
      } else if (sourceType === 'local_files') {
        const lines = localInput
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length === 0) {
          notifyError('Input Required', 'Please enter at least one file path.');
          return;
        }
        const customFiles = lines.map((p) => ({ path: p }));
        await analyzeRepository({
          sourceType: 'local_files',
          sourceInput: 'Custom Project Structure',
          customFiles,
        });
        notifySuccess('Analysis Complete', `Audited ${customFiles.length} file paths.`);
      }
    } catch (err: unknown) {
      notifyError('Analysis Error', (err as Error).message || 'Failed to analyze repository.');
    }
  };

  const handleAdoptRemediation = async () => {
    if (!activeReport) return;
    try {
      await adoptRemediationPlan(activeReport);
      notifySuccess(
        'Remediation Adopted',
        `Generated ${activeReport.remediationPlan.proposedHarnessLevel.toUpperCase()} harness for ${activeReport.sourceName}.`,
      );
    } catch (err: unknown) {
      notifyError('Adoption Error', (err as Error).message || 'Failed to adopt remediation plan.');
    }
  };

  const getStatusBadge = (status: AuditDimensionStatus) => {
    switch (status) {
      case 'present':
        return <span className="font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 text-[11px] font-semibold">✓ {t.repoAnalysis.dimensionPresent}</span>;
      case 'partial':
        return <span className="font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800 text-[11px] font-semibold">⚠ {t.repoAnalysis.dimensionPartial}</span>;
      case 'missing':
        return <span className="font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800 text-[11px] font-semibold">✕ {t.repoAnalysis.dimensionMissing}</span>;
      default:
        return <span className="font-mono text-neutral-500 text-[11px]">N/A</span>;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header & Read-Only Safety Banner */}
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
              {t.repoAnalysis.title}
            </h2>
            <span className="font-mono text-[11px] text-sky-400 bg-sky-950/50 px-2 py-0.5 rounded border border-sky-800 uppercase font-semibold">
              Read-Oriented
            </span>
          </div>
          <p className="text-sm text-neutral-400">
            {t.repoAnalysis.subtitle}
          </p>
        </div>

        <div className="p-3 bg-neutral-900/40 rounded-xl border border-neutral-800 text-xs text-neutral-400 flex items-start gap-2.5">
          <span className="text-emerald-400 text-sm font-semibold">🛡️</span>
          <p className="leading-relaxed">
            {t.repoAnalysis.readOnlyNotice}
          </p>
        </div>
      </div>

      {/* 2. Source Configuration & Scanner Controls */}
      <Card padding="md" className="space-y-5 bg-neutral-900/60 border-neutral-800">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <span className="text-sm font-semibold text-neutral-200">
            {t.repoAnalysis.scanSource}
          </span>
          {/* Source Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
            <button
              type="button"
              onClick={() => setSourceType('sample_fixture')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                sourceType === 'sample_fixture'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {t.repoAnalysis.sampleFixtures}
            </button>
            <button
              type="button"
              onClick={() => setSourceType('github_repo')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                sourceType === 'github_repo'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {t.repoAnalysis.githubRepo}
            </button>
            <button
              type="button"
              onClick={() => setSourceType('local_files')}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                sourceType === 'local_files'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {t.repoAnalysis.localFiles}
            </button>
          </div>
        </div>

        {/* Tab 1: Safe Sample Fixtures */}
        {sourceType === 'sample_fixture' && (
          <div className="space-y-3">
            <label className="text-xs font-medium text-neutral-300 block">
              {t.repoAnalysis.selectFixture}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SAFE_FIXTURES.map((fixture) => {
                const isSelected = selectedFixtureId === fixture.id;
                return (
                  <button
                    key={fixture.id}
                    type="button"
                    onClick={() => setSelectedFixtureId(fixture.id)}
                    className={`text-start p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-850 border-neutral-400 ring-1 ring-neutral-400 text-neutral-100'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-neutral-200">{fixture.name}</span>
                      <span className="font-mono text-[10px] text-neutral-500">
                        {fixture.files.length} files
                      </span>
                    </div>
                    <p className="text-neutral-400 text-[11px] leading-relaxed line-clamp-2 mb-2">
                      {fixture.description}
                    </p>
                    <span className="font-mono text-[10px] text-sky-400">
                      {fixture.expectedStack}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Public GitHub Repository */}
        {sourceType === 'github_repo' && (
          <div className="space-y-3">
            <label className="text-xs font-medium text-neutral-300 block">
              GitHub Repository Slug or URL (Public)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={githubInput}
                onChange={(e) => setGithubInput(e.target.value)}
                placeholder="e.g. facebook/react or https://github.com/expressjs/express"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-xs font-mono text-neutral-200 focus:outline-none focus:border-neutral-500"
              />
            </div>
            <p className="text-[11px] text-neutral-500 font-mono">
              Fetches the Git tree structure using the read-only GitHub REST API. No write permissions required.
            </p>
          </div>
        )}

        {/* Tab 3: Local Files */}
        {sourceType === 'local_files' && (
          <div className="space-y-3">
            <label className="text-xs font-medium text-neutral-300 block">
              File Paths List (one relative path per line)
            </label>
            <textarea
              rows={6}
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs font-mono text-neutral-200 focus:outline-none focus:border-neutral-500 leading-relaxed"
              placeholder="src/index.ts&#10;package.json&#10;README.md"
            />
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            size="md"
            variant="primary"
            isLoading={isAnalyzingRepo}
            onClick={handleRunAnalysis}
          >
            {isAnalyzingRepo ? t.repoAnalysis.scanning : t.repoAnalysis.scanBtn}
          </Button>
        </div>
      </Card>

      {/* 3. Analysis Findings & Audit Report */}
      {activeReport && (
        <div className="space-y-8 animate-fadeIn">
          {/* Summary & Maturity Score */}
          <Card padding="md" className="space-y-4 bg-neutral-900/60 border-neutral-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-neutral-100">
                    {activeReport.sourceName}
                  </h3>
                  <span className="font-mono text-xs uppercase font-semibold text-sky-400">
                    [{activeReport.sourceType}]
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Audited at {new Date(activeReport.analyzedAt).toLocaleTimeString()}
                </p>
              </div>

              {/* Overall Maturity Badge */}
              <div className="flex items-center gap-3 p-2 bg-neutral-950 rounded-lg border border-neutral-800">
                <div className="text-end">
                  <div className="text-[10px] uppercase font-mono text-neutral-500">
                    Harness Maturity
                  </div>
                  <div className="text-sm font-semibold font-mono text-neutral-200 capitalize">
                    {activeReport.audit.overallLevel.replace('_', ' ')} ({activeReport.audit.maturityScore}%)
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full border border-neutral-700 bg-neutral-900 flex items-center justify-center font-mono text-xs font-bold text-sky-400">
                  {activeReport.audit.maturityScore}
                </div>
              </div>
            </div>

            {/* Inventory Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-850 space-y-1">
                <span className="text-neutral-500 font-mono text-[11px] block">Primary Language</span>
                <span className="font-semibold text-neutral-200">{activeReport.inventory.detectedStack.primaryLanguage}</span>
              </div>
              <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-850 space-y-1">
                <span className="text-neutral-500 font-mono text-[11px] block">Frameworks</span>
                <span className="font-semibold text-neutral-200 truncate block">
                  {activeReport.inventory.detectedStack.frameworks.join(', ') || 'Standard / None'}
                </span>
              </div>
              <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-850 space-y-1">
                <span className="text-neutral-500 font-mono text-[11px] block">Test Suite</span>
                <span className="font-semibold text-neutral-200">
                  {activeReport.inventory.testingFiles.length > 0
                    ? `${activeReport.inventory.testingFiles.length} test files`
                    : 'None detected'}
                </span>
              </div>
              <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-850 space-y-1">
                <span className="text-neutral-500 font-mono text-[11px] block">Files / Dirs</span>
                <span className="font-semibold text-neutral-200">
                  {activeReport.inventory.totalFiles} files in {activeReport.inventory.totalDirectories} dirs
                </span>
              </div>
            </div>

            {/* Architecture Clues */}
            {activeReport.inventory.architectureClues.length > 0 && (
              <div className="text-xs text-neutral-300 p-3 bg-neutral-950/40 rounded-lg border border-neutral-850 space-y-1">
                <span className="font-semibold text-neutral-400 text-[11px] block">
                  Architecture Clues Detected:
                </span>
                <ul className="list-disc ps-4 space-y-0.5 text-neutral-300">
                  {activeReport.inventory.architectureClues.map((clue, i) => (
                    <li key={i}>{clue}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* 4. 6-Subsystem Harness Maturity Audit Matrix */}
          <div className="space-y-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-neutral-200">
                {t.repoAnalysis.auditMatrix}
              </h3>
              <p className="text-xs text-neutral-400">
                Evidence-based findings across the 6 major engineering dimensions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(
                [
                  'instructions',
                  'state',
                  'scope',
                  'verification',
                  'lifecycle',
                  'observability',
                ] as SubsystemType[]
              ).map((subKey) => {
                const dim = activeReport.audit.dimensions[subKey];
                if (!dim) return null;

                return (
                  <div
                    key={subKey}
                    className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40 text-xs space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-200">
                          {dim.dimensionName}
                        </span>
                        {getStatusBadge(dim.status)}
                      </div>

                      {/* Evidence */}
                      <div className="text-[11px] text-neutral-400 leading-relaxed">
                        <span className="text-neutral-500 font-mono block">Evidence:</span>
                        {dim.evidence.join(' ')}
                      </div>
                    </div>

                    {/* Risks if missing/partial */}
                    {dim.risksIfMissing.length > 0 && (
                      <div className="text-[10px] text-rose-300 bg-rose-950/20 p-2 rounded border border-rose-900/40 leading-snug">
                        <span className="font-semibold block text-rose-400">Operational Risk:</span>
                        {dim.risksIfMissing[0]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Actionable Remediation Plan */}
          <Card padding="md" className="space-y-4 bg-neutral-900/70 border-sky-900/60 ring-1 ring-sky-950">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-neutral-100">
                    {t.repoAnalysis.remediationTitle}
                  </h3>
                  <span className="font-mono text-xs text-sky-400 uppercase font-semibold">
                    [Proposed: {activeReport.remediationPlan.proposedHarnessLevel.toUpperCase()}]
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  {activeReport.remediationPlan.remediationRationale}
                </p>
              </div>

              {/* 1-Click Adopt Button */}
              <Button
                size="md"
                variant="primary"
                onClick={handleAdoptRemediation}
              >
                {t.repoAnalysis.adoptRemediation} →
              </Button>
            </div>

            {/* Recommended Additions Table */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-300 block">
                Target Artifacts to Generate ({activeReport.remediationPlan.recommendedAdditions.length}):
              </span>
              <div className="space-y-1.5">
                {activeReport.remediationPlan.recommendedAdditions.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg border border-neutral-800/80 bg-neutral-950/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-neutral-200">
                          {item.path}
                        </span>
                        <span className="text-[10px] font-mono text-sky-400 uppercase">
                          [{item.subsystem}]
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded ${
                            item.priority === 'high'
                              ? 'text-rose-400 bg-rose-950/60 border border-rose-900/60'
                              : 'text-amber-400 bg-amber-950/60 border border-amber-900/60'
                          }`}
                        >
                          {item.priority} priority
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-snug">
                        {item.purpose}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
