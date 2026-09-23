/**
 * Export Domain Models
 * Defines supported export formats, export options, and results.
 */

export type ExportFormat =
  | 'zip'
  | 'github_pr'
  | 'github_direct'
  | 'directory_bundle'
  | 'raw_json';

export interface ExportTarget {
  format: ExportFormat;
  destinationPath?: string;
  repoOwner?: string;
  repoName?: string;
  branchName?: string;
  commitMessage?: string;
}

export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  downloadUrl?: string;
  repositoryUrl?: string;
  commitUrl?: string;
  destinationPath?: string;
  exportedFilesCount: number;
  exportedAt: string;
  error?: string;
}

