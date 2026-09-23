/**
 * Exporter Interface
 * Abstraction layer for generating distributable bundles (ZIP, GitHub PR, filesystem directory, etc.)
 */

import { ExportFormat, ExportResult, ExportTarget } from '../../../domain/models';

export interface ArtifactFile {
  path: string;
  content: string;
  isExecutable?: boolean;
}

export interface Exporter {
  readonly id: string;
  readonly format: ExportFormat;
  readonly name: string;

  canExport(format: ExportFormat): boolean;
  export(artifacts: ArtifactFile[], target: ExportTarget): Promise<ExportResult>;
}
