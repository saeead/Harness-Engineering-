/**
 * Change Preview & Conflict Resolution Domain Models
 * Explicit contract for inspecting, previewing, and approving file mutations.
 */

export type FileChangeAction = 'create' | 'modify' | 'preserve' | 'conflict';

export type ConflictResolution = 'overwrite' | 'preserve' | 'suffix' | 'skip';

export interface FileChangePlan {
  path: string;
  action: FileChangeAction;
  existingSha?: string;
  existingContent?: string;
  newContent: string;
  conflictResolution?: ConflictResolution;
  diffSummary?: string;
  warning?: string;
  isExecutable?: boolean;
}

export interface ChangePreviewReport {
  repoOwner: string;
  repoName: string;
  targetBranch: string;
  baseBranch?: string;
  isNewBranch: boolean;
  filesToCreate: FileChangePlan[];
  filesToModify: FileChangePlan[];
  filesToPreserve: FileChangePlan[];
  conflicts: FileChangePlan[];
  warnings: string[];
  canProceed: boolean;
  generatedAt: string;
}

export interface CommitExecutionPlan {
  repoOwner: string;
  repoName: string;
  branchName: string;
  createBranchIfMissing: boolean;
  baseBranch?: string;
  commitMessage: string;
  changes: FileChangePlan[];
  userConfirmed: boolean;
}
