/**
 * Browser LocalStorage Provider
 * Implements local-first persistent storage without sending data to external backends.
 */

import { Project, StorageProviderId, StorageProviderInfo } from '../../../domain/models';
import { StorageProvider } from './storage-provider.interface';

const STORAGE_PREFIX = 'harness_gen:projects';

export class BrowserLocalStorageProvider implements StorageProvider {
  readonly id: StorageProviderId = 'browser_local';
  readonly name = 'Browser Local Storage';

  getInfo(): StorageProviderInfo {
    return {
      id: this.id,
      name: this.name,
      isSupported: this.isAvailable(),
    };
  }

  isAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private getStore(): Record<string, Project> {
    if (!this.isAvailable()) return {};
    try {
      const raw = window.localStorage.getItem(STORAGE_PREFIX);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private setStore(store: Record<string, Project>): void {
    if (!this.isAvailable()) return;
    try {
      window.localStorage.setItem(STORAGE_PREFIX, JSON.stringify(store));
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }
  }

  async saveProject(project: Project): Promise<void> {
    const store = this.getStore();
    store[project.id] = {
      ...project,
      updatedAt: new Date().toISOString(),
    };
    this.setStore(store);
  }

  async getProject(id: string): Promise<Project | null> {
    const store = this.getStore();
    return store[id] || null;
  }

  async listProjects(): Promise<Project[]> {
    const store = this.getStore();
    return Object.values(store).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  async deleteProject(id: string): Promise<void> {
    const store = this.getStore();
    if (store[id]) {
      delete store[id];
      this.setStore(store);
    }
  }

  async clearAll(): Promise<void> {
    if (this.isAvailable()) {
      window.localStorage.removeItem(STORAGE_PREFIX);
    }
  }
}
