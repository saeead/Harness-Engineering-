/**
 * JSON Exporter
 * Exports generated harness artifacts and metadata as a structured JSON bundle.
 */

import { ArtifactFile, Exporter } from './exporter.interface';
import { ExportFormat, ExportResult, ExportTarget } from '../../../domain/models';

export class JsonExporter implements Exporter {
  readonly id = 'json_exporter';
  readonly format: ExportFormat = 'raw_json';
  readonly name = 'Structured JSON Exporter';

  canExport(format: ExportFormat): boolean {
    return format === 'raw_json';
  }

  async export(artifacts: ArtifactFile[], target: ExportTarget): Promise<ExportResult> {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        target,
        fileCount: artifacts.length,
        files: artifacts.map((a) => ({
          path: a.path,
          isExecutable: Boolean(a.isExecutable),
          content: a.content,
        })),
      };

      const jsonString = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(blob);

      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${target.repoName || 'harness'}-bundle.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
      }

      return {
        success: true,
        format: 'raw_json',
        downloadUrl,
        exportedFilesCount: artifacts.length,
        exportedAt: new Date().toISOString(),
      };
    } catch (err: unknown) {
      return {
        success: false,
        format: 'raw_json',
        exportedFilesCount: 0,
        exportedAt: new Date().toISOString(),
        error: (err as Error).message || 'Failed to export JSON bundle.',
      };
    }
  }
}
