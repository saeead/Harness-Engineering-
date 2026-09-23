/**
 * Local Directory Exporter
 * Exports files directly to a chosen user directory on disk via the File System Access API.
 */

import { ArtifactFile, Exporter } from './exporter.interface';
import { ExportFormat, ExportResult, ExportTarget } from '../../../domain/models';

export class LocalDirectoryExporter implements Exporter {
  readonly id = 'directory_exporter';
  readonly format: ExportFormat = 'directory_bundle';
  readonly name = 'Local Directory Exporter';

  canExport(format: ExportFormat): boolean {
    return format === 'directory_bundle';
  }

  /**
   * Check if the browser environment supports the File System Access API.
   */
  static isFileSystemAccessSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function'
    );
  }

  async export(artifacts: ArtifactFile[], target: ExportTarget): Promise<ExportResult> {
    if (!LocalDirectoryExporter.isFileSystemAccessSupported()) {
      return {
        success: false,
        format: 'directory_bundle',
        exportedFilesCount: 0,
        exportedAt: new Date().toISOString(),
        error:
          'File System Access API (showDirectoryPicker) is not supported in this browser. Please use the ZIP export option instead.',
      };
    }

    try {
      // Prompt user to select destination folder
      const dirHandle = await (window as unknown as {
        showDirectoryPicker: (options?: { mode?: string }) => Promise<FileSystemDirectoryHandle>;
      }).showDirectoryPicker({ mode: 'readwrite' });

      let writtenCount = 0;

      for (const artifact of artifacts) {
        const cleanPath = artifact.path.replace(/^[/\\]+/, '');
        const segments = cleanPath.split(/[/\\]/);
        const fileName = segments.pop();

        if (!fileName) continue;

        // Traverse / create directory hierarchy
        let currentDir = dirHandle;
        for (const segment of segments) {
          currentDir = await currentDir.getDirectoryHandle(segment, { create: true });
        }

        // Write file contents
        const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(artifact.content);
        await writable.close();
        writtenCount++;
      }

      return {
        success: true,
        format: 'directory_bundle',
        destinationPath: dirHandle.name,
        exportedFilesCount: writtenCount,
        exportedAt: new Date().toISOString(),
      };
    } catch (err: unknown) {
      const error = err as Error;
      // If user cancelled directory picker, return graceful cancellation
      if (error.name === 'AbortError') {
        return {
          success: false,
          format: 'directory_bundle',
          exportedFilesCount: 0,
          exportedAt: new Date().toISOString(),
          error: 'Export was cancelled by user.',
        };
      }

      return {
        success: false,
        format: 'directory_bundle',
        exportedFilesCount: 0,
        exportedAt: new Date().toISOString(),
        error: error.message || 'Failed to write files to local directory.',
      };
    }
  }
}
