/**
 * Step 8: Export Destination & Repository Integration
 * Guided step allowing the user to export the generated engineering harness via:
 * 1. ZIP Archive (one-click download)
 * 2. Local Directory Bundle (File System Access API)
 * 3. GitHub Repository (Direct commit or new branch with pre-commit change preview)
 */

import React, { useState, useEffect } from 'react';
import { useProjectInput } from '../../state/project-input.context';
import { useNotification } from '../../state/notification.context';
import { useI18n } from '../../i18n/i18n-context';
import { CredentialManager } from '../../config/provider-config';
import { exporterRegistry } from '../../services/providers/exporter/exporter.registry';
import {
  GitHubRepositoryProvider,
  GitHubAuthDetails,
  GitHubRepoSummary,
} from '../../services/providers/repository/github-repository.provider';
import {
  ChangePreviewReport,
  ConflictResolution,
} from '../../domain/models/change-preview';
import { ExportResult } from '../../domain/models';
import { Card } from '../primitives/Card';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';

const gitHubProvider = new GitHubRepositoryProvider();

export const Step8ExportDestination: React.FC = () => {
  const { generatedFiles, spec } = useProjectInput();
  const { notifySuccess, notifyError, notifyWarning } = useNotification();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<'zip' | 'local_fs' | 'github'>('zip');

  // ZIP state
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [zipResult, setZipResult] = useState<ExportResult | null>(null);

  // Local Directory state
  const [isExportingLocal, setIsExportingLocal] = useState(false);
  const [localResult, setLocalResult] = useState<ExportResult | null>(null);

  // GitHub state
  const [githubToken, setGithubToken] = useState(() => CredentialManager.getRepoToken('github') || '');
  const [isTestingGitHub, setIsTestingGitHub] = useState(false);
  const [authDetails, setAuthDetails] = useState<GitHubAuthDetails | null>(null);
  const [userRepos, setUserRepos] = useState<GitHubRepoSummary[]>([]);
  const [selectedRepoSlug, setSelectedRepoSlug] = useState('');
  const [targetBranch, setTargetBranch] = useState('harness-foundation');
  const [createBranchIfNeeded, setCreateBranchIfNeeded] = useState(true);
  const [commitMessage, setCommitMessage] = useState(
    `feat: generate AI agent harness foundation\n\nAutomated AI harness generated for ${spec.name || 'project'}.`,
  );

  // GitHub Change Preview & Execution
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewReport, setPreviewReport] = useState<ChangePreviewReport | null>(null);
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, ConflictResolution>>({});
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<ExportResult | null>(null);

  const artifacts = generatedFiles.map((f) => ({
    path: f.path,
    content: f.content,
    isExecutable: f.isExecutable,
  }));

  // Auto-test token if already saved
  useEffect(() => {
    if (githubToken && !authDetails && !isTestingGitHub) {
      handleTestGitHubConnection(githubToken);
    }
  }, [githubToken]);

  // ZIP Export Handler
  const handleExportZip = async () => {
    try {
      setIsExportingZip(true);
      const zipExporter = exporterRegistry.get('zip');
      if (!zipExporter) throw new Error('ZIP exporter is not registered.');

      const result = await zipExporter.export(artifacts, {
        format: 'zip',
        destinationPath: spec.name || 'harness-project',
      });

      setZipResult(result);
      if (result.success) {
        notifySuccess(t.common.success, t.export.zip.successNotice);
      } else {
        notifyError(t.common.error, result.error || 'ZIP export failed.');
      }
    } catch (err: unknown) {
      notifyError(t.common.error, (err as Error).message || 'Failed to export ZIP.');
    } finally {
      setIsExportingZip(false);
    }
  };

  // Local Directory Export Handler
  const handleExportLocal = async () => {
    try {
      setIsExportingLocal(true);
      const localExporter = exporterRegistry.get('directory_bundle');
      if (!localExporter) throw new Error('Local directory exporter is not registered.');

      const result = await localExporter.export(artifacts, {
        format: 'directory_bundle',
        destinationPath: spec.name || 'harness-project',
      });

      setLocalResult(result);
      if (result.success) {
        notifySuccess(t.common.success, t.export.localFs.successNotice);
      } else if (result.error?.includes('cancelled')) {
        notifyWarning(t.common.warning, 'Export cancelled.');
      } else {
        notifyError(t.common.error, result.error || 'Local export failed.');
      }
    } catch (err: unknown) {
      notifyError(t.common.error, (err as Error).message || 'Failed to write files to disk.');
    } finally {
      setIsExportingLocal(false);
    }
  };

  // GitHub Test & Repo Loading
  const handleTestGitHubConnection = async (tokenToTest: string) => {
    const token = tokenToTest.trim();
    if (!token) {
      notifyWarning(t.common.warning, t.settings.github.tokenPlaceholder);
      return;
    }

    try {
      setIsTestingGitHub(true);
      const testRes = await gitHubProvider.testConnection(token);
      if (testRes.success && testRes.auth) {
        setAuthDetails(testRes.auth);
        gitHubProvider.saveToken(token);

        const repos = await gitHubProvider.listUserRepositories();
        setUserRepos(repos);
        if (repos.length > 0 && !selectedRepoSlug) {
          setSelectedRepoSlug(repos[0].fullName);
        }
        notifySuccess(t.common.success, `${t.settings.github.userLabel}: @${testRes.auth.login}`);
      } else {
        setAuthDetails(null);
        notifyError(t.common.error, testRes.error || t.settings.github.connectionError);
      }
    } catch (err: unknown) {
      notifyError(t.common.error, (err as Error).message || t.settings.github.connectionError);
    } finally {
      setIsTestingGitHub(false);
    }
  };

  // Pre-commit Preview
  const handleGeneratePreview = async () => {
    if (!selectedRepoSlug || !githubToken) {
      notifyWarning(t.common.warning, t.export.github.selectRepoPlaceholder);
      return;
    }

    const [owner, repo] = selectedRepoSlug.split('/');
    try {
      setIsPreviewing(true);
      const preview = await gitHubProvider.generateChangePreview(
        {
          format: 'github_direct',
          repoOwner: owner,
          repoName: repo,
          branchName: targetBranch || 'main',
        },
        artifacts,
      );

      setPreviewReport(preview);

      const initResolutions: Record<string, ConflictResolution> = {};
      preview.conflicts.forEach((c) => {
        initResolutions[c.path] = c.conflictResolution || 'preserve';
      });
      preview.filesToModify.forEach((m) => {
        initResolutions[m.path] = m.conflictResolution || 'overwrite';
      });
      setConflictResolutions(initResolutions);

      notifySuccess(t.common.success, `${artifacts.length} files reviewed against branch.`);
    } catch (err: unknown) {
      notifyError(t.common.error, (err as Error).message || 'Failed to generate change preview.');
    } finally {
      setIsPreviewing(false);
    }
  };

  // GitHub Commit
  const handleCommitToGitHub = async () => {
    if (!selectedRepoSlug || !githubToken || !previewReport) return;
    if (!userConfirmed) {
      notifyWarning(t.common.warning, t.export.github.confirmCheckboxLabel);
      return;
    }

    try {
      setIsCommitting(true);
      const allChanges = [
        ...previewReport.filesToCreate,
        ...previewReport.filesToModify.map((m) => ({
          ...m,
          conflictResolution: conflictResolutions[m.path] || m.conflictResolution,
        })),
        ...previewReport.conflicts.map((c) => ({
          ...c,
          conflictResolution: conflictResolutions[c.path] || c.conflictResolution,
        })),
      ];

      const result = await gitHubProvider.executeCommit({
        repoOwner: previewReport.repoOwner,
        repoName: previewReport.repoName,
        branchName: previewReport.targetBranch,
        commitMessage,
        changes: allChanges,
        createBranchIfMissing: createBranchIfNeeded,
        userConfirmed: true,
      });

      setCommitResult(result);
      if (result.success) {
        notifySuccess(t.common.success, t.export.github.commitSuccessNotice);
      } else {
        notifyError(t.common.error, result.error || 'Commit failed.');
      }
    } catch (err: unknown) {
      notifyError(t.common.error, (err as Error).message || 'Commit execution failed.');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Step Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span className="text-sky-400 font-semibold">{t.common.step} 08</span>
          <span aria-hidden="true">/</span>
          <span>{t.wizard.stepList[8].title}</span>
        </div>
        <h2 className="text-xl font-bold text-neutral-100 sm:text-2xl">
          {t.wizard.stepList[8].title}
        </h2>
        <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
          {t.wizard.stepList[8].desc}
        </p>
      </div>

      {/* Destination Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
        <button
          onClick={() => setActiveTab('zip')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'zip'
              ? 'bg-neutral-800 text-neutral-100 font-semibold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {t.export.zip.tabTitle}
        </button>
        <button
          onClick={() => setActiveTab('local_fs')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'local_fs'
              ? 'bg-neutral-800 text-neutral-100 font-semibold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {t.export.localFs.tabTitle}
        </button>
        <button
          onClick={() => setActiveTab('github')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'github'
              ? 'bg-neutral-800 text-neutral-100 font-semibold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {t.export.github.tabTitle}
        </button>
      </div>

      {/* TAB 1: ZIP EXPORT */}
      {activeTab === 'zip' && (
        <Card padding="md" className="space-y-4 bg-neutral-900/40 border-neutral-800">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-neutral-200">
              {t.export.zip.title}
            </h3>
            <p className="text-xs text-neutral-400">
              {t.export.zip.desc}
            </p>
          </div>

          <div className="p-3 bg-neutral-950/60 border border-neutral-850 rounded-lg text-xs font-mono text-neutral-300">
            <span>{generatedFiles.length} files will be bundled into {spec.name || 'harness-project'}.zip</span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              size="md"
              variant="primary"
              isLoading={isExportingZip}
              onClick={handleExportZip}
              className="cursor-pointer bg-sky-600 hover:bg-sky-500 text-white"
            >
              {isExportingZip ? t.export.zip.downloadingBtn : t.export.zip.downloadBtn}
            </Button>
          </div>

          {zipResult && zipResult.success && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs">
              ✓ {t.export.zip.successNotice} ({zipResult.exportedFilesCount} files)
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: LOCAL DIRECTORY EXPORT */}
      {activeTab === 'local_fs' && (
        <Card padding="md" className="space-y-4 bg-neutral-900/40 border-neutral-800">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-neutral-200">
              {t.export.localFs.title}
            </h3>
            <p className="text-xs text-neutral-400">
              {t.export.localFs.desc}
            </p>
          </div>

          <div className="p-3 bg-neutral-950/60 border border-neutral-850 rounded-lg text-xs text-neutral-400">
            {t.export.localFs.browserSupportNotice}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              size="md"
              variant="primary"
              isLoading={isExportingLocal}
              onClick={handleExportLocal}
              className="cursor-pointer bg-sky-600 hover:bg-sky-500 text-white"
            >
              {isExportingLocal ? t.export.localFs.exportingBtn : t.export.localFs.selectDirBtn}
            </Button>
          </div>

          {localResult && localResult.success && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs">
              ✓ {t.export.localFs.successNotice} ({localResult.exportedFilesCount} files)
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: GITHUB INTEGRATION */}
      {activeTab === 'github' && (
        <Card padding="md" className="space-y-6 bg-neutral-900/40 border-neutral-800">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-neutral-200">
              {t.export.github.title}
            </h3>
            <p className="text-xs text-neutral-400">
              {t.export.github.desc}
            </p>
          </div>

          {/* Token Authentication */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-300">
              {t.settings.github.tokenLabel}
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder={t.settings.github.tokenPlaceholder}
                className="font-mono text-xs flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                isLoading={isTestingGitHub}
                onClick={() => handleTestGitHubConnection(githubToken)}
              >
                {t.settings.github.testGithubBtn}
              </Button>
            </div>
          </div>

          {authDetails && (
            <div className="p-3 rounded-lg bg-neutral-950/80 border border-neutral-850 space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-semibold">@{authDetails.login}</span>
                <span className="text-neutral-500">
                  Rate Limit: {authDetails.rateLimit.remaining} / {authDetails.rateLimit.limit}
                </span>
              </div>
            </div>
          )}

          {/* Repo & Branch Selection */}
          {authDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  {t.export.github.repoSelectLabel}
                </label>
                {userRepos.length > 0 ? (
                  <select
                    value={selectedRepoSlug}
                    onChange={(e) => setSelectedRepoSlug(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs font-mono"
                  >
                    {userRepos.map((r) => (
                      <option key={r.id} value={r.fullName}>
                        {r.fullName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={selectedRepoSlug}
                    onChange={(e) => setSelectedRepoSlug(e.target.value)}
                    placeholder="owner/repo-name"
                    className="font-mono text-xs"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  {t.export.github.branchLabel}
                </label>
                <Input
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  placeholder="harness-foundation"
                  className="font-mono text-xs"
                />
              </div>
            </div>
          )}

          {/* Commit Message & Action */}
          {authDetails && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  {t.export.github.commitMessageLabel}
                </label>
                <textarea
                  rows={2}
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="createBranchCheckbox"
                  checked={createBranchIfNeeded}
                  onChange={(e) => setCreateBranchIfNeeded(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <label htmlFor="createBranchCheckbox" className="text-xs text-neutral-400 cursor-pointer">
                  {t.export.github.createNewBranchCheckbox}
                </label>
              </div>

              <Button
                size="md"
                variant="outline"
                isLoading={isPreviewing}
                onClick={handleGeneratePreview}
                className="cursor-pointer"
              >
                {isPreviewing ? t.export.github.previewDiffBtn : t.export.github.previewDiffBtn}
              </Button>
            </div>
          )}

          {/* Change Preview Table */}
          {previewReport && (
            <div className="space-y-4 pt-4 border-t border-neutral-800">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                {t.export.github.changePreviewTitle} ({previewReport.filesToCreate.length + previewReport.filesToModify.length + previewReport.conflicts.length} files)
              </h4>

              <div className="border border-neutral-800 rounded-lg overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-neutral-950 text-neutral-400 font-mono text-[11px] border-b border-neutral-800">
                    <tr>
                      <th className="p-2.5 text-start">{t.export.github.pathCol}</th>
                      <th className="p-2.5 text-start">{t.export.github.statusCol}</th>
                      <th className="p-2.5 text-start">{t.export.github.actionCol}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850 font-mono text-[11px]">
                    {previewReport.filesToCreate.map((f) => (
                      <tr key={f.path} className="hover:bg-neutral-900/40">
                        <td className="p-2.5 text-neutral-200 font-semibold">{f.path}</td>
                        <td className="p-2.5 text-emerald-400">create</td>
                        <td className="p-2.5 text-neutral-400">new file</td>
                      </tr>
                    ))}
                    {previewReport.filesToModify.map((m) => (
                      <tr key={m.path} className="hover:bg-neutral-900/40">
                        <td className="p-2.5 text-neutral-200 font-semibold">{m.path}</td>
                        <td className="p-2.5 text-sky-400">modify</td>
                        <td className="p-2.5 text-neutral-400">update existing</td>
                      </tr>
                    ))}
                    {previewReport.conflicts.map((c) => (
                      <tr key={c.path} className="hover:bg-neutral-900/40">
                        <td className="p-2.5 text-neutral-200 font-semibold">{c.path}</td>
                        <td className="p-2.5 text-amber-400">conflict</td>
                        <td className="p-2.5">
                          <select
                            value={conflictResolutions[c.path] || 'preserve'}
                            onChange={(e) =>
                              setConflictResolutions({
                                ...conflictResolutions,
                                [c.path]: e.target.value as ConflictResolution,
                              })
                            }
                            className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[11px] text-neutral-200"
                          >
                            <option value="preserve">{t.export.github.resolutionKeep}</option>
                            <option value="overwrite">{t.export.github.resolutionOverwrite}</option>
                            <option value="suffix">{t.export.github.resolutionRename}</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Confirmation & Commit Button */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-850 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="userConfirmCheckbox"
                    checked={userConfirmed}
                    onChange={(e) => setUserConfirmed(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <label htmlFor="userConfirmCheckbox" className="text-xs text-neutral-300 cursor-pointer">
                    {t.export.github.confirmCheckboxLabel}
                  </label>
                </div>

                <Button
                  size="md"
                  variant="primary"
                  disabled={!userConfirmed}
                  isLoading={isCommitting}
                  onClick={handleCommitToGitHub}
                  className="cursor-pointer bg-sky-600 hover:bg-sky-500 text-white"
                >
                  {isCommitting ? t.export.github.committingBtn : t.export.github.commitBtn}
                </Button>
              </div>
            </div>
          )}

          {commitResult && commitResult.success && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs space-y-2">
              <p className="font-semibold">✓ {t.export.github.commitSuccessNotice}</p>
              {commitResult.repositoryUrl && (
                <a
                  href={commitResult.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sky-400 hover:underline"
                >
                  {t.export.github.viewOnGithubBtn}
                </a>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
