/**
 * Repository Provider Interface
 * Abstraction layer for git hosting platforms and storage targets (GitHub, Local Git, etc.).
 */

import {
  ExportResult,
  ExportTarget,
  RepositoryProviderId,
  RepositoryProviderInfo,
} from '../../../domain/models';

export interface RepositoryInspectionResult {
  detectedPlatform: string;
  detectedLanguages: string[];
  existingDocFiles: string[];
  hasExistingHarness: boolean;
  branchName: string;
}

export interface RepositoryProvider {
  readonly id: RepositoryProviderId;
  readonly name: string;

  getInfo(): RepositoryProviderInfo;
  isReady(): Promise<boolean>;

  inspectRepository(target: ExportTarget): Promise<RepositoryInspectionResult>;

  exportArtifacts(
    target: ExportTarget,
    artifacts: Array<{ path: string; content: string }>,
  ): Promise<ExportResult>;
}
