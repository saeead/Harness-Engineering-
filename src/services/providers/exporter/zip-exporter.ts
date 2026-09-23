/**
 * ZIP Archive Exporter
 * Generates a complete ZIP archive preserving directory hierarchy, filenames, and contents.
 */

import JSZip from 'jszip';
import { ArtifactFile, Exporter } from './exporter.interface';
import { ExportFormat, ExportResult, ExportTarget } from '../../../domain/models';

export class ZipExporter implements Exporter {
  readonly id = 'zip_exporter';
  readonly format: ExportFormat = 'zip';
  readonly name = 'ZIP Archive Exporter';

  canExport(format: ExportFormat): boolean {
    return format === 'zip';
  }

  async export(artifacts: ArtifactFile[], target: ExportTarget): Promise<ExportResult> {
    try {
      const zip = new JSZip();

      for (const artifact of artifacts) {
        // Sanitize path (strip leading slashes or dots)
        const cleanPath = artifact.path.replace(/^[/\\]+/, '');
        
        // Add file with appropriate unix permission metadata if executable
        if (artifact.isExecutable || cleanPath.endsWith('.sh')) {
          zip.file(cleanPath, artifact.content, {
            unixPermissions: '755',
          });
        } else {
          zip.file(cleanPath, artifact.content);
        }
      }

      // Generate compressed binary blob
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      // Construct sensible archive filename
      const baseName = (target.destinationPath || target.repoName || 'harness-project')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-');
      const filename = `${baseName}-harness.zip`;

      // Trigger client-side download if in browser environment
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Defer revoke to ensure download initiation
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);

        return {
          success: true,
          format: 'zip',
          downloadUrl,
          exportedFilesCount: artifacts.length,
          exportedAt: new Date().toISOString(),
        };
      }

      return {
        success: true,
        format: 'zip',
        exportedFilesCount: artifacts.length,
        exportedAt: new Date().toISOString(),
      };
    } catch (err: unknown) {
      return {
        success: false,
        format: 'zip',
        exportedFilesCount: 0,
        exportedAt: new Date().toISOString(),
        error: (err as Error).message || 'Failed to generate ZIP archive.',
      };
    }
  }
}
