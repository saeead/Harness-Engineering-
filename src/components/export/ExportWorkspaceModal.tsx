/**
 * Export & Destination Workspace Modal
 * Connects generated Harness structures to real project destinations:
 * 1. ZIP Archive (.zip) with directory hierarchy preservation
 * 2. Local Directory export via File System Access API
 * 3. GitHub direct commit with Change Preview, Conflict Resolution, and Explicit Confirmation
 */

import React, { useState, useEffect } from 'react';
import { GeneratedFile, ProjectSpecification, ExportResult } from '../../domain/models';
import { ChangePreviewReport, ConflictResolution } from '../../domain/models/change-preview';
import { repositoryProviderRegistry } from '../../services/providers/repository/repository-provider.registry';
import { GitHubRepositoryProvider, GitHubAuthDetails, GitHubRepoSummary } from '../../services/providers/repository/github-repository.provider';
import { exporterRegistry } from '../../services/providers/exporter/exporter.registry';
import { LocalDirectoryExporter } from '../../services/providers/exporter/local-directory-exporter';
import { CredentialManager } from '../../config/provider-config';
import { useNotification } from '../../state/notification.context';
import { useI18n } from '../../i18n/i18n-context';
import { Button } from '../primitives/Button';
import { Card } from '../primitives/Card';
import { Input } from '../primitives/Input';
import { StatusIndicator } from '../primitives/StatusIndicator';

interface ExportWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: GeneratedFile[];
  spec: ProjectSpecification;
}

type ExportTab = 'zip' | 'local_fs' | 'github';

export const ExportWorkspaceModal: React.FC<ExportWorkspaceModalProps> = ({
  isOpen,
  onClose,
  files,
  spec,
}) => {
  const { t } = useI18n();
  const { notifySuccess, notifyError, notifyWarning } = useNotification();
  const [activeTab, setActiveTab] = useState<ExportTab>('zip');

  // ZIP / Local State
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isExportingLocal, setIsExportingLocal] = useState(false);
  const [zipResult, setZipResult] = useState<ExportResult | null>(null);
  const [localResult, setLocalResult] = useState<ExportResult | null>(null);

  // GitHub Provider State
  const gitHubProvider = repositoryProviderRegistry.get('github') as GitHubRepositoryProvider;
  const [githubToken, setGithubToken] = useState<string>(() => CredentialManager.getRepoToken('github') || '');
  const [showToken, setShowToken] = useState(false);
  const [isTestingGitHub, setIsTestingGitHub] = useState(false);
  const [authDetails, setAuthDetails] = useState<GitHubAuthDetails | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Repository Selection State
  const [userRepos, setUserRepos] = useState<GitHubRepoSummary[]>([]);
  const [selectedRepoSlug, setSelectedRepoSlug] = useState<string>('');
  const [targetBranch, setTargetBranch] = useState<string>('harness-foundation');
  const [createBranch, setCreateBranch] = useState<boolean>(true);
  const [commitMessage, setCommitMessage] = useState<string>(
    `feat: generate engineering harness structure\n\nAutomated AI harness generated for ${spec.name}.`,
  );

  // Change Preview State
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewReport, setPreviewReport] = useState<ChangePreviewReport | null>(null);
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, ConflictResolution>>({});
  const [userConfirmed, setUserConfirmed] = useState(false);

  // Commit Execution State
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<ExportResult | null>(null);

  // Test token on modal open if token exists
  useEffect(() => {
    if (isOpen && githubToken && !authDetails && !isTestingGitHub) {
      handleTestGitHubConnection(githubToken);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);


  if (!isOpen) return null;

  // --- TAB 1: ZIP EXPORT ---
  const handleExportZip = async () => {
    setIsExportingZip(true);
    setZipResult(null);
    try {
      const zipExporter = exporterRegistry.get('zip');
      if (!zipExporter) throw new Error('ZIP Exporter not registered.');

      const artifacts = files.map((f) => ({
        path: f.path,
        content: f.content,
        isExecutable: f.isExecutable,
      }));

      const res = await zipExporter.export(artifacts, {
        format: 'zip',
        destinationPath: spec.name || 'harness-project',
      });

      setZipResult(res);
      if (res.success) {
        notifySuccess('ZIP Archive Ready', `Generated archive with ${res.exportedFilesCount} files.`);
      } else {
        notifyError('Export Failed', res.error || 'Failed to generate ZIP.');
      }
    } catch (err: unknown) {
      notifyError('Export Error', (err as Error).message);
    } finally {
      setIsExportingZip(false);
    }
  };

  // --- TAB 2: LOCAL DIRECTORY EXPORT ---
  const handleExportLocal = async () => {
    setIsExportingLocal(true);
    setLocalResult(null);
    try {
      const localExporter = exporterRegistry.get('directory_bundle');
      if (!localExporter) throw new Error('Local Directory Exporter not registered.');

      const artifacts = files.map((f) => ({
        path: f.path,
        content: f.content,
        isExecutable: f.isExecutable,
      }));

      const res = await localExporter.export(artifacts, {
        format: 'directory_bundle',
        destinationPath: spec.name,
      });

      setLocalResult(res);
      if (res.success) {
        notifySuccess('Export Complete', `Written ${res.exportedFilesCount} files to chosen folder.`);
      } else if (res.error?.includes('cancelled')) {
        notifyWarning('Cancelled', 'Local directory selection was cancelled.');
      } else {
        notifyError('Export Failed', res.error || 'Could not write to local folder.');
      }
    } catch (err: unknown) {
      notifyError('Local Export Error', (err as Error).message);
    } finally {
      setIsExportingLocal(false);
    }
  };

  // --- TAB 3: GITHUB INTEGRATION ---
  const handleTestGitHubConnection = async (tokenToTest?: string) => {
    const token = tokenToTest ?? githubToken;
    if (!token.trim()) {
      notifyError('Token Missing', 'Please enter a GitHub Personal Access Token.');
      return;
    }

    setIsTestingGitHub(true);
    setAuthError(null);
    try {
      const testRes = await gitHubProvider.testConnection(token.trim());
      if (testRes.success && testRes.auth) {
        setAuthDetails(testRes.auth);
        notifySuccess('GitHub Connected', `Authenticated as @${testRes.auth.login} (${testRes.latencyMs}ms)`);
        
        // Fetch repositories list
        const repos = await gitHubProvider.listUserRepositories();
        setUserRepos(repos);
        if (repos.length > 0 && !selectedRepoSlug) {
          setSelectedRepoSlug(repos[0].fullName);
        }
      } else {
        setAuthDetails(null);
        setAuthError(testRes.error || 'Authentication failed.');
        notifyError('GitHub Error', testRes.error || 'Authentication failed.');
      }
    } catch (err: unknown) {
      setAuthError((err as Error).message);
      notifyError('Connection Error', (err as Error).message);
    } finally {
      setIsTestingGitHub(false);
    }
  };

  const handleClearGitHubCredentials = () => {
    gitHubProvider.clearToken();
    setGithubToken('');
    setAuthDetails(null);
    setUserRepos([]);
    setSelectedRepoSlug('');
    setPreviewReport(null);
    setCommitResult(null);
    setUserConfirmed(false);
    notifySuccess('Cleared', 'GitHub token removed from session.');
  };

  const handleGeneratePreview = async () => {
    if (!selectedRepoSlug) {
      notifyError('Repository Required', 'Please select or enter a repository (owner/repo).');
      return;
    }

    const [owner, repo] = selectedRepoSlug.split('/');
    if (!owner || !repo) {
      notifyError('Invalid Format', 'Repository must be in "owner/repo" format.');
      return;
    }

    setIsPreviewing(true);
    setPreviewReport(null);
    setCommitResult(null);
    setUserConfirmed(false);

    try {
      const artifacts = files.map((f) => ({
        path: f.path,
        content: f.content,
        isExecutable: f.isExecutable,
      }));

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

      // Initialize default resolutions
      const initResolutions: Record<string, ConflictResolution> = {};
      preview.conflicts.forEach((c) => {
        initResolutions[c.path] = c.conflictResolution || 'preserve';
      });
      preview.filesToModify.forEach((m) => {
        initResolutions[m.path] = m.conflictResolution || 'overwrite';
      });
      setConflictResolutions(initResolutions);

      notifySuccess('Change Preview Ready', `Evaluated ${artifacts.length} planned files against branch.`);
    } catch (err: unknown) {
      notifyError('Preview Failed', (err as Error).message);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleResolutionChange = (path: string, resolution: ConflictResolution) => {
    setConflictResolutions((prev) => ({
      ...prev,
      [path]: resolution,
    }));
  };

  const handleExecuteCommit = async () => {
    if (!previewReport) return;
    if (!userConfirmed) {
      notifyError('Confirmation Required', 'You must review and check the confirmation box before writing.');
      return;
    }

    setIsCommitting(true);
    setCommitResult(null);

    try {
      // Map plans with user-chosen conflict resolutions
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

      const res = await gitHubProvider.executeCommit({
        repoOwner: previewReport.repoOwner,
        repoName: previewReport.repoName,
        branchName: previewReport.targetBranch,
        createBranchIfMissing: previewReport.isNewBranch || createBranch,
        commitMessage,
        changes: allChanges,
        userConfirmed: true,
      });

      setCommitResult(res);

      if (res.success) {
        notifySuccess('Push Succeeded!', `Committed ${res.exportedFilesCount} files to ${previewReport.targetBranch}.`);
      } else {
        notifyError('Commit Failed', res.error || 'Failed to execute commit.');
      }
    } catch (err: unknown) {
      notifyError('Execution Error', (err as Error).message);
    } finally {
      setIsCommitting(false);
    }
  };

  const isLocalSupported = LocalDirectoryExporter.isFileSystemAccessSupported();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60 rounded-t-2xl">
          <div className="space-y-0.5">
            <h2 id="export-modal-title" className="text-base font-semibold text-neutral-100 flex items-center gap-2">
              <span>Export & Push Harness Artifacts</span>
              <span className="text-neutral-500 font-normal" aria-hidden="true">·</span>
              <span className="text-xs font-mono text-neutral-400">
                {files.length} Files Ready
              </span>
            </h2>

            <p className="text-xs text-neutral-400">
              Download bundle locally or preview and commit directly to GitHub repository.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 text-sm transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Export Destination Tabs */}
        <div className="flex items-center border-b border-neutral-800 bg-neutral-950/40 px-6 gap-2">
          <button
            onClick={() => setActiveTab('zip')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'zip'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            ZIP Archive Package (.zip)
          </button>
          <button
            onClick={() => setActiveTab('local_fs')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'local_fs'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Local Folder (File System Access)
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'github'
                ? 'border-sky-500 text-sky-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>GitHub Repository</span>
            {authDetails && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: ZIP ARCHIVE */}
          {activeTab === 'zip' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-200 text-sm">Download Complete ZIP Archive</span>
                  <span className="font-mono text-neutral-400">{files.length} artifacts</span>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  Generates an unencrypted, standards-compliant ZIP archive with exact directory structures,
                  executable permissions (e.g. <code className="text-neutral-300">verify.sh</code>), and metadata.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-neutral-400">
                  <span className="bg-neutral-800/80 px-2 py-0.5 rounded">.harness/state/</span>
                  <span className="bg-neutral-800/80 px-2 py-0.5 rounded">docs/</span>
                  <span className="bg-neutral-800/80 px-2 py-0.5 rounded">scripts/</span>
                  <span className="bg-neutral-800/80 px-2 py-0.5 rounded">AGENT.md</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-neutral-500 font-mono">
                  Preserves relative paths · Client-side binary generation
                </span>
                <Button
                  size="md"
                  variant="primary"
                  isLoading={isExportingZip}
                  onClick={handleExportZip}
                  className="cursor-pointer"
                >
                  Generate & Download ZIP Archive (.zip)
                </Button>
              </div>

              {zipResult && (
                <div
                  className={`p-4 rounded-xl border ${
                    zipResult.success
                      ? 'border-emerald-800/80 bg-emerald-950/20 text-emerald-300'
                      : 'border-rose-800/80 bg-rose-950/20 text-rose-300'
                  }`}
                >
                  {zipResult.success ? (
                    <div className="space-y-1">
                      <p className="font-semibold">ZIP Archive downloaded successfully!</p>
                      <p className="text-neutral-400">
                        Packed {zipResult.exportedFilesCount} files ready for unzipping in any codebase.
                      </p>
                    </div>
                  ) : (
                    <p className="font-semibold">Error: {zipResult.error}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LOCAL DIRECTORY EXPORT */}
          {activeTab === 'local_fs' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-200 text-sm">Write Directly to Local Directory</span>
                  <StatusIndicator
                    status={isLocalSupported ? 'ready' : 'offline'}
                    label={isLocalSupported ? 'Browser Supported' : 'API Unavailable'}
                  />
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  Uses the File System Access API to let you select a folder on your computer and writes the full
                  Harness structure directly to disk without uploading to any remote server.
                </p>

                {!isLocalSupported && (
                  <div className="p-3 bg-amber-950/30 border border-amber-800/80 rounded-lg text-amber-200 space-y-1">
                    <p className="font-semibold">Browser Notice</p>
                    <p className="text-xs">
                      The File System Access API is not enabled in this browser (common in Firefox/Safari).
                      Please switch to the <strong>ZIP Archive</strong> tab to download your files with 1 click.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-neutral-500 font-mono">
                  {isLocalSupported ? 'Prompt will open system folder picker' : 'Fallback: use ZIP tab'}
                </span>
                <Button
                  size="md"
                  variant="primary"
                  isLoading={isExportingLocal}
                  disabled={!isLocalSupported}
                  onClick={handleExportLocal}
                  className="cursor-pointer"
                >
                  Select Folder & Write Files
                </Button>
              </div>

              {localResult && (
                <div
                  className={`p-4 rounded-xl border ${
                    localResult.success
                      ? 'border-emerald-800/80 bg-emerald-950/20 text-emerald-300'
                      : 'border-rose-800/80 bg-rose-950/20 text-rose-300'
                  }`}
                >
                  {localResult.success ? (
                    <div className="space-y-1">
                      <p className="font-semibold">Local export completed successfully!</p>
                      <p className="text-neutral-400">
                        {localResult.exportedFilesCount} files written to{' '}
                        <code className="text-neutral-200 font-mono">{localResult.destinationPath || 'chosen folder'}</code>.
                      </p>
                    </div>
                  ) : (
                    <p className="font-semibold">{localResult.error}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GITHUB INTEGRATION */}
          {activeTab === 'github' && (
            <div className="space-y-6">
              {/* Step 3.1: Token & Connection */}
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-850 pb-3">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-neutral-200 text-sm">1. GitHub Authentication</span>
                    <p className="text-neutral-400 text-xs">
                      Requires Personal Access Token (classic with <code className="text-neutral-300">repo</code> scope or fine-grained with <code className="text-neutral-300">Contents: Read & Write</code>).
                    </p>
                  </div>
                  {authDetails && (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-400 text-xs">@{authDetails.login}</span>
                      <Button size="sm" variant="ghost" onClick={handleClearGitHubCredentials}>
                        Disconnect
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                      <span>Personal Access Token (PAT)</span>
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="text-neutral-500 hover:text-neutral-300 underline cursor-pointer"
                      >
                        {showToken ? 'Hide' : 'Reveal'}
                      </button>
                    </label>
                    <Input
                      type={showToken ? 'text' : 'password'}
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxx"
                      className="font-mono text-xs"
                    />
                  </div>
                  <Button
                    size="md"
                    variant="outline"
                    isLoading={isTestingGitHub}
                    onClick={() => handleTestGitHubConnection()}
                    className="cursor-pointer"
                  >
                    Test Connection
                  </Button>
                </div>

                {authDetails && (
                  <div className="pt-2 border-t border-neutral-850 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Authenticated User: <strong className="text-neutral-200">@{authDetails.login}</strong></span>
                    </div>
                    <div>
                      <span>Rate Limit: <strong className="text-neutral-200">{authDetails.rateLimit.remaining} / {authDetails.rateLimit.limit}</strong></span>
                    </div>
                    <div>
                      <span>Scopes: <strong className="text-neutral-200 font-mono">{authDetails.scopes.join(', ') || 'Fine-grained PAT'}</strong></span>
                    </div>
                  </div>
                )}

                {authError && (
                  <p className="text-rose-400 text-xs font-mono">{authError}</p>
                )}
              </div>

              {/* Step 3.2: Destination Repo & Branch */}
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 space-y-4">
                <span className="font-semibold text-neutral-200 text-sm">2. Destination Repository & Target Branch</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-neutral-400">Target Repository (owner/repo)</label>
                    {userRepos.length > 0 ? (
                      <select
                        value={selectedRepoSlug}
                        onChange={(e) => setSelectedRepoSlug(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none focus:border-sky-500"
                      >
                        {userRepos.map((r) => (
                          <option key={r.id} value={r.fullName}>
                            {r.fullName} ({r.defaultBranch})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        value={selectedRepoSlug}
                        onChange={(e) => setSelectedRepoSlug(e.target.value)}
                        placeholder="e.g. acme-org/my-service"
                        className="font-mono text-xs"
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-neutral-400">Target Branch</label>
                    <Input
                      value={targetBranch}
                      onChange={(e) => setTargetBranch(e.target.value)}
                      placeholder="e.g. harness-foundation or main"
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-neutral-400">Commit Message</label>
                  <Input
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="feat: scaffold engineering harness"
                    className="font-mono text-xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                    <input
                      type="checkbox"
                      checked={createBranch}
                      onChange={(e) => setCreateBranch(e.target.checked)}
                      className="rounded bg-neutral-800 border-neutral-700 text-sky-500"
                    />
                    <span>Create new branch if it does not exist</span>
                  </label>

                  <Button
                    size="sm"
                    variant="secondary"
                    isLoading={isPreviewing}
                    disabled={!selectedRepoSlug || !githubToken}
                    onClick={handleGeneratePreview}
                    className="cursor-pointer"
                  >
                    Inspect & Preview Changes →
                  </Button>
                </div>
              </div>

              {/* Step 3.3: Change Preview & Conflict Resolution Matrix */}
              {previewReport && (
                <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-neutral-100 text-sm">3. Change Preview & Safety Audit</span>
                      <p className="text-neutral-400 text-xs">
                        Review planned modifications to <code className="text-neutral-200">{previewReport.repoOwner}/{previewReport.repoName}</code> ({previewReport.targetBranch}).
                      </p>
                    </div>
                  </div>

                  {/* 4 Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg">
                      <div className="text-[11px] text-neutral-400 uppercase font-mono">To Create</div>
                      <div className="text-xl font-bold text-emerald-400 font-mono">
                        {previewReport.filesToCreate.length}
                      </div>
                    </div>
                    <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg">
                      <div className="text-[11px] text-neutral-400 uppercase font-mono">To Modify</div>
                      <div className="text-xl font-bold text-sky-400 font-mono">
                        {previewReport.filesToModify.length}
                      </div>
                    </div>
                    <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg">
                      <div className="text-[11px] text-neutral-400 uppercase font-mono">To Preserve</div>
                      <div className="text-xl font-bold text-neutral-300 font-mono">
                        {previewReport.filesToPreserve.length}
                      </div>
                    </div>
                    <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg">
                      <div className="text-[11px] text-neutral-400 uppercase font-mono">Conflicts</div>
                      <div className={`text-xl font-bold font-mono ${
                        previewReport.conflicts.length > 0 ? 'text-amber-400' : 'text-neutral-500'
                      }`}>
                        {previewReport.conflicts.length}
                      </div>
                    </div>
                  </div>

                  {previewReport.warnings.length > 0 && (
                    <div className="p-3 bg-amber-950/20 border border-amber-800/60 rounded-lg space-y-1 text-amber-300 text-xs">
                      <span className="font-semibold">Safety Notices:</span>
                      <ul className="list-disc ps-5 space-y-0.5 text-[11px]">
                        {previewReport.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Change Plan Details Table */}
                  <div className="space-y-2">
                    <span className="font-semibold text-neutral-300 text-xs">File Resolution Actions</span>
                    <div className="max-h-60 overflow-y-auto border border-neutral-800 rounded-lg divide-y divide-neutral-850 bg-neutral-900/40">
                      {[...previewReport.conflicts, ...previewReport.filesToModify, ...previewReport.filesToCreate].map((item) => {
                        const isConflict = item.action === 'conflict';
                        const isModify = item.action === 'modify';
                        return (
                          <div key={item.path} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold shrink-0 ${
                                  isConflict
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                    : isModify
                                    ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                }`}
                              >
                                {item.action}
                              </span>
                              <span className="font-mono text-neutral-200 truncate">{item.path}</span>
                            </div>

                            {/* Resolution Selector */}
                            <div className="shrink-0">
                              {isConflict || isModify ? (
                                <select
                                  value={conflictResolutions[item.path] || item.conflictResolution || 'overwrite'}
                                  onChange={(e) =>
                                    handleResolutionChange(item.path, e.target.value as ConflictResolution)
                                  }
                                  className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-[11px] text-neutral-200 font-mono"
                                >
                                  <option value="overwrite">Overwrite with generated</option>
                                  <option value="preserve">Preserve existing repository file</option>
                                  <option value="suffix">Save as .harness copy</option>
                                  <option value="skip">Skip file</option>
                                </select>
                              ) : (
                                <span className="text-[11px] font-mono text-emerald-400">Ready to create</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explicit User Confirmation Checkbox */}
                  <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-neutral-200">
                      <input
                        type="checkbox"
                        checked={userConfirmed}
                        onChange={(e) => setUserConfirmed(e.target.checked)}
                        className="mt-0.5 rounded bg-neutral-800 border-neutral-700 text-sky-500"
                      />
                      <span className="leading-relaxed">
                        <strong>I have reviewed the planned changes</strong> and authorize creating an atomic Git commit
                        to repository branch <code className="text-neutral-100 font-mono">{previewReport.targetBranch}</code>.
                        No arbitrary execution or unexpected destructive writes will occur.
                      </span>
                    </label>
                  </div>

                  {/* Execute Button */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-neutral-500 font-mono">
                      Atomic Git Tree commit · Direct SHA reference
                    </span>
                    <Button
                      size="md"
                      variant="primary"
                      isLoading={isCommitting}
                      disabled={!userConfirmed}
                      onClick={handleExecuteCommit}
                      className="cursor-pointer"
                    >
                      Execute Commit & Push to GitHub
                    </Button>
                  </div>

                  {commitResult && (
                    <div
                      className={`p-4 rounded-xl border ${
                        commitResult.success
                          ? 'border-emerald-800/80 bg-emerald-950/20 text-emerald-300'
                          : 'border-rose-800/80 bg-rose-950/20 text-rose-300'
                      }`}
                    >
                      {commitResult.success ? (
                        <div className="space-y-2">
                          <p className="font-semibold text-sm">Commit Executed Successfully!</p>
                          <p className="text-neutral-300">
                            Pushed {commitResult.exportedFilesCount} files to{' '}
                            <code className="text-neutral-100 font-mono">{previewReport.targetBranch}</code>.
                          </p>
                          {commitResult.commitUrl && (
                            <a
                              href={commitResult.commitUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block text-xs text-sky-400 hover:text-sky-300 underline font-mono"
                            >
                              View Commit on GitHub →
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="font-semibold">{commitResult.error}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/60 rounded-b-2xl flex items-center justify-between text-xs text-neutral-500">
          <span>Local-First · Zero Secret Leaks · Controlled Mutation Policy</span>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
