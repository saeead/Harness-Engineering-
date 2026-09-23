/**
 * Exporter Registry
 * Manages export formats and output destinations.
 */

import { ExportFormat } from '../../../domain/models';
import { Exporter } from './exporter.interface';
import { ZipExporter } from './zip-exporter';
import { LocalDirectoryExporter } from './local-directory-exporter';
import { JsonExporter } from './json-exporter';

class ExporterRegistry {
  private exporters = new Map<ExportFormat, Exporter>();

  constructor() {
    this.register(new ZipExporter());
    this.register(new LocalDirectoryExporter());
    this.register(new JsonExporter());
  }

  register(exporter: Exporter): void {
    this.exporters.set(exporter.format, exporter);
  }


  get(format: ExportFormat): Exporter | undefined {
    return this.exporters.get(format);
  }

  getSupportedFormats(): ExportFormat[] {
    return Array.from(this.exporters.keys());
  }
}

export const exporterRegistry = new ExporterRegistry();
