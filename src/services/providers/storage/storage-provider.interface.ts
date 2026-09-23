/**
 * Storage Provider Interface
 * Abstraction layer for local-first persistence (LocalStorage, IndexedDB, Memory).
 */

import { Project, StorageProviderId, StorageProviderInfo } from '../../../domain/models';

export interface StorageProvider {
  readonly id: StorageProviderId;
  readonly name: string;

  getInfo(): StorageProviderInfo;
  isAvailable(): boolean;

  saveProject(project: Project): Promise<void>;
  getProject(id: string): Promise<Project | null>;
  listProjects(): Promise<Project[]>;
  deleteProject(id: string): Promise<void>;
  clearAll(): Promise<void>;
}
