/**
 * GitHub Repository Provider
 * Implements the RepositoryProvider interface for GitHub with connection verification,
 * branch inspection, change preview, conflict resolution, and atomic git commit execution.
 */

import {
  ExportResult,
  ExportTarget,
  RepositoryProviderId,
  RepositoryProviderInfo,
  DetailedProviderStatus,
} from '../../../domain/models';
import {
  ChangePreviewReport,
  CommitExecutionPlan,
  ConflictResolution,
  FileChangeAction,
  FileChangePlan,
} from '../../../domain/models/change-preview';
import { CredentialManager } from '../../../config/provider-config';
import { RepositoryProvider, RepositoryInspectionResult } from './repository-provider.interface';
import { GitHubRepositoryScanner } from './github-repository.scanner';


export interface GitHubAuthDetails {
  login: string;
  name?: string;
  avatarUrl?: string;
  scopes: string[];
  rateLimit: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

export interface GitHubRepoSummary {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  defaultBranch: string;
  isPrivate: boolean;
  description?: string;
  updatedAt: string;
}

export class GitHubRepositoryProvider implements RepositoryProvider {
  readonly id: RepositoryProviderId = 'github';
  readonly name = 'GitHub Repository Integration';

  private detailedStatus: DetailedProviderStatus = 'not_configured';
  private statusMessage = 'GitHub token not configured.';
  private authDetails: GitHubAuthDetails | null = null;
  private lastLatencyMs?: number;

  constructor() {
    this.refreshStatus();
  }

  private refreshStatus(): void {
    const hasToken = CredentialManager.hasRepoToken('github');
    if (hasToken) {
      this.detailedStatus = 'configured';
      this.statusMessage = 'GitHub Personal Access Token is configured.';
    } else {
      this.detailedStatus = 'not_configured';
      this.statusMessage = 'No GitHub Personal Access Token configured.';
    }
  }

  saveToken(token: string): void {
    CredentialManager.setRepoToken('github', token, true);
    this.refreshStatus();
  }

  clearToken(): void {
    CredentialManager.setRepoToken('github', '', true);
    this.authDetails = null;
    this.detailedStatus = 'not_configured';
    this.statusMessage = 'GitHub credentials cleared.';
  }

  getInfo(): RepositoryProviderInfo {
    const hasToken = CredentialManager.hasRepoToken('github');

    return {
      id: this.id,
      name: this.name,
      description:
        'Push generated Harness files, inspect branch structures, and preview changes via GitHub REST API.',
      capabilities: {
        requiresAuth: true,
        isLocalOnly: false,
        supportedFormats: ['github_direct', 'github_pr'],
      },
      isConfigured: hasToken,
      status: this.detailedStatus === 'connected' ? 'available' : hasToken ? 'unconfigured' : 'error',
      detailedStatus: this.detailedStatus,
      statusMessage: this.statusMessage,
      authenticatedUser: this.authDetails?.login,
    };
  }

  async isReady(): Promise<boolean> {
    return this.detailedStatus === 'connected' && Boolean(this.authDetails);
  }

  private getAuthHeaders(overrideToken?: string): Record<string, string> {
    const token = overrideToken ?? CredentialManager.getRepoToken('github');
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Harness-Engineering-Generator/1.0',
    };
    if (token) {
      headers.Authorization = `token ${token}`;
    }
    return headers;
  }

  /**
   * Test Connection to GitHub: validates token, fetches user profile, scopes, and rate limits.
   */
  async testConnection(customToken?: string): Promise<{
    success: boolean;
    auth?: GitHubAuthDetails;
    latencyMs: number;
    error?: string;
  }> {
    const token = customToken ?? CredentialManager.getRepoToken('github');
    const start = performance.now();
    this.detailedStatus = 'testing';
    this.statusMessage = 'Validating GitHub credentials...';

    if (!token) {
      this.detailedStatus = 'not_configured';
      this.statusMessage = 'No GitHub Personal Access Token provided.';
      return {
        success: false,
        latencyMs: 0,
        error: 'Please provide a GitHub Personal Access Token (classic or fine-grained).',
      };
    }

    try {
      const res = await fetch('https://api.github.com/user', {
        headers: this.getAuthHeaders(token),
      });

      const latencyMs = Math.round(performance.now() - start);
      this.lastLatencyMs = latencyMs;

      if (!res.ok) {
        this.detailedStatus = 'failed';
        this.statusMessage = `Authentication failed: HTTP ${res.status}`;
        let errorMsg = `GitHub responded with HTTP ${res.status}: ${res.statusText}`;
        if (res.status === 401) {
          errorMsg = 'Bad credentials. The token is invalid or expired.';
        }
        return { success: false, latencyMs, error: errorMsg };
      }

      const userData = await res.json();
      const scopesHeader = res.headers.get('x-oauth-scopes') || '';
      const scopes = scopesHeader.split(',').map((s) => s.trim()).filter(Boolean);

      const limit = Number(res.headers.get('x-ratelimit-limit') || '5000');
      const remaining = Number(res.headers.get('x-ratelimit-remaining') || '5000');
      const reset = Number(res.headers.get('x-ratelimit-reset') || '0');

      const auth: GitHubAuthDetails = {
        login: userData.login,
        name: userData.name,
        avatarUrl: userData.avatar_url,
        scopes,
        rateLimit: { limit, remaining, reset },
      };

      this.authDetails = auth;
      this.detailedStatus = 'connected';
      this.statusMessage = `Connected as @${auth.login} (${remaining}/${limit} API calls remaining)`;

      if (customToken) {
        this.saveToken(customToken);
      }

      return {
        success: true,
        auth,
        latencyMs,
      };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - start);
      this.detailedStatus = 'failed';
      const msg = (err as Error).message || 'Network error';
      this.statusMessage = `Failed to connect: ${msg}`;
      return {
        success: false,
        latencyMs,
        error: `Could not reach GitHub API: ${msg}`,
      };
    }
  }

  /**
   * List repositories accessible to the authenticated user.
   */
  async listUserRepositories(page = 1): Promise<GitHubRepoSummary[]> {
    const token = CredentialManager.getRepoToken('github');
    if (!token) return [];

    try {
      const res = await fetch(
        `https://api.github.com/user/repos?sort=updated&per_page=30&page=${page}`,
        { headers: this.getAuthHeaders(token) },
      );

      if (!res.ok) return [];

      const list = await res.json();
      if (!Array.isArray(list)) return [];

      return list.map((r: {
        id: number;
        full_name: string;
        name: string;
        owner?: { login?: string };
        default_branch?: string;
        private?: boolean;
        description?: string;
        updated_at?: string;
      }) => ({
        id: r.id,
        fullName: r.full_name,
        name: r.name,
        owner: r.owner?.login || '',
        defaultBranch: r.default_branch || 'main',
        isPrivate: Boolean(r.private),
        description: r.description || undefined,
        updatedAt: r.updated_at || '',
      }));
    } catch {
      return [];
    }
  }

  /**
   * Inspect destination repository branch and structure
   */
  async inspectRepository(target: ExportTarget): Promise<RepositoryInspectionResult> {
    const owner = target.repoOwner || '';
    const repo = target.repoName || '';
    const branch = target.branchName || 'main';

    if (!owner || !repo) {
      throw new Error('Repository owner and name are required for inspection.');
    }

    const scanResult = await GitHubRepositoryScanner.scan(`${owner}/${repo}`);
    const filePaths = scanResult.files.map((f) => f.path);
    const existingDocFiles = filePaths.filter((p) => p.endsWith('.md') || p.includes('docs/'));
    const hasExistingHarness = filePaths.some((p) => p.includes('AGENT') || p.includes('.harness'));

    return {
      detectedPlatform: 'GitHub',
      detectedLanguages: ['TypeScript/JavaScript'],
      existingDocFiles,
      hasExistingHarness,
      branchName: branch,
    };
  }


  /**
   * Fetch all tree files from target repository branch for change preview
   */
  async fetchExistingBranchFiles(
    owner: string,
    repo: string,
    branch: string,
  ): Promise<Map<string, { sha: string; size: number }>> {
    const token = CredentialManager.getRepoToken('github');
    const filesMap = new Map<string, { sha: string; size: number }>();

    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
        { headers: this.getAuthHeaders(token) },
      );

      if (!res.ok) return filesMap;

      const data = await res.json();
      if (Array.isArray(data.tree)) {
        for (const item of data.tree) {
          if (item.type === 'blob') {
            filesMap.set(item.path, { sha: item.sha, size: item.size || 0 });
          }
        }
      }
    } catch {
      // Fallback empty if branch doesn't exist yet
    }

    return filesMap;
  }

  /**
   * Generate a comprehensive Change Preview & Conflict Resolution Report
   */
  async generateChangePreview(
    target: ExportTarget,
    artifacts: Array<{ path: string; content: string; isExecutable?: boolean }>,
  ): Promise<ChangePreviewReport> {
    const owner = target.repoOwner || '';
    const repo = target.repoName || '';
    const targetBranch = target.branchName || 'main';

    if (!owner || !repo) {
      throw new Error('Owner and repository name are required for preview.');
    }

    // Fetch existing files from target branch
    const existingFiles = await this.fetchExistingBranchFiles(owner, repo, targetBranch);
    const isNewBranch = existingFiles.size === 0;

    const filesToCreate: FileChangePlan[] = [];
    const filesToModify: FileChangePlan[] = [];
    const filesToPreserve: FileChangePlan[] = [];
    const conflicts: FileChangePlan[] = [];
    const warnings: string[] = [];

    if (isNewBranch) {
      warnings.push(`Target branch "${targetBranch}" will be created fresh from repository default branch.`);
    }

    for (const artifact of artifacts) {
      const cleanPath = artifact.path.replace(/^[/\\]+/, '');
      const existing = existingFiles.get(cleanPath);

      if (!existing) {
        // File does not exist -> Safe create
        filesToCreate.push({
          path: cleanPath,
          action: 'create',
          newContent: artifact.content,
          isExecutable: artifact.isExecutable,
        });
      } else {
        // File exists! Detect if content differs or if it's a critical root file
        const isCriticalRootFile =
          cleanPath === 'README.md' ||
          cleanPath === 'package.json' ||
          cleanPath === 'tsconfig.json' ||
          cleanPath === '.gitignore';

        if (isCriticalRootFile) {
          conflicts.push({
            path: cleanPath,
            action: 'conflict',
            existingSha: existing.sha,
            newContent: artifact.content,
            conflictResolution: 'preserve', // safe default for critical existing files
            warning: `Existing critical file "${cleanPath}" already present. Defaulting to preserve to prevent overwriting repository setup.`,
            isExecutable: artifact.isExecutable,
          });
        } else {
          // File exists and will be updated
          filesToModify.push({
            path: cleanPath,
            action: 'modify',
            existingSha: existing.sha,
            newContent: artifact.content,
            conflictResolution: 'overwrite',
            warning: `File "${cleanPath}" already exists on branch and will be updated with latest generated Harness content.`,
            isExecutable: artifact.isExecutable,
          });
        }
      }
    }

    if (conflicts.length > 0) {
      warnings.push(
        `${conflicts.length} existing files detected with potential conflict. Review resolution actions below before confirming.`,
      );
    }

    return {
      repoOwner: owner,
      repoName: repo,
      targetBranch,
      isNewBranch,
      filesToCreate,
      filesToModify,
      filesToPreserve,
      conflicts,
      warnings,
      canProceed: true,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Execute atomic commit of Harness artifacts to GitHub
   * STRICT REQUIREMENT: Only executes after explicit user confirmation!
   */
  async executeCommit(plan: CommitExecutionPlan): Promise<ExportResult> {
    if (!plan.userConfirmed) {
      return {
        success: false,
        format: 'github_direct',
        exportedFilesCount: 0,
        exportedAt: new Date().toISOString(),
        error: 'Execution aborted: User confirmation is strictly required prior to repository write.',
      };
    }

    const token = CredentialManager.getRepoToken('github');
    if (!token) {
      return {
        success: false,
        format: 'github_direct',
        exportedFilesCount: 0,
        exportedAt: new Date().toISOString(),
        error: 'No GitHub token configured. Please authenticate in Provider Settings.',
      };
    }

    const { repoOwner: owner, repoName: repo, branchName: branch, changes, commitMessage } = plan;

    try {
      const headers = this.getAuthHeaders(token);

      // 1. Get repository details to find default branch
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (!repoRes.ok) {
        throw new Error(`Repository ${owner}/${repo} not found or inaccessible (HTTP ${repoRes.status}).`);
      }
      const repoData = await repoRes.json();
      const defaultBranch = repoData.default_branch || 'main';

      // 2. Get head commit SHA for base branch
      let baseSha = '';
      const baseBranch = plan.baseBranch || defaultBranch;
      const refRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
        { headers },
      );

      let branchExists = false;
      if (refRes.ok) {
        const refData = await refRes.json();
        baseSha = refData.object.sha;
        branchExists = true;
      } else {
        // Branch does not exist yet; get base branch commit
        const baseRefRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(baseBranch)}`,
          { headers },
        );
        if (!baseRefRes.ok) {
          throw new Error(`Base branch "${baseBranch}" not found in repository.`);
        }
        const baseRefData = await baseRefRes.json();
        baseSha = baseRefData.object.sha;
      }

      // 3. Prepare filtered changes applying conflict resolutions
      const activeChanges: Array<{ path: string; content: string; mode: string }> = [];

      for (const change of changes) {
        if (change.conflictResolution === 'skip' || change.conflictResolution === 'preserve') {
          // User chose to preserve existing or skip writing
          continue;
        }

        let targetPath = change.path;
        if (change.conflictResolution === 'suffix') {
          // Append .harness suffix before file extension
          const parts = targetPath.split('.');
          if (parts.length > 1) {
            const ext = parts.pop();
            targetPath = `${parts.join('.')}.harness.${ext}`;
          } else {
            targetPath = `${targetPath}.harness`;
          }
        }

        const isExec = Boolean(change.isExecutable || targetPath.endsWith('.sh'));
        activeChanges.push({
          path: targetPath,
          content: change.newContent,
          mode: isExec ? '100755' : '100644',
        });
      }

      if (activeChanges.length === 0) {
        return {
          success: true,
          format: 'github_direct',
          repositoryUrl: `https://github.com/${owner}/${repo}/tree/${branch}`,
          exportedFilesCount: 0,
          exportedAt: new Date().toISOString(),
        };
      }

      // 4. Create Git Blobs for all active changes
      const treeEntries: Array<{ path: string; mode: string; type: string; sha: string }> = [];

      for (const item of activeChanges) {
        const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: item.content,
            encoding: 'utf-8',
          }),
        });

        if (!blobRes.ok) {
          throw new Error(`Failed to create Git blob for "${item.path}": HTTP ${blobRes.status}`);
        }

        const blobData = await blobRes.json();
        treeEntries.push({
          path: item.path,
          mode: item.mode,
          type: 'blob',
          sha: blobData.sha,
        });
      }

      // 5. Create Git Tree based on base commit tree
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_tree: baseSha,
          tree: treeEntries,
        }),
      });

      if (!treeRes.ok) {
        throw new Error(`Failed to create Git tree: HTTP ${treeRes.status}`);
      }

      const treeData = await treeRes.json();

      // 6. Create Git Commit
      const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: commitMessage || 'feat: generate engineering harness structure\n\nGenerated with Harness Engineering Architect.',
          tree: treeData.sha,
          parents: [baseSha],
        }),
      });

      if (!commitRes.ok) {
        throw new Error(`Failed to create Git commit: HTTP ${commitRes.status}`);
      }

      const commitData = await commitRes.json();
      const newCommitSha = commitData.sha;

      // 7. Update branch ref or create new branch ref
      if (branchExists) {
        const updateRefRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
          {
            method: 'PATCH',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sha: newCommitSha,
              force: false,
            }),
          },
        );

        if (!updateRefRes.ok) {
          throw new Error(`Failed to update branch reference: HTTP ${updateRefRes.status}`);
        }
      } else {
        const createRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ref: `refs/heads/${branch}`,
            sha: newCommitSha,
          }),
        });

        if (!createRefRes.ok) {
          throw new Error(`Failed to create new branch reference: HTTP ${createRefRes.status}`);
        }
      }

      const commitUrl = `https://github.com/${owner}/${repo}/commit/${newCommitSha}`;
      const repositoryUrl = `https://github.com/${owner}/${repo}/tree/${branch}`;

      return {
        success: true,
        format: 'github_direct',
        repositoryUrl,
        commitUrl,
        exportedFilesCount: activeChanges.length,
        exportedAt: new Date().toISOString(),
      };
    } catch (err: unknown) {
      return {
        success: false,
        format: 'github_direct',
        exportedFilesCount: 0,
        exportedAt: new Date().toISOString(),
        error: (err as Error).message || 'Failed to execute commit to GitHub.',
      };
    }
  }

  /**
   * Export artifacts using default target config
   */
  async exportArtifacts(
    target: ExportTarget,
    artifacts: Array<{ path: string; content: string }>,
  ): Promise<ExportResult> {
    const preview = await this.generateChangePreview(target, artifacts);
    return this.executeCommit({
      repoOwner: preview.repoOwner,
      repoName: preview.repoName,
      branchName: preview.targetBranch,
      createBranchIfMissing: preview.isNewBranch,
      commitMessage: target.commitMessage || 'feat: scaffold AI engineering harness',
      changes: [...preview.filesToCreate, ...preview.filesToModify, ...preview.conflicts],
      userConfirmed: true,
    });
  }
}
