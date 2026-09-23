/**
 * GitHub Repository Safe Scanner
 * Queries public GitHub repositories using the read-only GitHub REST API Git Trees endpoint.
 * SAFETY GUARANTEE: Read-only operations. Never modifies, commits, or executes repository code.
 */

import { CredentialManager } from '../../../config/provider-config';
import { AppError } from '../../../core/errors/app-error';

export interface GitHubScanResult {
  owner: string;
  repo: string;
  defaultBranch: string;
  files: Array<{ path: string; sizeBytes?: number }>;
  rateLimitRemaining?: number;
}

export class GitHubRepositoryScanner {
  /**
   * Scans a GitHub repository URL or slug (e.g. "owner/repo" or "https://github.com/owner/repo")
   */
  public static async scan(repoUrlOrSlug: string): Promise<GitHubScanResult> {
    const parsed = this.parseRepoSlug(repoUrlOrSlug);
    if (!parsed) {
      throw new AppError({
        category: 'repository',
        userMessage: 'Invalid GitHub repository URL or slug. Use format "owner/repo" or "https://github.com/owner/repo".',
        technicalDetails: { input: repoUrlOrSlug },
      });
    }

    const { owner, repo } = parsed;
    const token = CredentialManager.getRepoToken('github');

    const headers: Record<string, string> = {

      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Harness-Engineering-Generator/1.0',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // 1. Fetch Repository Metadata to get default branch
    let defaultBranch = 'main';
    try {
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers,
      });

      if (repoRes.status === 404) {
        throw new AppError({
          category: 'repository',
          userMessage: `GitHub repository "${owner}/${repo}" was not found or is private without token authentication.`,
        });
      }

      if (repoRes.status === 403) {
        const rateLimitRemaining = repoRes.headers.get('x-ratelimit-remaining');
        if (rateLimitRemaining === '0') {
          throw new AppError({
            category: 'repository',
            userMessage: 'GitHub API rate limit exceeded for unauthenticated requests. You can test immediately using Safe Sample Fixtures or provide a token in Settings.',
          });
        }
      }

      if (!repoRes.ok) {
        throw new AppError({
          category: 'repository',
          userMessage: `Failed to inspect GitHub repository (HTTP ${repoRes.status}).`,
        });
      }

      const repoData = await repoRes.json();
      defaultBranch = repoData.default_branch || 'main';
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        category: 'repository',
        userMessage: `Network error connecting to GitHub: ${(err as Error).message}`,
        technicalDetails: err,
      });
    }

    // 2. Fetch Git Tree recursively (read-only)
    try {
      const treeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
        { headers },
      );

      if (!treeRes.ok) {
        throw new AppError({
          category: 'repository',
          userMessage: `Failed to retrieve repository tree for "${owner}/${repo}" on branch "${defaultBranch}".`,
        });
      }

      const rateLimitRemaining = parseInt(treeRes.headers.get('x-ratelimit-remaining') || '60', 10);
      const treeData = await treeRes.json();

      if (!treeData.tree || !Array.isArray(treeData.tree)) {
        throw new AppError({
          category: 'repository',
          userMessage: 'Unexpected repository tree format returned from GitHub.',
        });
      }

      // Filter only blobs (files), exclude git submodules and trees
      const files: Array<{ path: string; sizeBytes?: number }> = treeData.tree
        .filter((item: { type: string; path: string }) => item.type === 'blob')
        .map((item: { path: string; size?: number }) => ({
          path: item.path,
          sizeBytes: item.size,
        }));

      return {
        owner,
        repo,
        defaultBranch,
        files,
        rateLimitRemaining,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError({
        category: 'repository',
        userMessage: `Failed to read GitHub repository files: ${(err as Error).message}`,
        technicalDetails: err,
      });
    }
  }

  /**
   * Parses owner and repository name from URL or slug string
   */
  public static parseRepoSlug(input: string): { owner: string; repo: string } | null {
    const clean = input.trim();
    if (!clean) return null;

    // Handle "https://github.com/owner/repo" or "http://github.com/owner/repo"
    const urlMatch = clean.match(/github\.com\/([a-zA-Z0-9_\-.]+)\/([a-zA-Z0-9_\-.]+)/);
    if (urlMatch) {
      return {
        owner: urlMatch[1],
        repo: urlMatch[2].replace(/\.git$/, ''),
      };
    }

    // Handle "owner/repo"
    const slugMatch = clean.match(/^([a-zA-Z0-9_\-.]+)\/([a-zA-Z0-9_\-.]+)$/);
    if (slugMatch) {
      return {
        owner: slugMatch[1],
        repo: slugMatch[2].replace(/\.git$/, ''),
      };
    }

    return null;
  }
}
